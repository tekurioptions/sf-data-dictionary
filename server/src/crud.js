const Sequelize = require("sequelize");
const db = require("./sequelize");
const ddService = require("./data-dictionary-service");
const logger = require("./logger");

const Op = Sequelize.Op;

// Available string operators for query where clauses.
const whereOperators = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $like: Op.like,
  $and: Op.and,
  $or: Op.or
};

// Available string operators for field aggregates.
const attributeOperators = {
  $sum: "SUM",
  $count: "COUNT"
};

async function handleResult(result, res, opts) {
  try {
    // Await result;
    const handledResult = await result;

    // Append options
    if (opts) {
      handledResult.offset = opts.offset;
    }

    // Return handled result
    res.json(handledResult);
  } catch (error) {
    res.status(500).send(error.stack || error);
  }
}

// Replace where clause string operators with sequelize operators.
function sanitizeWhere(obj, model) {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (
      Object.keys(model).includes(key) ||
      Object.keys(whereOperators).includes(key)
    ) {
      if (Object.keys(obj[key]).length > 0 && typeof obj[key] === "object") {
        if (Object.keys(whereOperators).includes(key)) {
          newObj[whereOperators[key]] = sanitizeWhere(obj[key], model);
        } else {
          newObj[key] = sanitizeWhere(obj[key], model);
        }
      } else if (Object.keys(whereOperators).includes(key)) {
        newObj[whereOperators[key]] = obj[key];
      } else {
        newObj[key] = obj[key];
      }
    }
  });

  return newObj;
}

// Replace aggregate string operators with sequelize functions.
function configureAttributes(obj) {
  const newObj = obj.map(attribute => {
    if (typeof attribute === "object") {
      // Object should only contain one key and therefore only grab the first one.
      const key = Object.keys(attribute)[0];

      if (Object.keys(attributeOperators).includes(key)) {
        const operator = attribute[key];

        return [
          Sequelize.fn(attributeOperators[key], Sequelize.col(operator.col)),
          operator.alias
        ];
      }
    }

    return attribute;
  });

  return newObj;
}

// Automatically apply group fields based on aggregate functions
function configureGroup(obj, model) {
  // Check for aggregate functions
  let aggregates = 0;
  const groupFields = [];

  // Primary model attributes
  obj.attributes.forEach(attribute => {
    if (typeof attribute === "string") {
      groupFields.push(`${model.getTableName()}.${attribute}`);
    } else {
      aggregates++;
    }
  });

  // TODO: This needs to be broken out to be able to handle nested includes
  // Included model
  if (obj.include) {
    obj.include.forEach(includedModel => {
      groupFields.push(`${includedModel.association}.id`);
      if (includedModel.attributes) {
        // Included model attributes
        includedModel.attributes.forEach(attribute => {
          if (typeof attribute === "string") {
            groupFields.push(`${includedModel.association}.${attribute}`);
          } else {
            aggregates++;
          }
        });
      }
    });
  }

  if (aggregates > 0) {
    return groupFields;
  }

  return [];
}

// Select records from a model without an id in the request path.
async function findAll(model, req, res) {
  let opts = {};
  if (req.query && req.query.opts) {
    opts = JSON.parse(req.query.opts);
  } else if (req.body && req.body.opts) {
    opts = req.body.opts;
  }

  if (opts.where) {
    opts.where = await sanitizeWhere(
      opts.where,
      db.models[model].rawAttributes
    );
  }

  if (opts.attributes) {
    if (!opts.group) {
      const groupBy = await configureGroup(opts, db.models[model]);
      if (groupBy.length > 0) {
        opts.group = groupBy;
      }
    }

    opts.attributes = await configureAttributes(opts.attributes);
  }

  if ("offset" in opts && "limit" in opts) {
    if (opts.include && opts.include.length > 0) {
      opts.distinct = true;
    }

    handleResult(db.models[model].findAndCountAll(opts), res, opts);
  } else {
    handleResult(db.models[model].findAll(opts), res);
  }
}

// Find a specific record when an id is provided in the request path.
async function findByPk(model, req, res) {
  const opts = JSON.parse(req.query.opts) || {};

  if (opts.where) {
    opts.where = await sanitizeWhere(
      opts.where,
      db.models[model].rawAttributes
    );
  }

  handleResult(db.models[model].findByPk(req.params.id, opts), res);
}

// Delete records from the model. Requires an array of ids.
function destroy(model, req, res) {
  // req.body.UpdatedById = req.user.id;

  if (Array.isArray(req.body)) {
    handleResult(
      db.models[model].destroy({
        where: {
          id: {
            [Op.in]: req.body
          }
        }
      }),
      res
    );
  } else {
    handleResult(Promise.resolve([]), res);
  }
}

/*
  Bulk Insert / Update

  Do not bulk update rows that haven't even changed as that would cause tons of useless rows in
  the history tables.
*/
async function upsert(model, req, res) {
  // req.body.UpdatedById = req.user.id;

  if (Array.isArray(req.body)) {
    /*
      Bulk Insert / Update
    */
    if (req.body.length === 0) {
      handleResult(Promise.resolve([]), res);
    } else if ("id" in req.body[0]) {
      const records = req.body.map(body => {

        // Remove id from update and set where clause.
        const id = body.id;
        delete body.id;

        return db.models[model].update(body, {
          where: {
            id
          }
        });
      });
      handleResult(Promise.all(records), res);
    } else if (model === "Fields") {
      // If there are fields that don't have an Id we also want to create associated custom fields
      const records = req.body.map(field => {
        field.CustomField = {source_table: null, source_field: null, notes: null};
        return db.models[model].create(field, {
          include: ["CustomField"]
        });
      });
      handleResult(Promise.all(records), res);
    } else {
      const options = {
        individualHooks: true
      };
      handleResult(db.models[model].bulkCreate(req.body, options), res);
    }
  } else if (req.body.id) {
    /*
      Single Update
    */
    const record = req.body;
    const id = req.body.id;
    delete record.id;

    logger.info(`Updating single ${model}`);
    handleResult(
      db.models[model].update(record, {
        where: {
          id
        }
      }),
      res
    );
  } else {
    /*
        Single Insert
      */
    handleResult(db.models[model].create(req.body), res);
  }
}

exports = module.exports = {
  findAll,
  findByPk,
  upsert,
  destroy,
};
