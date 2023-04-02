//-------------All required packages:
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

//---------------Creates a class called BusRoute:
class BusRoute extends Model {}

//---------------Defines the parameters to be captured for the table:
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
//---------------Exports all information from BusRoute:
module.exports = BusRoute;
