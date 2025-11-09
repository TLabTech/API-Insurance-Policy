import AppDataSource from './data-source';

async function markMigrationAsExecuted() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();

    // Insert the migration record to mark it as executed
    await AppDataSource.query(
      `INSERT INTO migrations (timestamp, name) VALUES (?, ?)`,
      [1696723200000, 'InitialMigration1696723200000'],
    );

    console.log('✅ Initial migration marked as executed');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error marking migration as executed:', error);
    process.exit(1);
  }
}

markMigrationAsExecuted();
