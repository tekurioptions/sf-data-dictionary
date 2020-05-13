const Sequelize = require('sequelize');

class Fields extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        object_id: DataTypes.NUMBER, // ID is object ID property
        label: DataTypes.STRING,
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        inline_help_text: DataTypes.STRING,
        updateable: DataTypes.STRING,
        custom: DataTypes.STRING,
        picklist_values: DataTypes.STRING,
        created_date: DataTypes.STRING,
        last_modified_date: DataTypes.STRING,
      },
      { sequelize },
    );
  }

  static associate(models) {
      this.ObjectId = this.belongsTo(models.Objects, {foreignKey: "id"});
      this.CustomFieldId = this.hasOne(models.CustomFields, {foreignKey: "field_id", onDelete: 'cascade', hooks:true});
  }
}

exports = module.exports = Fields;
