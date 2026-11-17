const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

//read backend .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Idempotently seeds the initial Super Admin account into MySQL.
 * - Checks if the Super Admin email already exists.
 * - If found, skips insertion without overwriting existing credentials.
 * - If not found, hashes the password with bcryptjs and inserts the account.
 * - Never stores plaintext passwords.
 */
async function seedSuperAdmin(targetDbName) {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const dbName = targetDbName || process.env.DB_NAME;

  if (!dbName) {
    throw new Error('DB_NAME is not defined in backend/.env. Please configure DB_NAME before running Super Admin seeding.');
  }

  console.log(`Connecting to MySQL database '${dbName}' at ${host}:${port} for Super Admin verification...`);

  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database: dbName,
    port
  });

  try {
    // 1 make sure employees tbl is there
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(100),
        designation VARCHAR(100),
        role ENUM('Super Admin', 'Admin', 'Employee') NOT NULL DEFAULT 'Employee',
        password VARCHAR(255) NOT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createTableQuery);

    //2. chk if super admin exists already (dont overwrite creds)
    const adminEmail = 'midhun123@gmail.com';
    const [existing] = await connection.query(
      'SELECT id, name, email, role FROM employees WHERE email = ?',
      [adminEmail]
    );

    if (existing.length > 0) {
      console.log(`ℹ️  Super Admin account (${adminEmail}) already exists (ID: ${existing[0].id}). Credentials preserved.`);
    } else {
      // 3 hash default pwd '1234' w/ bcrypt
      console.log('Hashing Super Admin password with bcryptjs...');
      const plainPassword = '1234';
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

      //4 insert super admin row
      const insertQuery = `
        INSERT INTO employees (name, email, phone, department, designation, role, password, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
      `;
      const [result] = await connection.query(insertQuery, [
        'Midhunraj',
        adminEmail,
        '+1 (555) 019-8234',
        'Executive Management',
        'Chief System Administrator',
        'Super Admin',
        hashedPassword
      ]);

      console.log(`✅ Super Admin account created successfully!`);
      console.log(`   ID: ${result.insertId}`);
      console.log(`   Name: Midhunraj`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Role: Super Admin`);
    }

    return true;
  } finally {
    await connection.end();
  }
}

// run directly via node or npm run seed:admin
if (require.main === module) {
  seedSuperAdmin()
    .then(() => {
      console.log('Super Admin seeding process completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to seed Super Admin account:', error.message);
      process.exit(1);
    });
}

module.exports = seedSuperAdmin;
