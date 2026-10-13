-- =============================================================================
-- FitPlan — MySQL Dedicated User & Database Setup Script
-- Run this once as root in MySQL Workbench or the MySQL command line:
--   mysql -u root -p < backend/database/setup_user.sql
-- =============================================================================

-- 1. Create the application database
CREATE DATABASE IF NOT EXISTS fitness_planner_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Create the dedicated non-root application user
CREATE USER IF NOT EXISTS 'fitness_app'@'%' IDENTIFIED BY 'Harsh@123';
CREATE USER IF NOT EXISTS 'fitness_app'@'localhost' IDENTIFIED BY 'Harsh@123';
CREATE USER IF NOT EXISTS 'fitness_app'@'127.0.0.1' IDENTIFIED BY 'Harsh@123';

-- In case the user already exists, update their password
ALTER USER 'fitness_app'@'%' IDENTIFIED BY 'Harsh@123';
ALTER USER 'fitness_app'@'localhost' IDENTIFIED BY 'Harsh@123';
ALTER USER 'fitness_app'@'127.0.0.1' IDENTIFIED BY 'Harsh@123';

-- 3. Grant full permissions on fitness_planner_db ONLY (no access to system databases)
GRANT ALL PRIVILEGES ON fitness_planner_db.* TO 'fitness_app'@'%';
GRANT ALL PRIVILEGES ON fitness_planner_db.* TO 'fitness_app'@'localhost';
GRANT ALL PRIVILEGES ON fitness_planner_db.* TO 'fitness_app'@'127.0.0.1';

-- 4. Flush privileges to apply changes immediately
FLUSH PRIVILEGES;

SELECT 'User fitness_app created successfully with access to fitness_planner_db.' AS status;
