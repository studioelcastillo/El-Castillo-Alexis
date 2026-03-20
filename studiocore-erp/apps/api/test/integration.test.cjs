const assert = require('node:assert/strict');
const test = require('node:test');
const { closeTestContext, createTestContext } = require('./support/test-app.cjs');

test('companies CRUD integration flow', async () => {
  const context = await createTestContext();

  try {
    const createResponse = await context.request
      .post('/api/v1/companies')
      .set('Authorization', context.authHeader)
      .send({
        name: 'StudioCore Holdings',
        legalName: 'StudioCore Holdings SAS',
        taxId: '900000002',
        email: 'holdings@studiocore.local',
        phone: '3000003333',
      })
      .expect(201);

    assert.equal(createResponse.body.data.name, 'StudioCore Holdings');

    const updateResponse = await context.request
      .patch(`/api/v1/companies/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        legalName: 'StudioCore Holdings Group SAS',
        phone: '3009998888',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.legalName, 'StudioCore Holdings Group SAS');
    assert.equal(updateResponse.body.data.phone, '3009998888');

    const listResponse = await context.request
      .get('/api/v1/companies')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 2);
  } finally {
    await closeTestContext(context);
  }
});

test('branches CRUD integration flow', async () => {
  const context = await createTestContext();

  try {
    const createResponse = await context.request
      .post('/api/v1/branches')
      .set('Authorization', context.authHeader)
      .send({
        name: 'Sede Occidente',
        code: 'WEST',
        city: 'Medellin',
        address: 'Carrera 45 10-20',
        phone: '6041234567',
      })
      .expect(201);

    const branchId = createResponse.body.data.id;
    assert.equal(createResponse.body.data.code, 'WEST');

    const updateResponse = await context.request
      .patch(`/api/v1/branches/${branchId}`)
      .set('Authorization', context.authHeader)
      .send({ city: 'Cali', phone: '6021112233' })
      .expect(200);

    assert.equal(updateResponse.body.data.city, 'Cali');

    const listResponse = await context.request
      .get('/api/v1/branches?page=1&pageSize=20&search=Occidente')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);
    assert.equal(listResponse.body.items[0].id, branchId);
  } finally {
    await closeTestContext(context);
  }
});

test('roles CRUD integration flow', async () => {
  const context = await createTestContext();

  try {
    const permissionsResponse = await context.request
      .get('/api/v1/permissions')
      .set('Authorization', context.authHeader)
      .expect(200);

    const selectedPermissionIds = permissionsResponse.body.items
      .filter((permission) => ['people', 'users'].includes(permission.moduleKey))
      .slice(0, 3)
      .map((permission) => permission.id);

    const createResponse = await context.request
      .post('/api/v1/roles')
      .set('Authorization', context.authHeader)
      .send({
        name: 'People Lead',
        description: 'Gestiona personas y apoyo operativo',
        isSystem: false,
        permissionIds: selectedPermissionIds,
      })
      .expect(201);

    const roleId = createResponse.body.data.id;
    assert.equal(createResponse.body.data.permissionIds.length, selectedPermissionIds.length);

    const updateResponse = await context.request
      .patch(`/api/v1/roles/${roleId}`)
      .set('Authorization', context.authHeader)
      .send({
        description: 'Gestiona personas, usuarios y apoyo operativo',
        permissionIds: selectedPermissionIds.slice(0, 2),
      })
      .expect(200);

    assert.equal(updateResponse.body.data.permissionIds.length, 2);
    assert.equal(updateResponse.body.data.description, 'Gestiona personas, usuarios y apoyo operativo');
  } finally {
    await closeTestContext(context);
  }
});

test('users CRUD and security actions integration flow', async () => {
  const context = await createTestContext();

  try {
    const createResponse = await context.request
      .post('/api/v1/users')
      .set('Authorization', context.authHeader)
      .send({
        firstName: 'Maria',
        lastName: 'Operaciones',
        email: 'maria.operaciones@studiocore.local',
        password: 'Maria123*',
        phone: '3005556666',
        defaultBranchId: context.primaryBranchId,
        roleAssignments: [
          {
            roleId: context.ownerRoleId,
            branchId: context.secondaryBranchId,
          },
        ],
      })
      .expect(201);

    const userId = createResponse.body.data.id;
    assert.equal(createResponse.body.data.status, 'active');
    assert.equal(createResponse.body.data.roleAssignments[0].branchId, context.secondaryBranchId);

    const updateResponse = await context.request
      .patch(`/api/v1/users/${userId}`)
      .set('Authorization', context.authHeader)
      .send({
        phone: '3007779999',
        defaultBranchId: context.secondaryBranchId,
        roleAssignments: [
          {
            roleId: context.ownerRoleId,
            branchId: null,
          },
        ],
      })
      .expect(200);

    assert.equal(updateResponse.body.data.phone, '3007779999');
    assert.equal(updateResponse.body.data.defaultBranchId, context.secondaryBranchId);

    await context.request
      .post(`/api/v1/users/${userId}/deactivate`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    const activateResponse = await context.request
      .post(`/api/v1/users/${userId}/activate`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(activateResponse.body.data.status, 'active');

    const resetPasswordResponse = await context.request
      .post(`/api/v1/users/${userId}/reset-password`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(resetPasswordResponse.body.success, true);
    assert.equal(resetPasswordResponse.body.data.mustChangePassword, true);
    assert.ok(String(resetPasswordResponse.body.temporaryPassword).length >= 8);
  } finally {
    await closeTestContext(context);
  }
});

test('refresh keeps requested active branch context', async () => {
  const context = await createTestContext();

  try {
    const loginResponse = await context.request
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@studiocore.local',
        password: 'Admin123*',
        branchId: context.secondaryBranchId,
      })
      .expect(201);

    assert.equal(loginResponse.body.user.activeBranchId, context.secondaryBranchId);

    const refreshResponse = await context.request
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: loginResponse.body.tokens.refreshToken,
        branchId: context.secondaryBranchId,
      })
      .expect(201);

    assert.equal(refreshResponse.body.user.activeBranchId, context.secondaryBranchId);

    const globalRefreshResponse = await context.request
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: refreshResponse.body.tokens.refreshToken,
        branchId: null,
      })
      .expect(201);

    assert.equal(globalRefreshResponse.body.user.activeBranchId, null);
  } finally {
    await closeTestContext(context);
  }
});

test('catalogs endpoint exposes canonical people options', async () => {
  const context = await createTestContext();

  try {
    const listResponse = await context.request
      .get('/api/v1/catalogs')
      .set('Authorization', context.authHeader)
      .expect(200);

    const personTypeGroup = listResponse.body.items.find((group) => group.key === 'person_types');
    assert.ok(personTypeGroup);
    assert.equal(personTypeGroup.scope, 'system');
    assert.equal(personTypeGroup.items[0].value, 'staff');

    const documentTypesResponse = await context.request
      .get('/api/v1/catalogs/person_document_types')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(documentTypesResponse.body.data.label, 'Tipos documentales');
    assert.equal(documentTypesResponse.body.data.items[0].value, 'image');
    assert.equal(documentTypesResponse.body.data.items.at(-1).value, 'habeas_data');
  } finally {
    await closeTestContext(context);
  }
});

test('catalogs CRUD persists company overrides and blocks branch-scoped writes', async () => {
  const context = await createTestContext();

  try {
    const createResponse = await context.request
      .post('/api/v1/catalogs/groups')
      .set('Authorization', context.authHeader)
      .send({
        key: 'person_document_types',
        label: 'Tipos documentales personalizados',
        description: 'Override tenant-aware del catalogo base.',
        items: [
          { value: 'image', label: 'Imagen', isDefault: true },
          { value: 'agreement', label: 'Acuerdo firmado' },
        ],
      })
      .expect(201);

    assert.equal(createResponse.body.data.scope, 'company');
    assert.equal(createResponse.body.data.key, 'person_document_types');
    assert.equal(createResponse.body.data.items[1].value, 'agreement');

    const mergedListResponse = await context.request
      .get('/api/v1/catalogs')
      .set('Authorization', context.authHeader)
      .expect(200);

    const overriddenGroup = mergedListResponse.body.items.find((group) => group.key === 'person_document_types');
    assert.ok(overriddenGroup);
    assert.equal(overriddenGroup.scope, 'company');
    assert.equal(overriddenGroup.items.length, 2);

    const customDetailResponse = await context.request
      .get(`/api/v1/catalogs/groups/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(customDetailResponse.body.data.label, 'Tipos documentales personalizados');

    const updateResponse = await context.request
      .patch(`/api/v1/catalogs/groups/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        label: 'Tipos documentales tenant',
        items: [
          { value: 'agreement', label: 'Acuerdo firmado', isDefault: true },
          { value: 'image', label: 'Imagen' },
          { value: 'video', label: 'Video' },
        ],
      })
      .expect(200);

    assert.equal(updateResponse.body.data.label, 'Tipos documentales tenant');
    assert.equal(updateResponse.body.data.items[0].value, 'agreement');
    assert.equal(updateResponse.body.data.items[0].isDefault, true);

    await context.request
      .post('/api/v1/catalogs/groups')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        key: 'branch_only_catalog',
        label: 'No deberia crearse',
        items: [{ value: 'one', label: 'Uno', isDefault: true }],
      })
      .expect(403);

    await context.request
      .delete(`/api/v1/catalogs/groups/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    const fallbackResponse = await context.request
      .get('/api/v1/catalogs/person_document_types')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(fallbackResponse.body.data.scope, 'system');
    assert.equal(fallbackResponse.body.data.items.at(-1).value, 'habeas_data');
  } finally {
    await closeTestContext(context);
  }
});

test('models endpoints keep the record scoped as model', async () => {
  const context = await createTestContext();

  try {
    const createResponse = await context.request
      .post('/api/v1/models')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        firstName: 'Valentina',
        lastName: 'Model',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '90112233',
        email: 'valentina.model@studiocore.local',
        modelCategory: 'PAREJA',
      })
      .expect(201);

    assert.equal(createResponse.body.data.personType, 'model');
    assert.equal(createResponse.body.data.modelCategory, 'PAREJA');

    const listResponse = await context.request
      .get('/api/v1/models?page=1&pageSize=20')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);
    assert.equal(listResponse.body.items[0].personType, 'model');

    const updateResponse = await context.request
      .patch(`/api/v1/models/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        status: 'inactive',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.personType, 'model');
    assert.equal(updateResponse.body.data.status, 'inactive');
  } finally {
    await closeTestContext(context);
  }
});

test('staff endpoints keep the record scoped as staff and hide model records', async () => {
  const context = await createTestContext();

  try {
    const modelResponse = await context.request
      .post('/api/v1/models')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        firstName: 'Camila',
        lastName: 'Model',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '90112234',
      })
      .expect(201);

    const staffResponse = await context.request
      .post('/api/v1/staff')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'model',
        firstName: 'Daniel',
        lastName: 'Staff',
        branchId: context.secondaryBranchId,
        documentType: 'CC',
        documentNumber: '90112235',
        email: 'daniel.staff@studiocore.local',
      })
      .expect(201);

    assert.equal(staffResponse.body.data.personType, 'staff');

    const listResponse = await context.request
      .get('/api/v1/staff?page=1&pageSize=20')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);
    assert.equal(listResponse.body.items[0].personType, 'staff');

    await context.request
      .get(`/api/v1/staff/${modelResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(404);

    const updateResponse = await context.request
      .patch(`/api/v1/staff/${staffResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        personType: 'model',
        notes: 'Mantiene alcance staff',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.personType, 'staff');
    assert.equal(updateResponse.body.data.notes, 'Mantiene alcance staff');
  } finally {
    await closeTestContext(context);
  }
});

test('operations shifts CRUD and branch scope integration flow', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/staff')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'model',
        firstName: 'Laura',
        lastName: 'Shift',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102001',
      })
      .expect(201);

    const createResponse = await context.request
      .post('/api/v1/operations/shifts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        title: 'Turno apertura cabina 1',
        startsAt: '2026-03-14T08:00:00.000Z',
        endsAt: '2026-03-14T16:00:00.000Z',
        platformName: 'Chaturbate',
        roomLabel: 'Cabina 1',
        goalAmount: '350000',
      })
      .expect(201);

    assert.equal(createResponse.body.data.status, 'scheduled');
    assert.equal(createResponse.body.data.personType, 'staff');

    const listResponse = await context.request
      .get('/api/v1/operations/shifts?page=1&pageSize=20')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);

    const updateResponse = await context.request
      .patch(`/api/v1/operations/shifts/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        status: 'completed',
        notes: 'Turno cerrado con meta cumplida',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.status, 'completed');
    assert.equal(updateResponse.body.data.notes, 'Turno cerrado con meta cumplida');

    await context.request
      .post('/api/v1/operations/shifts')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        branchId: context.secondaryBranchId,
        personId: personResponse.body.data.id,
        title: 'Turno invalido',
        startsAt: '2026-03-14T18:00:00.000Z',
        endsAt: '2026-03-14T23:00:00.000Z',
      })
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});

