import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostgresInitialMigration1733603200000
  implements MigrationInterface
{
  name = 'PostgresInitialMigration1733603200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
            )
        `);

    // Create users table
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "email" character varying NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "password" character varying NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "roleID" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

    // Create submissions table
    await queryRunner.query(`
            CREATE TABLE "submissions" (
                "id" SERIAL NOT NULL,
                "submission_number" character varying,
                "policy_holder_name" character varying NOT NULL,
                "policy_holder_dob" date NOT NULL,
                "policy_holder_nik" bigint NOT NULL,
                "product_id" character varying NOT NULL,
                "sum_assured" bigint NOT NULL,
                "annual_premium" bigint NOT NULL,
                "payment_freq" character varying NOT NULL,
                "document" character varying NOT NULL,
                "status" character varying NOT NULL,
                "notes" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_e87f1b8f7a8e5bf83b7b3c5a845" UNIQUE ("submission_number"),
                CONSTRAINT "PK_48bce6cf914e911b8a1e4c2cc61" PRIMARY KEY ("id")
            )
        `);

    // Create index on users.roleID
    await queryRunner.query(
      `CREATE INDEX "IDX_368e146b785b574f42ae9e53d5" ON "users" ("roleID")`,
    );

    // Add foreign key constraint for users.roleID -> roles.id
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" 
            FOREIGN KEY ("roleID") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`,
    );

    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_368e146b785b574f42ae9e53d5"`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "submissions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
