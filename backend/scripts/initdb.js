const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const seedSuperAdmin = require('./seedSuperAdmin');

// load .env from backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Main database initialization routine.
 * 1. Connects to MySQL server.
 * 2. Creates the database and tables if they do not exist (without dropping existing data).
 * 3. Awaits successful completion before triggering Super Admin seeding.
 * 4. Ensures idempotent execution so running multiple times is safe.
 */
async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const dbName = process.env.DB_NAME;

  if (!dbName) {
    console.error('❌ DB_NAME is not defined in backend/.env. Please configure DB_NAME before running initialization.');
    process.exit(1);
  }

  console.log(`Connecting to MySQL host ${host}:${port} as ${user}...`);

  try {
    //1 connect mysql srvr (no db yet so we can create it)
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log('Connected to MySQL server.');

    // 2 create db if missing & use it
    const escapedDbName = dbName.replace(/`/g, '``');
    console.log(`Ensuring database '${dbName}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${escapedDbName}\`;`);
    await connection.query(`USE \`${escapedDbName}\`;`);
    console.log(`Active database set to '${dbName}'.`);

    //3. load database.sql
    const sqlFilePath = path.join(__dirname, '..', 'database.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log(`Executing database.sql schema against '${dbName}'...`);
    await connection.query(sql);

    console.log(`✅ Database '${dbName}' and tables verified/created successfully (existing records preserved).`);
    await connection.end();

    // 4 seed super admin safely (idempotent, bcrypt hash)
    console.log('Verifying and seeding initial Super Admin account...');
    await seedSuperAdmin(dbName);

    console.log('🎉 Database initialization and verification completed successfully.');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
