const jsforce = require("jsforce");
const logger = require("./logger");
const DataDictionary = require("./data-dictionary");
const async = require("async");
const util = require("util");
const exportColumnsConfig = require("./export-columns-config");
const crud = require("./crud");
const Sequelize = require("sequelize");
const db = require("./sequelize");
const config = require("../../config");

var oauth2;

async function oauthInit(req, res) {
  oauth2 = new jsforce.OAuth2({
    loginUrl: req.query.loginUrl,
    clientId: config.db.clientId,
    clientSecret: config.db.clientSecret,
    redirectUri: `${config.baseUrl}/api/oauth-response`,
  });
  logger.info("Redirecting to Salesforce login page");
  return oauth2.getAuthorizationUrl({
    scope: "api id web email profile refresh_token",
  });
}

async function oauthAuthorize(req) {
  var conn = new jsforce.Connection({ oauth2: oauth2 });
  var code = req.param("code");
  logger.info("Attempting to authorize connection");
  return await conn.authorize(code, async function (err, result) {
    if (err) {
      logger.error("Error connecting with Salesforce");
      return new Error();
    }
    logger.info("Auth successful!");
    var connObj = {
      id: result.organizationId,
      org_name: "",
      login_url: conn.instanceUrl,
      username: "",
      access_token: conn.accessToken,
      refresh_token: conn.refreshToken,
    };

    await conn.query(
      `SELECT Username FROM User WHERE Id = '${result.id}'`,
      function (err, result) {
        if (err) {
          logger.error("Unable to retrieve Email from Accounts");
        }
        connObj.username = result.records[0].Username;
      }
    );

    await conn.query("SELECT Name FROM Organization", function (err, result) {
      if (err) {
        logger.error("Unable to retrieve Org Name");
      }
      connObj.org_name = result.records[0].Name;
    });
    db.models["Connections"].create(connObj).then(
      (result) => {
        return createResponse.id;
      },
      (err) => {
        return;
      }
    );
  });
}

const getConn = async (orgId) => {
  // Get connection info from db
  const orgConfig = await db.models["Connections"].findByPk(orgId);

  // Create connection
  const conn = new jsforce.Connection({
    oauth2: {
      clientId: config.db.clientId,
      clientSecret: config.db.clientSecret,
      redirectUri: `${config.baseUrl}/api/oauth-response`,
      loginUrl: orgConfig.login_url,
    },
    instanceUrl: orgConfig.login_url,
    accessToken: orgConfig.access_token,
    refreshToken: orgConfig.refresh_token,
  });

  // Instruct db write-back on refresh
  conn.on("refresh", (accessToken, res) => {
    orgConfig.access_token = accessToken;
    orgConfig.save();
  });

  return conn;
};

async function getOrgObjects(orgId) {
  logger.info("Fetching objects org id");
  const conn = await getConn(orgId);
  return conn.describeGlobal();
}

/**
 * Function to create new/update org field map.
 * @param {*} orgId org Id should come from request
 * @param {*} cb
 */
async function createNewFieldMap(orgId) {
  // This function needs org id to fetch objects and their ID's from db so that there is an existing reference
  return new Promise(async (resolve, reject) => {
    logger.info("Fetching object ID's");
    let orgConfig = await db.models["Connections"].findByPk(orgId, {
      include: [
        {
          model: db.models["Objects"],
          attributes: ["id", "object_api_name"],
        },
      ],
    });
    logger.info("Creating new field map");
    const conn = await getConn(orgId);

    var dd = new DataDictionary();
    var process = [
      async.apply(dd.buildMetaDataQuery, orgConfig, conn),
      dd.getObjectMetadata,
      dd.getOrgInfo,
      dd.getFieldDefinitionQuery,
      dd.getAuditInformation,
      dd.getObjectStatistics,
      async.apply(dd.buildNewMap),
      // async.apply(dd.updateLastRunDateTime, configPath)
    ];
    // TODO: figure out the end of the waterfall
    async.waterfall(process, (err, result) => {
      updateObjectStats(result.objects);
      resolve(result.tempArray);
    });
  });
}

async function updateObjectStats(objects) {
  logger.info("Updating object stats");
  let updateObjectArr = [];
  for (let object of objects) {
    let dbObject = {
      id: object.id,
      count: object.count,
      newest_record: object.newest_record,
    };
    updateObjectArr.push(dbObject);
  }
  db.models["Objects"].update(updateObjectArr);
}

exports = module.exports = {
  oauthInit,
  oauthAuthorize,
  getOrgObjects,
  createNewFieldMap,
};