test('attendance CRUD integration flow and branch filters', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/models')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        firstName: 'Juliana',
        lastName: 'Attendance',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102002',
      })
      .expect(201);

    const shiftResponse = await context.request
      .post('/api/v1/operations/shifts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        title: 'Turno manana stream',
        startsAt: '2026-03-15T09:00:00.000Z',
        endsAt: '2026-03-15T17:00:00.000Z',
      })
      .expect(201);

    const attendanceResponse = await context.request
      .post('/api/v1/attendance')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        shiftId: shiftResponse.body.data.id,
        attendanceDate: '2026-03-15',
        status: 'late',
        checkInAt: '2026-03-15T09:18:00.000Z',
        checkOutAt: '2026-03-15T17:01:00.000Z',
        notes: 'Ingreso despues del briefing',
      })
      .expect(201);

    assert.equal(attendanceResponse.body.data.status, 'late');
    assert.equal(attendanceResponse.body.data.shiftTitle, 'Turno manana stream');

    const listResponse = await context.request
      .get('/api/v1/attendance?page=1&pageSize=20&from=2026-03-01&to=2026-03-31')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);

    const updateResponse = await context.request
      .patch(`/api/v1/attendance/${attendanceResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        status: 'present',
        notes: 'Retardo justificado y regularizado',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.status, 'present');
    assert.equal(updateResponse.body.data.notes, 'Retardo justificado y regularizado');

    const branchScopedListResponse = await context.request
      .get('/api/v1/attendance?page=1&pageSize=20')
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(200);

    assert.equal(branchScopedListResponse.body.total, 1);

    await context.request
      .get(`/api/v1/attendance?page=1&pageSize=20&branchId=${context.secondaryBranchId}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});

