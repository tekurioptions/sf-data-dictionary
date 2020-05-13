var moment = require('moment');
module.exports = {
  processPickListValues : function(fieldAttributes, fieldMap) {
    var options = '';
    if(fieldAttributes.picklistValues) {
      for(var i = 0; i < fieldAttributes.picklistValues.length; i++) {
        options += fieldAttributes.picklistValues[i].label + "; ";
      }
    }
    return options;
  },
  processFieldType : function(fieldAttributes, fieldMap) {
    switch(fieldAttributes.type) {
      case 'reference':
        return 'Lookup (' + fieldAttributes.referenceTo + ')'
        break;
      case 'string':
        if(fieldAttributes.length == 1300) {
          return 'Formula (' + fieldAttributes.length + ')'
        } else {
          return 'Text (' + fieldAttributes.length + ')'
        }
        break;
      case 'double':
        return 'Number';
        break;
      case 'boolean':
        return 'Checkbox';
        break;
      case 'encryptedstring':
        return 'Encrypted Text (' + fieldAttributes.length + ')';
        break;
      case 'textarea':
        if(fieldAttributes.length > 255) {
          return 'Long Textarea (' + fieldAttributes.length + ')'
        } else {
          return 'Textarea (' + fieldAttributes.length + ')'
        }
        break;
      default:
        return fieldAttributes.length > 0 ? this.toProperCase(fieldAttributes.type) + ' (' + fieldAttributes.length + ')' : this.toProperCase(fieldAttributes.type);
    }
  },
  toProperCase : function (value) {
    return value.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },
  getToolingData : function(fieldAttributes, fieldMap, objToExport, fieldNameObj, org) {
    if(fieldAttributes.custom && fieldMap && fieldNameObj && (objToExport.Id || objToExport.name)) {
      var objKey = objToExport.Id ? objToExport.Id : objToExport.name;
      var cleanedFieldName = fieldAttributes.name.substring(0, (fieldAttributes.name.length - 3));
      var fieldName = fieldNameObj.name;

      if(cleanedFieldName.indexOf('__') !== -1) {
        cleanedFieldName = cleanedFieldName.substring((fieldAttributes.name.indexOf('__') + 2), fieldAttributes.name.length);
      }

      if(!fieldMap[objKey] || !fieldMap[objKey][cleanedFieldName]) {
        console.log(objKey, cleanedFieldName);
        return '';
      }

      if(fieldName == 'CreatedDate' && fieldMap[objKey][cleanedFieldName] && fieldMap[objKey][cleanedFieldName].CreatedBy) {
        return moment(fieldMap[objKey][cleanedFieldName][fieldName]).format("YYYY-MM-DD") + ", " + fieldMap[objKey][cleanedFieldName].CreatedBy.Name;
      } else if(fieldName == 'LastModifiedDate' && fieldMap[objKey][cleanedFieldName] && fieldMap[objKey][cleanedFieldName].LastModifiedBy) {
        return moment(fieldMap[objKey][cleanedFieldName][fieldName]).format("YYYY-MM-DD") + ", " + fieldMap[objKey][cleanedFieldName].LastModifiedBy.Name;
      } else {
        return moment(fieldMap[objKey][cleanedFieldName][fieldName]).format("YYYY-MM-DD");
      }
    } else {
      return moment(org.CreatedDate).format("YYYY-MM-DD") + ", " + org.CreatedBy.Name;
    }
  }
};