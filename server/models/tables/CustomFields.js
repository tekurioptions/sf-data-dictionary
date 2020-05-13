const Sequelize = require("sequelize");

class CustomFields extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init(
            {
                field_id: DataTypes.NUMBER,
                source_table: DataTypes.STRING,
                source_field: DataTypes.STRING,
                notes: DataTypes.STRING,
            },
            { sequelize, tableName: "custom_fields" }
        );
    }

    static associate(models) {
        this.FieldId = this.belongsTo(models.Fields, {foreignKey: "id"});
    }
}

exports = module.exports = CustomFields;