test('absences CRUD integration flow and branch restrictions', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/staff')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'model',
        firstName: 'Daniela',
        lastName: 'Ausencia',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102003',
      })
      .expect(201);

    const shiftResponse = await context.request
      .post('/api/v1/operations/shifts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        title: 'Turno tarde soporte',
        startsAt: '2026-03-16T13:00:00.000Z',
        endsAt: '2026-03-16T21:00:00.000Z',
      })
      .expect(201);

    const createResponse = await context.request
      .post('/api/v1/absences')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        shiftId: shiftResponse.body.data.id,
        startsAt: '2026-03-16T13:00:00.000Z',
        endsAt: '2026-03-16T17:00:00.000Z',
        reason: 'Cita medica',
        supportUrl: 'https://files.studiocore.local/incapacidad.pdf',
      })
      .expect(201);

    assert.equal(createResponse.body.data.status, 'reported');
    assert.equal(createResponse.body.data.shiftTitle, 'Turno tarde soporte');

    const listResponse = await context.request
      .get('/api/v1/absences?page=1&pageSize=20')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);

    const updateResponse = await context.request
      .patch(`/api/v1/absences/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        status: 'approved',
        notes: 'Soporte validado por coordinacion',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.status, 'approved');
    assert.equal(updateResponse.body.data.notes, 'Soporte validado por coordinacion');

    await context.request
      .post('/api/v1/absences')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        branchId: context.secondaryBranchId,
        personId: personResponse.body.data.id,
        startsAt: '2026-03-17T13:00:00.000Z',
        reason: 'Prueba invalida',
      })
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});

test('goals CRUD integration flow and branch filters', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/models')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        firstName: 'Paula',
        lastName: 'Meta',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102004',
      })
      .expect(201);

    const shiftResponse = await context.request
      .post('/api/v1/operations/shifts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        title: 'Turno noche tokens',
        startsAt: '2026-03-18T20:00:00.000Z',
        endsAt: '2026-03-19T04:00:00.000Z',
      })
      .expect(201);

    const createResponse = await context.request
      .post('/api/v1/goals')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        shiftId: shiftResponse.body.data.id,
        title: 'Meta semanal tokens',
        periodStart: '2026-03-18',
        periodEnd: '2026-03-24',
        targetAmount: '1500000',
        bonusAmount: '150000',
        status: 'active',
      })
      .expect(201);

    assert.equal(createResponse.body.data.status, 'active');
    assert.equal(createResponse.body.data.targetAmount, '1500000');

    const listResponse = await context.request
      .get('/api/v1/goals?page=1&pageSize=20&from=2026-03-01&to=2026-03-31')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);

    const updateResponse = await context.request
      .patch(`/api/v1/goals/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        achievedAmount: '1625000',
        status: 'closed',
        notes: 'Meta superada con bono aprobado',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.status, 'closed');
    assert.equal(updateResponse.body.data.achievedAmount, '1625000');

    await context.request
      .get(`/api/v1/goals?page=1&pageSize=20&branchId=${context.secondaryBranchId}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});

test('online time CRUD integration flow and branch restrictions', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/models')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        firstName: 'Sara',
        lastName: 'Online',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102005',
      })
      .expect(201);

    const shiftResponse = await context.request
      .post('/api/v1/operations/shifts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        title: 'Turno live premium',
        startsAt: '2026-03-20T18:00:00.000Z',
        endsAt: '2026-03-21T02:00:00.000Z',
      })
      .expect(201);

    const createResponse = await context.request
      .post('/api/v1/online-time')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        shiftId: shiftResponse.body.data.id,
        label: 'Sesion principal viernes',
        platformName: 'Stripchat',
        startedAt: '2026-03-20T18:15:00.000Z',
        tokenCount: 4200,
        grossAmount: '875000',
      })
      .expect(201);

    assert.equal(createResponse.body.data.status, 'open');
    assert.equal(createResponse.body.data.durationMinutes, null);
    assert.equal(createResponse.body.data.grossAmount, '875000');

    const listResponse = await context.request
      .get('/api/v1/online-time?page=1&pageSize=20')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);

    const updateResponse = await context.request
      .patch(`/api/v1/online-time/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        endedAt: '2026-03-20T23:45:00.000Z',
        status: 'closed',
        notes: 'Sesion cerrada con cierre de caja validado',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.status, 'closed');
    assert.equal(updateResponse.body.data.durationMinutes, 330);

    await context.request
      .get(`/api/v1/online-time?page=1&pageSize=20&branchId=${context.secondaryBranchId}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});

test('payroll periods calculate operational summary and enforce close rules', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/staff')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'model',
        firstName: 'Mateo',
        lastName: 'Payroll',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102006',
      })
      .expect(201);

    await context.request
      .post(`/api/v1/people/${personResponse.body.data.id}/contracts`)
      .set('Authorization', context.authHeader)
      .send({
        contractType: 'TERMINO FIJO',
        startsAt: '2026-03-01',
        monthlySalary: '2000000',
      })
      .expect(201);

    const shiftResponse = await context.request
      .post('/api/v1/operations/shifts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        title: 'Turno cierre payroll',
        startsAt: '2026-03-20T18:00:00.000Z',
        endsAt: '2026-03-21T02:00:00.000Z',
      })
      .expect(201);

    await context.request
      .post('/api/v1/attendance')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        shiftId: shiftResponse.body.data.id,
        attendanceDate: '2026-03-20',
        status: 'present',
      })
      .expect(201);

    await context.request
      .post('/api/v1/attendance')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        attendanceDate: '2026-03-21',
        status: 'late',
      })
      .expect(201);

    const absenceResponse = await context.request
      .post('/api/v1/absences')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        startsAt: '2026-03-22T09:00:00.000Z',
        reason: 'Calamidad domestica',
        status: 'reported',
      })
      .expect(201);

    await context.request
      .post('/api/v1/online-time')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        shiftId: shiftResponse.body.data.id,
        label: 'Sesion payroll demo',
        startedAt: '2026-03-20T18:00:00.000Z',
        endedAt: '2026-03-20T22:00:00.000Z',
        tokenCount: 1500,
        grossAmount: '320000',
      })
      .expect(201);

    await context.request
      .post('/api/v1/goals')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        title: 'Meta marzo payroll',
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31',
        targetAmount: '1000000',
        achievedAmount: '1250000',
        bonusAmount: '120000',
        status: 'closed',
      })
      .expect(201);

    const periodResponse = await context.request
      .post('/api/v1/payroll/periods')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        code: '2026-03-Q2',
        label: 'Nomina segunda quincena marzo',
        periodStart: '2026-03-16',
        periodEnd: '2026-03-31',
      })
      .expect(201);

    const calculateResponse = await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/calculate`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(calculateResponse.body.data.status, 'calculated');
    assert.equal(calculateResponse.body.data.latestRun.items.length, 1);
    assert.equal(calculateResponse.body.data.latestRun.items[0].attendanceCount, 2);
    assert.equal(calculateResponse.body.data.latestRun.items[0].lateCount, 1);
    assert.equal(calculateResponse.body.data.latestRun.items[0].pendingAbsenceCount, 1);
    assert.equal(calculateResponse.body.data.latestRun.items[0].onlineMinutes, 240);
    assert.equal(calculateResponse.body.data.latestRun.items[0].fixedCompensationAmount, '2000000');
    assert.equal(calculateResponse.body.data.latestRun.items[0].goalBonusAmount, '120000');
    assert.ok(calculateResponse.body.data.latestRun.items[0].components.some((item) => item.code === 'fixed_compensation'));
    assert.ok(calculateResponse.body.data.latestRun.items[0].components.some((item) => item.code === 'goal_bonus'));
    assert.ok(calculateResponse.body.data.latestRun.items[0].alerts.some((item) => item.code === 'pending_absence'));

    await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/close`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(400);

    await context.request
      .patch(`/api/v1/absences/${absenceResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({ status: 'approved' })
      .expect(200);

    await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/calculate`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    const closeResponse = await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/close`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(closeResponse.body.data.status, 'closed');

    const exportResponse = await context.request
      .get(`/api/v1/payroll/periods/${periodResponse.body.data.id}/export`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.match(exportResponse.text, /period_code,period_label,person_name/);
    assert.match(exportResponse.text, /Mateo Payroll/);

    const reopenResponse = await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/reopen`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(reopenResponse.body.data.status, 'calculated');

    await context.request
      .get(`/api/v1/payroll/periods?page=1&pageSize=20&branchId=${context.secondaryBranchId}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});

test('payroll novelties CRUD integrates with payroll close rules', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/staff')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'model',
        firstName: 'Lucia',
        lastName: 'Novedad',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102007',
      })
      .expect(201);

    await context.request
      .post(`/api/v1/people/${personResponse.body.data.id}/contracts`)
      .set('Authorization', context.authHeader)
      .send({
        contractType: 'TERMINO FIJO',
        startsAt: '2026-04-01',
        monthlySalary: '1800000',
      })
      .expect(201);

    const periodResponse = await context.request
      .post('/api/v1/payroll/periods')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        code: '2026-04-Q1',
        label: 'Nomina primera quincena abril',
        periodStart: '2026-04-01',
        periodEnd: '2026-04-15',
      })
      .expect(201);

    const approvedNoveltyResponse = await context.request
      .post('/api/v1/payroll/novelties')
      .set('Authorization', context.authHeader)
      .send({
        periodId: periodResponse.body.data.id,
        personId: personResponse.body.data.id,
        noveltyType: 'bonus',
        title: 'Bono puntualidad',
        amount: '80000',
        effectiveDate: '2026-04-05',
        status: 'approved',
      })
      .expect(201);

    const criticalNoveltyResponse = await context.request
      .post('/api/v1/payroll/novelties')
      .set('Authorization', context.authHeader)
      .send({
        periodId: periodResponse.body.data.id,
        personId: personResponse.body.data.id,
        noveltyType: 'incident',
        title: 'Novedad disciplinaria pendiente',
        amount: '50000',
        effectiveDate: '2026-04-08',
        isCritical: true,
      })
      .expect(201);

    const noveltyListResponse = await context.request
      .get(`/api/v1/payroll/novelties?page=1&pageSize=20&periodId=${periodResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(noveltyListResponse.body.total, 2);

    const calculateResponse = await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/calculate`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(calculateResponse.body.data.latestRun.items[0].noveltyCount, 2);
    assert.equal(calculateResponse.body.data.latestRun.items[0].approvedNoveltyCount, 1);
    assert.equal(calculateResponse.body.data.latestRun.items[0].pendingCriticalNoveltyCount, 1);
    assert.equal(calculateResponse.body.data.latestRun.items[0].noveltyAmount, '80000');
    assert.equal(calculateResponse.body.data.latestRun.items[0].projectedCompensationAmount, '1880000');
    assert.ok(calculateResponse.body.data.latestRun.items[0].components.some((item) => item.label === 'Bono puntualidad'));
    assert.ok(calculateResponse.body.data.latestRun.items[0].alerts.some((item) => item.code === 'pending_critical_novelty'));

    await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/close`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(400);

    await context.request
      .patch(`/api/v1/payroll/novelties/${criticalNoveltyResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({ status: 'approved' })
      .expect(200);

    const recalculateResponse = await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/calculate`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(recalculateResponse.body.data.latestRun.items[0].noveltyAmount, '130000');
    assert.equal(recalculateResponse.body.data.latestRun.items[0].projectedCompensationAmount, '1930000');
    assert.ok(recalculateResponse.body.data.latestRun.items[0].components.some((item) => item.label === 'Novedad disciplinaria pendiente'));

    const closeResponse = await context.request
      .post(`/api/v1/payroll/periods/${periodResponse.body.data.id}/close`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(closeResponse.body.data.status, 'closed');

    await context.request
      .patch(`/api/v1/payroll/novelties/${approvedNoveltyResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({ notes: 'No debe editarse cerrado' })
      .expect(400);
  } finally {
    await closeTestContext(context);
  }
});

