const User = require('./User');
const Project = require('./Route');

User.hasMany(route, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

Route.belongsTo(User, {
  foreignKey: 'user_id'
});

module.exports = { User, Route };
