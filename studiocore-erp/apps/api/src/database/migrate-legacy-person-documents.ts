import 'reflect-metadata';
import { Repository } from 'typeorm';
import { ObjectStorageService } from '../common/services/object-storage.service';
import {
  buildPersonDocumentStoragePath,
  extractDocumentFileExtension,
  extractDocumentFileNameFromUrl,
  mergeDocumentNotes,
  resolvePersonDocumentStorageState,
} from '../modules/people/person-document-storage';
import { AppDataSource } from './data-source';
import { PersonDocument } from './entities/person-document.entity';

type DownloadedBinaryFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

async function run() {
  const dryRun = process.env.LEGACY_DOCUMENTS_MIGRATION_DRY_RUN !== 'false';
  const companyId = parseOptionalNumber(process.env.LEGACY_DOCUMENTS_MIGRATION_COMPANY_ID);
  const personId = parseOptionalNumber(process.env.LEGACY_DOCUMENTS_MIGRATION_PERSON_ID);
  const documentId = parseOptionalNumber(process.env.LEGACY_DOCUMENTS_MIGRATION_DOCUMENT_ID);
  const limit = parseOptionalNumber(process.env.LEGACY_DOCUMENTS_MIGRATION_LIMIT) ?? 100;

  await AppDataSource.initialize();

  try {
    const repository = AppDataSource.getRepository(PersonDocument);
    const storageService = new ObjectStorageService();
    const documents = await listCandidateDocuments(repository, { companyId, personId, documentId, limit });

    if (!documents.length) {
      process.stdout.write('No external person documents are pending migration\n');
      return;
    }

    let migrated = 0;
    let failed = 0;

    for (const document of documents) {
      if (dryRun) {
        process.stdout.write(`[DRY RUN] document #${document.id} -> ${document.publicUrl}\n`);
        continue;
      }

      try {
        const downloaded = await downloadExternalDocument(document);
        const storageKey = buildPersonDocumentStoragePath({
          companyId: document.companyId,
          personId: document.personId,
          documentId: document.id,
          label: document.legacyLabel ?? document.label,
          originalFileName: downloaded.originalname,
          mimeType: downloaded.mimetype,
        });
        const upload = await storageService.uploadObject({
          bucket: storageService.getDefaultBucket(),
          key: storageKey,
          body: downloaded.buffer,
          contentType: downloaded.mimetype,
          contentDisposition: `inline; filename="${downloaded.originalname}"`,
        });

        await repository.update(
          { id: document.id },
          {
            storageBucket: upload.bucket,
            storagePath: upload.key,
            publicUrl: upload.publicUrl ?? document.publicUrl,
            fileType: document.fileType || downloaded.mimetype,
            notes: mergeDocumentNotes(document.notes, 'Migrado por script a storage gestionado.'),
          },
        );

        migrated += 1;
        process.stdout.write(`Migrated document #${document.id} to ${upload.bucket}/${upload.key}\n`);
      } catch (error) {
        failed += 1;
        process.stderr.write(`Failed document #${document.id}: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    process.stdout.write(`${dryRun ? '[DRY RUN] ' : ''}Document migration summary: total=${documents.length} migrated=${migrated} failed=${failed}\n`);
  } finally {
    await AppDataSource.destroy();
  }
}

async function listCandidateDocuments(
  repository: Repository<PersonDocument>,
  filters: {
    companyId: number | null;
    personId: number | null;
    documentId: number | null;
    limit: number;
  },
) {
  const qb = repository.createQueryBuilder('document');
  qb.where('document.deleted_at IS NULL')
    .andWhere('document.public_url IS NOT NULL')
    .andWhere('(document.storage_bucket IS NULL OR document.storage_path IS NULL)');

  if (filters.companyId) {
    qb.andWhere('document.company_id = :companyId', { companyId: filters.companyId });
  }

  if (filters.personId) {
    qb.andWhere('document.person_id = :personId', { personId: filters.personId });
  }

  if (filters.documentId) {
    qb.andWhere('document.id = :documentId', { documentId: filters.documentId });
  }

  qb.orderBy('document.id', 'ASC').take(filters.limit);
  const documents = await qb.getMany();
  return documents.filter((document) => resolvePersonDocumentStorageState(document) === 'external');
}

async function downloadExternalDocument(document: PersonDocument): Promise<DownloadedBinaryFile> {
  if (!document.publicUrl) {
    throw new Error('Document has no public URL');
  }

  const response = await fetch(document.publicUrl);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status} ${response.statusText}`.trim());
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new Error('Downloaded file is empty');
  }

  const mimetype = response.headers.get('content-type')?.split(';')[0].trim() || document.fileType || 'application/octet-stream';
  const originalname = resolveExternalDocumentName(document.publicUrl, document, mimetype);
  return { buffer, mimetype, originalname };
}

function resolveExternalDocumentName(sourceUrl: string, document: PersonDocument, mimeType: string) {
  const fromUrl = extractDocumentFileNameFromUrl(sourceUrl);
  if (fromUrl) {
    return fromUrl;
  }

  const extension = extractDocumentFileExtension(null, mimeType);
  const normalizedLabel = (document.legacyLabel || document.label || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'document';
  return `${normalizedLabel}.${extension}`;
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

run().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
