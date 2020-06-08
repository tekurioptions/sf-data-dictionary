const util = require("util");
const crud = require("./crud");
const db = require("./sequelize");
const ddService = require("./data-dictionary-service");
const excelBuilder = require("./excel-builder");
const logger = require("./logger");
const config = require("../../config");

// Loads routes on the given express app.
function loadRoutes(app, cb) {
  Object.keys(db.models).forEach((model) => {
    app.get(`/api/${model}`, crud.findAll.bind(null, model));

    app.get(`/api/${model}/:id`, crud.findByPk.bind(null, model));
    app.put(`/api/${model}`, crud.upsert.bind(null, model));

    app.delete(`/api/${model}`, crud.destroy.bind(null, model));

    if (model === "Fields") {
      app.post(
        `/api/Fields/GenerateMap`,
        async function (model, req, res) {
          // Create new field map returns array of fields from salesforce with relative object id's appended. Replaces req body for bulk create
          let fieldMap = await ddService.createNewFieldMap(req.body.id);
          // crud.upsert(model, req, res);
          res.send(fieldMap);
        }.bind(null, model)
      );
    }
  });

  app.get("/api/oauth-init", async function (req, res) {
    ddService.oauthInit(req).then((url) => {
      res.send(url);
    });
  });

  app.get("/api/oauth-response", async function (req, res) {
    ddService.oauthAuthorize(req).then(
      (result) => {
        setTimeout(() => {
          res.redirect(config.baseUrl);
        }, 1000);
      },
      (err) => {
        res.redirect(config.baseUrl);
      }
    );
  });

  app.get(`/api/getOrgObjects`, async function (req, res) {
    // Fetch all available objects in org
    ddService.getOrgObjects(req.query.id).then(
      (result) => {
        res.send(result.sobjects);
      },
      (err) => {
        res.status(500).send("Error Fetching objects");
      }
    );
  });

  app.post(`/api/BuildExcel`, async function (req, res) {
    excelBuilder.buildExcel(req.body.orgId).then((workbook) => {
      res.set(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      workbook.xlsx.writeBuffer().then(function (buffer) {
        res.send(buffer);
      });
    });
  });
  cb();
}

loadRoutes.async = util.promisify(loadRoutes);

exports = module.exports = loadRoutes;
