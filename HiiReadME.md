



# CRM ELECTRA

This ia s very Basic CRM for demonstration using React, Node.js, Express.js and MySQL.
//////////////////////.// 
## .envExample

         # Database Configuration
         DB_HOST=localhost
         DB_USER=root
         DB_PASSWORD=yourpassword
         DB_NAME=simple_crm_v2//willcreate
         DB_PORT=3306

         # Backend Server Port
         PORT=5009

         # JSON Web Token Secret Key
         JWT_SECRET=crmelectra//ur token
#####

## How to Run the Project

1. Clone the repository using Git:
 git clone YOUR_GITHUB_REPOSITORY_URL

2. Open the project folder:
cd CRM_ELECTRA

3. Install the required dependencies:
npm install

   cd frontend
   npm install

   cd ../backend
   npm install

4. Create a //.env file inside the backend folder and configure your MySQL database details.

5. Start the backend:
  cd backend
   npm start
6. Open another terminal and start the frontend:

   cd frontend
   npm run dev
7. Open the local URL displayed in the terminal to access the application.

## Main Modules

 Dashboard
 Customer Management
 Lead Management
 Sales Management
 Employee Management
 Super Admin Login

## Note

 Node.js $ MySQL Server must be installed.
 MySQL Server should be running before starting the backend.
 Configure your own database credentials in the //.env file.
 Do not upload the //.env file or database credentials to GitHub.