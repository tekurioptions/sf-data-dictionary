module.exports = [
  {
    "name": "label",
    "databaseName": "label",
    "width": 42
  },
  {
    "name": "name",
    "databaseName": "name",
    "width": 45
  },
  {
    "name": "type",
    "databaseName": "type",
    "width": 30,
    "action": "processFieldType"
  },
  {
    "name": "inlineHelpText",
    "databaseName": "inline_help_text",
    "width": 40
  },
  {
    "name": "updateable",
    "databaseName": "updateable",
    "width": 15
  },
  {
    "name": "custom",
    "databaseName": "custom",
    "width": 12
  },
  {
    "name": "picklistValues",
    "databaseName": "picklist_values",
    "width": 60,
    "action": "processPickListValues"
  },
  {
    "name": "CreatedDate",
    "databaseName": "created_date",
    "width": 25,
    "action": "getToolingData"
  },
  {
    "name": "LastModifiedDate",
    "databaseName": "last_modified_date",
    "width": 25,
    "action": "getToolingData"
  }
];