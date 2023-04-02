//-------------All required packages:
const sequelize = require('./config/connection');
const ChatLog = require('./models/ChatLog');

//-------------Seeds the Data Base:
const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');
    // You can create some sample chat logs here if you want
    await ChatLog.bulkCreate([
      {
        room: 'Room1',
        username: 'User1',
        message: 'Hello, this is a sample message.',
      },
      {
        room: 'Room1',
        username: 'User2',
        message: 'Hello, this is another sample message.',
      },
    ]);

    console.log('Sample chat logs created.');

    process.exit(0);
  } catch (error) {
    console.error('Failed to sync database and seed data:', error);
    process.exit(1);
  }
};

seedDatabase();