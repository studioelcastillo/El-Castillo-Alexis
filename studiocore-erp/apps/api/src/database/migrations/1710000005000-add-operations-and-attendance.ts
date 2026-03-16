import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOperationsAndAttendance1710000005000 implements MigrationInterface {
  name = 'AddOperationsAndAttendance1710000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE operation_shift_status_enum AS ENUM ('scheduled', 'completed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE attendance_status_enum AS ENUM ('present', 'late', 'absent', 'excused')`);

    await queryRunner.query(`
      CREATE TABLE operation_shifts (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        title VARCHAR(150) NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        platform_name VARCHAR(120) NULL,
        room_label VARCHAR(120) NULL,
        goal_amount NUMERIC(12, 2) NULL,
        status operation_shift_status_enum NOT NULL DEFAULT 'scheduled',
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE attendance_records (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        person_id INT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        shift_id INT NULL REFERENCES operation_shifts(id) ON DELETE SET NULL,
        attendance_date DATE NOT NULL,
        status attendance_status_enum NOT NULL DEFAULT 'present',
        check_in_at TIMESTAMPTZ NULL,
        check_out_at TIMESTAMPTZ NULL,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_operation_shifts_company_branch_start ON operation_shifts(company_id, branch_id, starts_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_operation_shifts_person_id ON operation_shifts(person_id)`);
    await queryRunner.query(`CREATE INDEX idx_attendance_records_company_branch_date ON attendance_records(company_id, branch_id, attendance_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_attendance_records_person_date ON attendance_records(person_id, attendance_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_attendance_records_shift_id ON attendance_records(shift_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS attendance_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS operation_shifts`);
    await queryRunner.query(`DROP TYPE IF EXISTS attendance_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS operation_shift_status_enum`);
  }
}
