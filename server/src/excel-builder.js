const logger = require("./logger");
const DataDictionary = require("./data-dictionary");
const async = require("async");
const util = require("./util");
const exportColumnsConfig = require("./export-columns-config");
const crud = require("./crud");
const Sequelize = require("sequelize");
const db = require("./sequelize");
// var excelbuilder = require("msexcel-builder-colorfix");
// var excel = require("excel4node");
var excel = require("exceljs");
var moment = require("moment");

async function buildExcel(orgId) {
  logger.info("Fetching excel builder field map");
  let fieldMap = await db.models["Connections"].findByPk(orgId, {
    attributes: ["id", "org_name"],
    include: [
      {
        association: "Objects",
        attributes: ["object_api_name", "oldest_record", "newest_record"],
        include: [
          {
            association: "Fields",
            attributes: [
              "label",
              "name",
              "type",
              "inline_help_text",
              "updateable",
              "custom",
              "picklist_values",
              "created_date",
              "last_modified_date",
            ],
            include: [
              {
                association: "CustomField",
                attributes: ["source_table", "source_field", "notes"],
              },
            ],
          },
        ],
      },
    ],
    where: {
      org_id: orgId,
    },
  });

  var workbook = new excel.Workbook();

  for (let object of fieldMap.Objects) {
    var tabName = object.object_api_name;
    var sheet = workbook.addWorksheet(tabName);
    var rowValues = [];
    //First Row Object Summary
    rowValues[0] = tabName;
    sheet.addRow(rowValues);
    sheet.getRow(1).height = 34;
    sheet.getCell("A1").font = { size: 24, bold: true };

    //First Row Object Record Count
    // TODO: Need to fetch total object count, probably store it on object in DB.
    // I think it is already being collected but not stored when fieldmap is created in dd
    // sheet.set(1, 2, "Total Count: " + objectStats[objToExport.name].ct);
    rowValues[0] = "Total Count: ";
    sheet.addRow(rowValues);
    sheet.getCell("A2").font = { bold: true };
    rowValues[0] = "Oldest Record: " + object.oldest_record;
    sheet.addRow(rowValues);
    sheet.getCell("A3").font = { bold: true };
    rowValues[0] = "Newest Record: " + object.newest_record;
    sheet.addRow(rowValues);
    sheet.getCell("A4").font = { bold: true };
    rowValues = [];
    let colWidths = [];
    for (var x = 0; x < exportColumnsConfig.length; x++) {
      rowValues.push(util.toProperCase(exportColumnsConfig[x].name));
      colWidths.push(exportColumnsConfig[x].width);
    }
    rowValues.push("Source Table", "Source Field", "Notes");
    colWidths.push(50, 50, 50);
    sheet.addRow(rowValues);
    let row = sheet.getRow(5);
    row.height = 20;
    row.font = { size: 14, bold: true };
    row.eachCell(function (cell, colNumber) {
      cell.border = { style: { bottom: "thin" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "EFEFEF00" },
        bgColor: { argb: "EFEFEF00" },
      };
      cell.alignment = {vertical: 'middle', horizontal: 'center'};
      sheet.getColumn(colNumber).width = colWidths[colNumber - 1];
    });
    //Set row values
    for (let objectField of object.Fields) {
      rowValues = [];
      for (let field of exportColumnsConfig) {
        if (objectField[field.databaseName] && objectField[field.databaseName].length < 32767) {
          rowValues.push(objectField[field.databaseName]);
        } else if (objectField[field.databaseName] && objectField[field.databaseName].length > 32767) {
          console.log(objectField[field.databaseName].length);
          rowValues.push("Cell length limit exceeded");
        } else {
          rowValues.push("");
        }
      }
      rowValues.push(objectField.CustomField.source_table, objectField.CustomField.source_field, objectField.CustomField.notes);
      sheet.addRow(rowValues);
      row = sheet.lastRow;
      row.eachCell(function (cell) {
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    }
  }
  return workbook;
}

exports = module.exports = {
  buildExcel,
};
