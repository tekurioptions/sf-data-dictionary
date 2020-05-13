// Environment configuration file location using the project name. If no file exists the system
//  environment variables will be used.
// require('dotenv').config({ path: '../data-dictionary.env' });

exports = module.exports = {
  port: "", // Server listening port
  baseUrl: '',
  db: { // Sequelize configuration
    database: "", // Database name
    clientId: "",
    clientSecret: "",
    username: "", // Database user name
    password: "", // Database passowrd
    dialect: '', // http://docs.sequelizejs.com/manual/installation/usage.html#dialects
    host: "", // Database server or IP
    define: {
      freezeTableName: true, // Sequelize will not alter the model name to get the table name
      timestamps: false, // Adds createdAt and updatedAt timestamps to the model
      paranoid: true, // Database rows are not deleted but deletedAt is populated
      createdAt: 'CreatedAt', // Rename the createdAt field
      updatedAt: 'UpdatedAt', // Rename the updatedAt field
      deletedAt: 'DeletedAt', // Rename the deletedAt field
    },
    pool: {
      max: 10, // Maximum number of connection in pool
      idle: 30000, // Maximum time(ms) that a connection can be idle before being released
      acquire: 60000, // Maximum time(ms) that pool will try to get connection before throwing error
    },
    dialectOptions: {
      encrypt: true, // Tedious npm package setting
    }
  }
};