require("dotenv").config()

module.exports = {
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
  server: process.env.HOST,
  port: process.env.PORT,
  options: {
    encrypt: false,
    trustServerCertificate: false 
  }
}