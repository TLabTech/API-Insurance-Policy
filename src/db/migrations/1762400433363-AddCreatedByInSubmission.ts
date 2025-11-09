import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddCreatedByInSubmission1762400433363
  implements MigrationInterface
{
  name = 'AddCreatedByInSubmission1762400433363';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'submissions',
      new TableColumn({
        name: 'created_by',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'submissions',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('submissions');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('created_by') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('submissions', foreignKey);
    }
    await queryRunner.dropColumn('submissions', 'created_by');
  }
}