test('hr disciplinary actions sync payroll impact and preserve history', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/staff')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'model',
        firstName: 'Sofia',
        lastName: 'Disciplina',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102010',
      })
      .expect(201);

    const periodResponse = await context.request
      .post('/api/v1/payroll/periods')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        code: '2026-07-Q1',
        label: 'Nomina primera quincena julio',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-15',
      })
      .expect(201);

    const createResponse = await context.request
      .post('/api/v1/hr/disciplinary-actions')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        actionType: 'sanction',
        title: 'Incumplimiento de protocolo',
        effectiveDate: '2026-07-07',
        supportUrl: 'https://files.studiocore.local/discipline.pdf',
        payrollImpactAmount: '60000',
        status: 'approved',
      })
      .expect(201);

    assert.ok(createResponse.body.data.payrollNoveltyId);
    assert.equal(createResponse.body.data.payrollPeriodLabel, 'Nomina primera quincena julio');

    const noveltyListResponse = await context.request
      .get(`/api/v1/payroll/novelties?page=1&pageSize=20&periodId=${periodResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(noveltyListResponse.body.total, 1);
    assert.equal(noveltyListResponse.body.items[0].noveltyType, 'deduction');
    assert.equal(noveltyListResponse.body.items[0].amount, '60000');

    const updateResponse = await context.request
      .patch(`/api/v1/hr/disciplinary-actions/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({ status: 'rejected' })
      .expect(200);

    assert.equal(updateResponse.body.data.payrollNoveltyId, null);

    const emptyNoveltyListResponse = await context.request
      .get(`/api/v1/payroll/novelties?page=1&pageSize=20&periodId=${periodResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(emptyNoveltyListResponse.body.total, 0);
  } finally {
    await closeTestContext(context);
  }
});

test('hr incapacities sync approved records into payroll novelties', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/staff')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'model',
        firstName: 'Natalia',
        lastName: 'Incapacidad',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102008',
      })
      .expect(201);

    const periodResponse = await context.request
      .post('/api/v1/payroll/periods')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        code: '2026-05-Q1',
        label: 'Nomina primera quincena mayo',
        periodStart: '2026-05-01',
        periodEnd: '2026-05-15',
      })
      .expect(201);

    const createResponse = await context.request
      .post('/api/v1/hr/incapacities')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        reason: 'Incapacidad general',
        startsAt: '2026-05-03',
        endsAt: '2026-05-05',
        supportUrl: 'https://files.studiocore.local/incapacidad-mayo.pdf',
        status: 'approved',
      })
      .expect(201);

    assert.equal(createResponse.body.data.payrollPeriodLabel, 'Nomina primera quincena mayo');
    assert.ok(createResponse.body.data.payrollNoveltyId);
    assert.equal(createResponse.body.data.dayCount, 3);

    const noveltyListResponse = await context.request
      .get(`/api/v1/payroll/novelties?page=1&pageSize=20&periodId=${periodResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(noveltyListResponse.body.total, 1);
    assert.equal(noveltyListResponse.body.items[0].title, 'Incapacidad: Incapacidad general');

    const updateResponse = await context.request
      .patch(`/api/v1/hr/incapacities/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({ status: 'rejected' })
      .expect(200);

    assert.equal(updateResponse.body.data.payrollNoveltyId, null);

    const emptyNoveltyListResponse = await context.request
      .get(`/api/v1/payroll/novelties?page=1&pageSize=20&periodId=${periodResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(emptyNoveltyListResponse.body.total, 0);

    await context.request
      .get(`/api/v1/hr/incapacities?page=1&pageSize=20&branchId=${context.secondaryBranchId}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});

test('hr vacations sync into payroll novelties and respect paid flag', async () => {
  const context = await createTestContext();

  try {
    const personResponse = await context.request
      .post('/api/v1/models')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        firstName: 'Valeria',
        lastName: 'Vacaciones',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '3102009',
      })
      .expect(201);

    const periodResponse = await context.request
      .post('/api/v1/payroll/periods')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        code: '2026-06-Q1',
        label: 'Nomina primera quincena junio',
        periodStart: '2026-06-01',
        periodEnd: '2026-06-15',
      })
      .expect(201);

    const createResponse = await context.request
      .post('/api/v1/hr/vacations')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        personId: personResponse.body.data.id,
        reason: 'Descanso programado',
        startsAt: '2026-06-08',
        endsAt: '2026-06-12',
        isPaid: false,
        status: 'approved',
      })
      .expect(201);

    assert.equal(createResponse.body.data.dayCount, 5);
    assert.ok(createResponse.body.data.payrollNoveltyId);

    const noveltyListResponse = await context.request
      .get(`/api/v1/payroll/novelties?page=1&pageSize=20&periodId=${periodResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(noveltyListResponse.body.total, 1);
    assert.equal(noveltyListResponse.body.items[0].noveltyType, 'deduction');
    assert.equal(noveltyListResponse.body.items[0].title, 'Vacaciones: Descanso programado');

    const updateResponse = await context.request
      .patch(`/api/v1/hr/vacations/${createResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({ isPaid: true, status: 'approved' })
      .expect(200);

    assert.equal(updateResponse.body.data.payrollNoveltyId, createResponse.body.data.payrollNoveltyId);

    const updatedNoveltyListResponse = await context.request
      .get(`/api/v1/payroll/novelties?page=1&pageSize=20&periodId=${periodResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(updatedNoveltyListResponse.body.items[0].noveltyType, 'allowance');
  } finally {
    await closeTestContext(context);
  }
});

test('finance accounts, transactions and transfers keep balances branch-scoped', async () => {
  const context = await createTestContext();

  try {
    const cashAccountResponse = await context.request
      .post('/api/v1/finance/accounts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        name: 'Caja principal',
        type: 'cash',
        currency: 'COP',
      })
      .expect(201);

    const bankAccountResponse = await context.request
      .post('/api/v1/finance/accounts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        name: 'Banco operativo',
        type: 'bank',
        currency: 'COP',
      })
      .expect(201);

    const secondaryAccountResponse = await context.request
      .post('/api/v1/finance/accounts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.secondaryBranchId,
        name: 'Caja sede norte',
        type: 'cash',
        currency: 'COP',
      })
      .expect(201);

    const usdAccountResponse = await context.request
      .post('/api/v1/finance/accounts')
      .set('Authorization', context.authHeader)
      .send({
        branchId: context.primaryBranchId,
        name: 'Caja USD',
        type: 'cash',
        currency: 'USD',
      })
      .expect(201);

    const accountListResponse = await context.request
      .get('/api/v1/finance/accounts?page=1&pageSize=20&search=Caja')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(accountListResponse.body.total, 3);

    const incomeResponse = await context.request
      .post('/api/v1/finance/transactions')
      .set('Authorization', context.authHeader)
      .send({
        accountId: cashAccountResponse.body.data.id,
        type: 'income',
        amount: '500000',
        transactionDate: '2026-08-01',
        description: 'Apertura de caja',
      })
      .expect(201);

    assert.equal(incomeResponse.body.data.type, 'income');

    const expenseResponse = await context.request
      .post('/api/v1/finance/transactions')
      .set('Authorization', context.authHeader)
      .send({
        accountId: cashAccountResponse.body.data.id,
        type: 'expense',
        amount: '120000',
        transactionDate: '2026-08-02',
        description: 'Compra de suministros',
      })
      .expect(201);

    assert.equal(expenseResponse.body.data.type, 'expense');

    const transferResponse = await context.request
      .post('/api/v1/finance/transfers')
      .set('Authorization', context.authHeader)
      .send({
        sourceAccountId: cashAccountResponse.body.data.id,
        destinationAccountId: bankAccountResponse.body.data.id,
        amount: '200000',
        transactionDate: '2026-08-03',
        description: 'Reserva operativa',
      })
      .expect(201);

    assert.equal(transferResponse.body.data.expenseTx.type, 'expense');
    assert.equal(transferResponse.body.data.incomeTx.type, 'income');

    const transactionListResponse = await context.request
      .get(`/api/v1/finance/transactions?page=1&pageSize=20&accountId=${cashAccountResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(transactionListResponse.body.total, 3);
    assert.equal(transactionListResponse.body.items[0].description, 'Transferencia a Banco operativo: Reserva operativa');

    const cashDetailResponse = await context.request
      .get(`/api/v1/finance/accounts/${cashAccountResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(Number(cashDetailResponse.body.data.balance), 180000);

    const bankDetailResponse = await context.request
      .get(`/api/v1/finance/accounts/${bankAccountResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(Number(bankDetailResponse.body.data.balance), 200000);

    await context.request
      .post('/api/v1/finance/transactions')
      .set('Authorization', context.authHeader)
      .send({
        accountId: cashAccountResponse.body.data.id,
        type: 'transfer',
        amount: '5000',
        transactionDate: '2026-08-04',
        description: 'Intento invalido',
      })
      .expect(400);

    await context.request
      .post('/api/v1/finance/transfers')
      .set('Authorization', context.authHeader)
      .send({
        sourceAccountId: cashAccountResponse.body.data.id,
        destinationAccountId: usdAccountResponse.body.data.id,
        amount: '1000',
        transactionDate: '2026-08-05',
        description: 'Transferencia cruzada',
      })
      .expect(400);

    const branchScopedListResponse = await context.request
      .get('/api/v1/finance/accounts?page=1&pageSize=20')
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(200);

    assert.equal(branchScopedListResponse.body.total, 3);
    assert.ok(branchScopedListResponse.body.items.every((item) => item.branchId === context.primaryBranchId));

    await context.request
      .get(`/api/v1/finance/accounts/${secondaryAccountResponse.body.data.id}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(404);

    await context.request
      .get(`/api/v1/finance/accounts?page=1&pageSize=20&branchId=${context.secondaryBranchId}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(403);

    await context.request
      .post('/api/v1/finance/accounts')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        branchId: context.secondaryBranchId,
        name: 'Cuenta prohibida',
        type: 'cash',
        currency: 'COP',
      })
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});

test('people CRUD integration flow and audit visibility', async () => {
  const context = await createTestContext();

  try {
    const createResponse = await context.request
      .post('/api/v1/people')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        firstName: 'Laura',
        lastName: 'Tenant',
        branchId: context.primaryBranchId,
        documentType: 'CC',
        documentNumber: '1234567890',
        issuedIn: 'Bogota',
        email: 'laura.tenant@studiocore.local',
        personalEmail: 'laura.personal@studiocore.local',
        phone: '3001122334',
        birthDate: '1998-04-16',
        sex: 'FEMENINO',
        bloodType: 'O +',
        bankEntity: 'Bancolombia',
        bankAccountType: 'AHORRO',
        bankAccountNumber: '1234567890',
        notes: 'Registro base para la epica people',
      })
      .expect(201);

    const personId = createResponse.body.data.id;
    assert.equal(createResponse.body.data.personType, 'staff');
    assert.equal(createResponse.body.data.bankEntity, 'Bancolombia');

    const updateResponse = await context.request
      .patch(`/api/v1/people/${personId}`)
      .set('Authorization', context.authHeader)
      .send({
        personType: 'contractor',
        status: 'inactive',
        branchId: context.secondaryBranchId,
        notes: 'Actualizada durante prueba de integracion',
      })
      .expect(200);

    assert.equal(updateResponse.body.data.personType, 'contractor');
    assert.equal(updateResponse.body.data.status, 'inactive');
    assert.equal(updateResponse.body.data.branchId, context.secondaryBranchId);

    const createContractResponse = await context.request
      .post(`/api/v1/people/${personId}/contracts`)
      .set('Authorization', context.authHeader)
      .send({
        contractType: 'TERMINO FIJO',
        contractNumber: 'CT-001',
        positionName: 'Monitor',
        areaName: 'Operacion',
        cityName: 'Bogota',
        startsAt: '2024-01-15',
        monthlySalary: '2500000',
        hasWithholding: true,
        hasSena: true,
        arlRiskLevel: 'II',
      })
      .expect(201);

    assert.equal(createContractResponse.body.data.contractType, 'TERMINO FIJO');
    assert.equal(createContractResponse.body.data.positionName, 'Monitor');

    const updateContractResponse = await context.request
      .patch(`/api/v1/people/${personId}/contracts/${createContractResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        areaName: 'RRHH',
        isActive: false,
      })
      .expect(200);

    assert.equal(updateContractResponse.body.data.areaName, 'RRHH');
    assert.equal(updateContractResponse.body.data.isActive, false);

    const detailResponse = await context.request
      .get(`/api/v1/people/${personId}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(detailResponse.body.data.fullName, 'Laura Tenant');
    assert.equal(detailResponse.body.data.documents.length, 0);
    assert.equal(detailResponse.body.data.contracts.length, 1);
    assert.equal(detailResponse.body.data.contracts[0].areaName, 'RRHH');
    assert.ok(detailResponse.body.data.history.length >= 4);

    const createDocumentResponse = await context.request
      .post(`/api/v1/people/${personId}/documents`)
      .set('Authorization', context.authHeader)
      .send({
        label: 'Contrato marco',
        legacyLabel: 'IMG_OTHER',
        documentType: 'contract',
        fileType: 'image',
        documentNumber: 'CTR-001',
        storageBucket: 'el-castillo',
        storagePath: 'documents/laura/contrato-marco.pdf',
        publicUrl: 'https://supabase.local/storage/v1/object/public/el-castillo/documents/laura/contrato-marco.pdf',
        issuedAt: '2024-01-01',
        expiresAt: '2025-01-01',
        notes: 'Soporte contractual inicial',
      })
      .expect(201);

    assert.equal(createDocumentResponse.body.data.label, 'Contrato marco');
    assert.equal(createDocumentResponse.body.data.legacyLabel, 'IMG_OTHER');
    assert.equal(createDocumentResponse.body.data.status, 'active');

    const updateDocumentResponse = await context.request
      .patch(`/api/v1/people/${personId}/documents/${createDocumentResponse.body.data.id}`)
      .set('Authorization', context.authHeader)
      .send({
        status: 'inactive',
        notes: 'Documento vencido y archivado',
      })
      .expect(200);

    assert.equal(updateDocumentResponse.body.data.status, 'inactive');

    const detailWithDocumentsResponse = await context.request
      .get(`/api/v1/people/${personId}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(detailWithDocumentsResponse.body.data.documents.length, 1);
    assert.equal(detailWithDocumentsResponse.body.data.documents[0].status, 'inactive');
    assert.equal(detailWithDocumentsResponse.body.data.documents[0].storageBucket, 'el-castillo');
    assert.ok(detailWithDocumentsResponse.body.data.history.some((item) => item.entityType === 'person_contract'));
    assert.ok(detailWithDocumentsResponse.body.data.history.some((item) => item.entityType === 'person_document'));

    const listResponse = await context.request
      .get('/api/v1/people?page=1&pageSize=20&search=Laura')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(listResponse.body.total, 1);

    const auditResponse = await context.request
      .get('/api/v1/audit-logs?page=1&pageSize=20&module=people')
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.ok(auditResponse.body.items.length >= 2);
  } finally {
    await closeTestContext(context);
  }
});

test('people documents support storage uploads and external references', async () => {
  const context = await createTestContext();
  const originalFetch = global.fetch;

  try {
    const createPersonResponse = await context.request
      .post('/api/v1/people')
      .set('Authorization', context.authHeader)
      .send({
        personType: 'staff',
        firstName: 'Diana',
        lastName: 'Docs',
        branchId: context.primaryBranchId,
      })
      .expect(201);

    const personId = createPersonResponse.body.data.id;

    const uploadResponse = await context.request
      .post(`/api/v1/people/${personId}/documents/upload`)
      .set('Authorization', context.authHeader)
      .field('label', 'Contrato firmado')
      .field('legacyLabel', 'IMG_OTHER')
      .field('documentType', 'contract')
      .field('issuedAt', '2024-05-01')
      .attach('file', Buffer.from('fake-pdf-content'), {
        filename: 'contrato-firmado.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    assert.equal(uploadResponse.body.data.storageBucket, 'test-documents');
    assert.equal(uploadResponse.body.data.fileType, 'application/pdf');
    assert.ok(uploadResponse.body.data.storagePath.includes(`/1/${personId}/`) || uploadResponse.body.data.storagePath.includes(`/${personId}/`));
    assert.ok(uploadResponse.body.data.publicUrl.includes(uploadResponse.body.data.storagePath));

    const uploadedAccessResponse = await context.request
      .get(`/api/v1/people/${personId}/documents/${uploadResponse.body.data.id}/access`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(uploadedAccessResponse.body.data.expiresIn, 900);
    assert.ok(uploadedAccessResponse.body.data.url.includes(`test-documents/${uploadResponse.body.data.storagePath}`));

    const externalReferenceResponse = await context.request
      .post(`/api/v1/people/${personId}/documents`)
      .set('Authorization', context.authHeader)
      .send({
        label: 'Cedula legacy',
        legacyLabel: 'IMG_ID_FRONT',
        documentType: 'legacy_document',
        storagePath: 'legacy/cedulas/diana-docs-front.jpg',
        publicUrl: 'https://legacy.studiocore.local/images/models/documents/legacy/cedulas/diana-docs-front.jpg',
      })
      .expect(201);

    assert.equal(externalReferenceResponse.body.data.storageBucket, null);
    assert.equal(
      externalReferenceResponse.body.data.publicUrl,
      'https://legacy.studiocore.local/images/models/documents/legacy/cedulas/diana-docs-front.jpg',
    );

    const externalAccessResponse = await context.request
      .get(`/api/v1/people/${personId}/documents/${externalReferenceResponse.body.data.id}/access`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(externalAccessResponse.body.data.expiresIn, null);
    assert.equal(
      externalAccessResponse.body.data.url,
      'https://legacy.studiocore.local/images/models/documents/legacy/cedulas/diana-docs-front.jpg',
    );

    global.fetch = async () => new Response(Buffer.from('legacy-jpg-content'), {
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    });

    const migratedResponse = await context.request
      .post(`/api/v1/people/${personId}/documents/${externalReferenceResponse.body.data.id}/migrate-storage`)
      .set('Authorization', context.authHeader)
      .send({})
      .expect(201);

    assert.equal(migratedResponse.body.data.storageBucket, 'test-documents');
    assert.ok(migratedResponse.body.data.storagePath.includes(`/${personId}/`));
    assert.ok(migratedResponse.body.data.notes.includes('Migrado a storage gestionado'));

    const migratedAccessResponse = await context.request
      .get(`/api/v1/people/${personId}/documents/${externalReferenceResponse.body.data.id}/access`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(migratedAccessResponse.body.data.expiresIn, 900);
    assert.ok(migratedAccessResponse.body.data.url.includes(`test-documents/${migratedResponse.body.data.storagePath}`));

    const detailResponse = await context.request
      .get(`/api/v1/people/${personId}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(detailResponse.body.data.documents.length, 2);
    assert.ok(detailResponse.body.data.history.some((item) => item.action === 'upload'));
    assert.ok(detailResponse.body.data.history.some((item) => item.action === 'migrate_storage'));
  } finally {
    global.fetch = originalFetch;
    await closeTestContext(context);
  }
});

test('branch-scoped sessions stay inside the active branch', async () => {
  const context = await createTestContext();

  try {
    const branchScopedUserResponse = await context.request
      .post('/api/v1/users')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        firstName: 'Paola',
        lastName: 'BranchOnly',
        email: 'paola.branchonly@studiocore.local',
        password: 'Paola123*',
        roleAssignments: [
          {
            roleId: context.ownerRoleId,
          },
        ],
      })
      .expect(201);

    assert.equal(branchScopedUserResponse.body.data.defaultBranchId, context.primaryBranchId);
    assert.equal(branchScopedUserResponse.body.data.roleAssignments[0].branchId, context.primaryBranchId);

    await context.request
      .post('/api/v1/users')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        firstName: 'Invalid',
        lastName: 'CrossBranch',
        email: 'invalid.crossbranch@studiocore.local',
        password: 'Invalid123*',
        defaultBranchId: context.secondaryBranchId,
        roleAssignments: [
          {
            roleId: context.ownerRoleId,
            branchId: context.secondaryBranchId,
          },
        ],
      })
      .expect(400);

    const outOfScopeUserResponse = await context.request
      .post('/api/v1/users')
      .set('Authorization', context.authHeader)
      .set('X-Branch-Id', String(context.secondaryBranchId))
      .send({
        firstName: 'Sonia',
        lastName: 'Secondary',
        email: 'sonia.secondary@studiocore.local',
        password: 'Sonia123*',
        defaultBranchId: context.secondaryBranchId,
        roleAssignments: [
          {
            roleId: context.ownerRoleId,
            branchId: context.secondaryBranchId,
          },
        ],
      })
      .expect(201);

    const branchScopedCreateResponse = await context.request
      .post('/api/v1/people')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        personType: 'staff',
        firstName: 'Brenda',
        lastName: 'Scope',
        notes: 'Creada desde sesion acotada por sede',
      })
      .expect(201);

    assert.equal(branchScopedCreateResponse.body.data.branchId, context.primaryBranchId);

    const outOfScopePersonResponse = await context.request
      .post('/api/v1/people')
      .set('Authorization', context.authHeader)
      .set('X-Branch-Id', String(context.secondaryBranchId))
      .send({
        personType: 'staff',
        firstName: 'Nora',
        lastName: 'North',
        branchId: context.secondaryBranchId,
      })
      .expect(201);

    const branchScopedDocumentResponse = await context.request
      .post(`/api/v1/people/${branchScopedCreateResponse.body.data.id}/documents`)
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        label: 'Documento sede principal',
        documentType: 'id_card',
      })
      .expect(201);

    assert.equal(branchScopedDocumentResponse.body.data.branchId, context.primaryBranchId);

    const branchScopedContractResponse = await context.request
      .post(`/api/v1/people/${branchScopedCreateResponse.body.data.id}/contracts`)
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        contractType: 'TERMINO FIJO',
        startsAt: '2024-02-01',
      })
      .expect(201);

    assert.equal(branchScopedContractResponse.body.data.branchId, context.primaryBranchId);

    const peopleResponse = await context.request
      .get('/api/v1/people?page=1&pageSize=20')
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(200);

    assert.equal(peopleResponse.body.total, 1);
    assert.equal(peopleResponse.body.items[0].branchId, context.primaryBranchId);

    const usersResponse = await context.request
      .get('/api/v1/users?page=1&pageSize=20')
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(200);

    assert.equal(usersResponse.body.total, 2);
    assert.deepEqual(
      usersResponse.body.items.map((item) => item.email).sort(),
      ['branch.manager@studiocore.local', 'paola.branchonly@studiocore.local'].sort(),
    );

    await context.request
      .get(`/api/v1/users/${outOfScopeUserResponse.body.data.id}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(404);

    await context.request
      .post(`/api/v1/users/${outOfScopeUserResponse.body.data.id}/reset-password`)
      .set('Authorization', context.branchScopedAuthHeader)
      .send({})
      .expect(404);

    await context.request
      .get(`/api/v1/people?page=1&pageSize=20&branchId=${context.secondaryBranchId}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(403);

    await context.request
      .get(`/api/v1/people/${outOfScopePersonResponse.body.data.id}`)
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(404);

    await context.request
      .post(`/api/v1/people/${outOfScopePersonResponse.body.data.id}/documents`)
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        label: 'Documento prohibido',
        documentType: 'contract',
      })
      .expect(404);

    await context.request
      .post(`/api/v1/people/${outOfScopePersonResponse.body.data.id}/contracts`)
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        contractType: 'TERMINO FIJO',
        startsAt: '2024-03-01',
      })
      .expect(404);

    const branchesResponse = await context.request
      .get('/api/v1/branches?page=1&pageSize=20')
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(200);

    assert.equal(branchesResponse.body.total, 1);
    assert.equal(branchesResponse.body.items[0].id, context.primaryBranchId);

    const auditResponse = await context.request
      .get('/api/v1/audit-logs?page=1&pageSize=20&module=people')
      .set('Authorization', context.branchScopedAuthHeader)
      .expect(200);

    assert.ok(auditResponse.body.items.length >= 1);
    assert.ok(auditResponse.body.items.every((item) => item.branchId === context.primaryBranchId));

    await context.request
      .post('/api/v1/branches')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        name: 'Forbidden Branch',
        code: 'FBR',
      })
      .expect(403);

    await context.request
      .post('/api/v1/roles')
      .set('Authorization', context.branchScopedAuthHeader)
      .send({
        name: 'Forbidden Role',
      })
      .expect(403);
  } finally {
    await closeTestContext(context);
  }
});
