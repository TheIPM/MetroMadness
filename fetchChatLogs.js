const Sequelize = require('sequelize');
const sequelize = require('./config/connection');
const ChatLog = require('./models/ChatLog');

async function fetchChatLogs() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const chatLogs = await ChatLog.findAll();
    console.log('All chat logs:');
    console.log(JSON.stringify(chatLogs, null, 2));

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

fetchChatLogs();