const path = require("path");
const { createLogger, format, transports } = require("winston");
const config = require("../../config");

const logFormat = format.printf(
  ({ level, message }) => `${level}: ${JSON.stringify(message, null, 2)}`
);

const logger = createLogger({
  format: format.combine(format.colorize(), format.simple(), logFormat),
});

if (process.env.NODE_ENV !== "production") {
  logger.level = "debug";
  logger.add(new transports.Console());
} else {
  logger.level = "info";
  logger.add(
    new transports.File({
      filename: path.join(
        process.env.LOG_PATH,
        `${config.projectName}_error.log`
      ),
      level: "error",
    }),
    new transports.File({
      filename: path.join(
        process.env.LOG_PATH,
        `${config.projectName}_combined.log`
      ),
    })
  );
}

exports = module.exports = logger;
