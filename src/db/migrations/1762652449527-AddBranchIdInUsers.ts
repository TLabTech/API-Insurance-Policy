import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBranchIdInUsers1762652449527 implements MigrationInterface {
  name = 'AddBranchIdInUsers1762652449527';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'branchID',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'branchID');
  }
}
