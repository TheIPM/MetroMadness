//-------------All required packages:
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

//---------------Creates a class called ChatLog:
class ChatLog extends Model {}

//---------------Defines the parameters to be captured for the table
ChatLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ChatLog',
    tableName: 'chat_logs',
    timestamps: false,
  }
);

//---------------Exports all information from BusRoute:
module.exports = ChatLog;