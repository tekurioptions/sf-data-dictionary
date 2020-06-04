const Sequelize = require("sequelize");
const readdirSync = require("fs").readdirSync;
const tablesPath = require("path").join(__dirname, "../models/tables");
const config = require("../../config");
const logger = require("./logger");

const sequelize = new Sequelize(config.db);

const models = {};

// Load Tables
readdirSync(tablesPath).forEach((file) => {
  const modelName = file.replace(".js", "");
  logger.info(`Initializing model for table ${modelName}`);

  models[modelName] = require(`${tablesPath}/${file}`).init(
    sequelize,
    Sequelize
  );
});

// Associate Models
Object.values(models)
  .filter((model) => model.associate)
  .forEach((model) => {
    model.associate(models);
  });

const db = {
  models,
  sequelize,
};

exports = module.exports = db;
