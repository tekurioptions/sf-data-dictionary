const Sequelize = require("sequelize");

class Connections extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init(
            {
                id: {type: DataTypes.STRING, primaryKey: true}, // ID field is the org id property
                org_name: DataTypes.STRING,
                login_url: DataTypes.STRING,
                username: DataTypes.STRING,
                access_token: DataTypes.STRING,
                refresh_token: DataTypes.STRING
            },
            { sequelize }
        );
    }

    static associate(models) {
        this.Objects = this.hasMany(models.Objects, {foreignKey: "org_id", onDelete: 'cascade', hooks:true});
    }
}

exports = module.exports = Connections;
