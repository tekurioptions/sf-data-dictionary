var jsforce = require('jsforce');
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var util = require('./util');
var exportColumnsConfig = require('./export-columns-config');

module.exports = class DataDictionary {

  buildMetaDataQuery(config, conn1, callback) {
    var objectsToExport = config.Objects.map(x => {
      return { name: x.object_api_name };
    });
    var objQueryString = '';
    console.log("Step 3: Determine whether custom object Ids are needed");

    for (var i = 0; i < objectsToExport.length; i++) {
      var obj = objectsToExport[i];
      if (obj.name.endsWith('__c') && !obj.Id) {
        if (i > 0 && objQueryString.length) {
          objQueryString += " OR ";
        }

        var cleanedObjName = obj.name.substring(0, (obj.name.length - 3));
        if (cleanedObjName.indexOf('__') !== -1) {
          cleanedObjName = cleanedObjName.substring((cleanedObjName.indexOf('__') + 2), cleanedObjName.length);
        }

        objQueryString += ("DeveloperName = '" + cleanedObjName + "'");
      }
    }
    var metadataQuery = objQueryString ? 'SELECT Id,DeveloperName FROM CustomObject WHERE (' + objQueryString + ')' : null;
    callback(null, config, conn1, metadataQuery, objectsToExport);
  };

  getObjectMetadata(config, conn1, metadataQuery, objectsToExport, callback) {
    console.log("Step 4: Getting custom object metadata Ids");

    if (metadataQuery) {
      conn1.tooling.query(metadataQuery, function (objError, objResult) {
        if (objError) { return callback(err); }

        for (var x = 0; x < objectsToExport.length; x++) {
          for (var i = 0; i < objResult.records.length; i++) {
            var cleanedObjName = objectsToExport[x].name.substring(0, (objectsToExport[x].name.length - 3));
            if (cleanedObjName.indexOf('__') !== -1) {
              cleanedObjName = cleanedObjName.substring((cleanedObjName.indexOf('__') + 2), cleanedObjName.length);
            }

            if (objResult.records[i].DeveloperName == cleanedObjName) {
              objectsToExport[x].Id = objResult.records[i].Id;
              console.log(' ↳', cleanedObjName);
              break;
            }
          }
        }

        console.log(" ↳ Finished retrieving custom object metadata Ids");
        callback(null, config, conn1, objectsToExport);
      });
    } else {
      console.log(" ↳ No custom object Ids needed...skipping query on object metadata");
      callback(null, config, conn1, objectsToExport);
    }
  };

  getOrgInfo(config, conn1, objectsToExport, callback) {
    conn1.query("SELECT Name,CreatedDate,CreatedBy.Name FROM Organization", function (err, result) {
      if (err) { return callback(err); }
      var orgInfo = result.records[0];
      console.log("Step 5: Retrieving organzation info about", orgInfo.Name);
      callback(null, config, conn1, objectsToExport, orgInfo);
    });
  };

  getFieldDefinitionQuery(config, conn1, objectsToExport, orgInfo, callback) {
    console.log("Step 6: Building query for object's field definition");

    var objEnumIdQuery = '';
    for (var x = 0; x < objectsToExport.length; x++) {
      var obj = objectsToExport[x];
      if (x > 0) {
        objEnumIdQuery += " OR ";
      }
      var objEnumId = obj.Id ? obj.Id : obj.name;
      objEnumIdQuery += ("TableEnumOrId = '" + objEnumId + "'");
    }

    var fieldDefinitionQuery = objEnumIdQuery ? 'SELECT TableEnumOrId,DeveloperName,LastModifiedDate,CreatedDate,CreatedBy.Name,LastModifiedBy.Name FROM CustomField WHERE (' + objEnumIdQuery + ')' : null;
    callback(null, config, conn1, objectsToExport, orgInfo, fieldDefinitionQuery);
  };

  getAuditInformation(config, conn1, objectsToExport, orgInfo, fieldDefinitionQuery, callback) {
    console.log("Step 7: Retrieving object audit information");

    conn1.tooling.query(fieldDefinitionQuery, function (err, result) {
      if (err) { return callback('Tooling API Query Error', fieldError); }
      var fieldMap = {};
      var fields = result.records;

      for (var v = 0; v < fields.length; v++) {
        if (!fieldMap[fields[v].TableEnumOrId]) {
          fieldMap[fields[v].TableEnumOrId] = {};
        }
        fieldMap[fields[v].TableEnumOrId][fields[v].DeveloperName] = fields[v];
      }
      callback(null, config, conn1, objectsToExport, orgInfo, fieldMap);
    });
  };

  getObjectStatistics(config, conn1, objectsToExport, orgInfo, fieldMap, callback) {
    console.log("Step 8: Retrieving object statistics");

    var objectStats = {};
    async.eachSeries(objectsToExport, function (objToExport, cb) {
      console.log(" ↳ Retrieving usage statistics for", objToExport.name);
      conn1.query("SELECT count(Id) ct, MIN(CreatedDate) mn, MAX(CreatedDate) mx FROM " + objToExport.name, function (err, result) {
        if (err) { return cb(err); }
        objectStats[objToExport.name] = result.records[0];
        cb(null);
      });
    }, function (err, res) {
      if (err) { return callback(err); }
      callback(null, config, conn1, objectsToExport, orgInfo, fieldMap, objectStats);
    });
  };

  async buildNewMap(config, conn1, objectsToExport, orgInfo, fieldMap, objectStats, callback) {
    let tempArray = [];
    for (let object of config.Objects) {
      object.count = objectStats[object.object_api_name].ct;
      object.oldest_record = objectStats[object.object_api_name].mn ? moment(objectStats[object.object_api_name].mn).format("LL") : 'N/A';
      object.newest_record = objectStats[object.object_api_name].mx ? moment(objectStats[object.object_api_name].mx).format("LL") : 'N/A';
      await conn1.sobject(object.object_api_name).describe(function (err, data) {
        for (let field of data.fields) {
          let tempLineItem = {};
          for (let column of exportColumnsConfig) {
            if (Array.isArray(field[column.name])) {
              let stringValue = field[column.name]
              .map(x => {
                return x.value;
              })
              .toString();
              if (stringValue < 32767) {
                tempLineItem[column.databaseName] = stringValue;
              } else {
                tempLineItem[column.databaseName] = `String length is: ${stringValue.length}. Exceeds excel cell limit`;
              }
            } else {
              tempLineItem[column.databaseName] = field[column.name];
            }
            if (column.action) {
              let value = util[column.action](field, fieldMap, object, column, orgInfo);
              tempLineItem[column.databaseName] = value;
            }
          }
          tempLineItem.object_id = object.id;
          tempArray.push(tempLineItem);
        }
      });
    }
    callback(null, {objects: config.Objects, tempArray: tempArray});
  }

  //   buildDictionary(config, conn1, objectsToExport, orgInfo, fieldMap, objectStats, callback) {
  //     console.log("Step 9: Generating excel spreadsheet");

  //     var workbook = excelbuilder.createWorkbook("./", orgInfo.Name + " Data Dictionary on " + moment().format('ll') + ".xlsx");

  //     async.eachSeries(objectsToExport, function(objToExport, cb) {
  //       conn1.sobject(objToExport.name).describe(function(err, meta) {
  //         if(err) {return cb("Error describing ", objToExport.name, err);}
  //         var tabName = meta.name !== meta.label ? meta.label + " (" + meta.name + ")" : meta.name;

  //         console.log(' ↳ Processing ' + tabName);
  //         var sheet = workbook.createSheet(tabName, (exportColumnsConfig.length), (meta.fields.length + 5));

  //         //First Row Object Summary
  //         sheet.set(1, 1, tabName);
  //         sheet.font(1, 1, {sz:'24', bold:'true'});
  //         sheet.height(1, 34);

  //         //First Row Object Record Count
  //         if(objectStats[objToExport.name]) {
  //           sheet.set(1, 2, "Total Count: " + objectStats[objToExport.name].ct);
  //           sheet.font(1, 2, {bold:'true'});
  //           var mn = objectStats[objToExport.name].mn ? moment(objectStats[objToExport.name].mn).format("LL") : 'N/A';
  //           sheet.set(1, 3, "Oldest Record: " + mn);
  //           sheet.font(1, 3, {bold:'true'});
  //           var mx = objectStats[objToExport.name].mx ? moment(objectStats[objToExport.name].mx).format("LL") : 'N/A';
  //           sheet.set(1, 4, "Newest Record: " + mx);
  //           sheet.font(1, 4, {bold:'true'});
  //         }

  //         //Set column headers
  //         for(var x = 0; x < exportColumnsConfig.length; x++) {
  //           sheet.width((x + 1), exportColumnsConfig[x].width);
  //           sheet.height(2, 20);
  //           sheet.font((x + 1), 5, {sz:'14',bold:'true'});
  //           sheet.fill((x + 1), 5, {type:'solid', fgColor:'EFEFEF', bgColor:'64'});
  //           sheet.border((x + 1), 5, {bottom:'thin'});
  //           sheet.set((x + 1), 5, util.toProperCase(exportColumnsConfig[x].name));

  //           //Set row values
  //           for(var z = 0; z < meta.fields.length; z++) {
  //             sheet.valign((x + 1), (z + 6), 'center');
  //             sheet.wrap((x + 1), (z + 6), 'true');

  //             var value;
  //             if(exportColumnsConfig[x].action) {
  //               value = util[exportColumnsConfig[x].action](meta.fields[z], fieldMap, objToExport, exportColumnsConfig[x], orgInfo);
  //             } else {
  //               value = meta.fields[z][exportColumnsConfig[x].name];
  //             }
  //             sheet.set((x + 1), (z + 6), value);
  //           }
  //         }
  //         cb();
  //       });
  //     }, function(err, res) {
  //       if(err) {
  //         workbook.cancel();
  //         return callback(err);
  //       }

  //       //save the doc once done
  //       workbook.save(function(ok){
  //         if(!ok) {
  //           workbook.cancel();
  //         }
  //         callback(null, config, orgInfo);
  //       });
  //     });
  //   };

  // updateLastRunDateTime(configPath, config, orgInfo, callback) {
  //   console.log("Step 10: Updating last export date for " + orgInfo.Name + " config file");

  //   const now = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
  //   config.lastRunDateTime = now;
  //   config.firstRunDateTime = config.firstRunDateTime ? config.firstRunDateTime : now;

  //   const writeStream = fs.createWriteStream(configPath + '.js');
  //   const fileToSave = "module.exports = " + JSON.stringify(config, null, 2) + ";";
  //   writeStream.end(fileToSave, function(err) {
  //     if (err) {
  //       return callback('Error writing out lastRunDate', err);
  //     } else {
  //       callback(null);
  //     }
  //   });
  // };
};