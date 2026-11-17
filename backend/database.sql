-- ============================================================
-- BASIC CRM DATABASE SETUP SCRIPT
-- MySQL 8.0 Compatible
-- Note: Database creation and selection is handled dynamically
-- by initdb.js according to DB_NAME in .env.
-- ============================================================

-- ------------------------------------------------------------
-- TABLE 1: customers
-- Stores all client / customer information
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    company VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLE 2: leads
-- Stores potential business leads before conversion
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    source VARCHAR(100),
    status VARCHAR(30) DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLE 3: sales
-- Stores sales transactions linked to existing customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    sale_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- TABLE 4: employees
-- Stores authenticated users, admins, and Super Admin accounts
-- ------------------------------------------------------------
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
);

-- ------------------------------------------------------------
-- TABLE 5: app_settings
-- Stores application configuration and preferences
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    crm_name VARCHAR(100) DEFAULT 'BASIC CRM',
    currency VARCHAR(20) DEFAULT 'USD ($)',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    color_scheme VARCHAR(30) DEFAULT 'blue',
    date_format VARCHAR(30) DEFAULT 'DD/MM/YYYY',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
