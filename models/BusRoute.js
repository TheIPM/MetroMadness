const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class BusRoute extends Model {}

BusRoute.init(
  {
    mr_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    mr_toute_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mr_toute_description: {
      type: DataTypes.STRING,
    },
    
  },
  {
    sequelize,
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    modelName: 'metro_routes', 
  }
);

module.exports = BusRoute;
