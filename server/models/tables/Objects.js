const Sequelize = require("sequelize");

class Objects extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init(
            {
                org_id: DataTypes.STRING,
                object_api_name: DataTypes.STRING,
                count: DataTypes.NUMBER,
                oldest_record: DataTypes.STRING,
                newest_record: DataTypes.STRING
            },
            { sequelize }
        );
    }

    static associate(models) {
        this.ConnectionId = this.belongsTo(models.Connections, {foreignKey: "id", onDelete: 'cascade', hooks:true} );
        this.FieldId = this.hasMany(models.Fields, {foreignKey: "object_id", onDelete: 'cascade', hooks:true});
    }
}

exports = module.exports = Objects;
