const express = require('express');
const session = require('express-session');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ChatLog = require('./models/ChatLog');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const https = require('https');
const exphbs = require('express-handlebars');
const withAuth = require('./utils/auth');
const sequelize = require('./config/connection');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const User = require('./models/User');
const { format } = require('date-fns');
const userRoutes = require('./controllers/api/userRoutes');

const PORT = process.env.PORT || 3000;
app.get("/test",(req, res) => {
  res.render("test")
});


const sess = {
  secret: 'Super secret secret',
  cookie: {
    maxAge: 300000,
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
  },
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: sequelize
  })
};

app.use(session(sess));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const hbs = exphbs.create({ });

const homeRoutes = require('./controllers/homeRoutes');
const { table } = require('console');
app.use('/', homeRoutes);

app.use('/api/users', userRoutes);

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(express.static('public'));

// // Serve the index.html file on the root path
// app.get('/', withAuth, (req, res) => {
//   res.sendFile(path.join(__dirname, '/views/index.html'));
// });




// Add this route before the "/rooms" route
app.get('/', withAuth, async (req, res) => {
  try {
    const userData = await User.findOne({
      where: {
        id: req.session.user_id,
      },
      attributes: { exclude: ['password'] },
    });

    const user = userData.get({ plain: true });
    res.render('index', {
      ...user,
      logged_in: req.session.logged_in,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get('/username', withAuth, (req, res) => {
  console.log('Sending username:', req.session.username);
  res.json({ username: req.session.username });
});

// Return the current list of chat rooms as JSON
app.get('/rooms', (req, res) => {
  const nonEmptyRooms = {};
  for (const [room, clients] of Object.entries(rooms)) {
    if (clients > 0) {
      nonEmptyRooms[room] = clients;
    }
  }
  res.json(nonEmptyRooms);
});

//Loading the login page
app.get('/login', (req, res) => {
  res.render("login");
});

app.get('/api/chat_logs/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const chatLogs = await ChatLog.findAll({ where: { username } });

    // Format the timestamps
    const formattedChatLogs = chatLogs.map(log => ({
      ...log.toJSON(),
      timestamp: format(new Date(log.timestamp), 'PPpp')
    }));

    res.json(formattedChatLogs);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).send('Error fetching chat logs');
  }
});

app.delete('/api/chat_logs/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const result = await ChatLog.destroy({ where: { username } });
    if (result) {
      res.status(200).send('Chat logs deleted successfully');
    } else {
      res.status(404).send('No chat logs found for the specified user');
    }
  } catch (error) {
    console.error('Error deleting chat logs:', error);
    res.status(500).send('Error deleting chat logs');
  }
});

// Fetch and return vehicle positions from the GTFS API
app.get('/api/vehicle_positions', (req, res) => {
  const requestSettings = {
    method: 'GET',
    url: 'https://gtfs.adelaidemetro.com.au/v1/realtime/vehicle_positions',
    encoding: null
  };

  


  
  https.get(requestSettings.url, (response) => {
    if (response.statusCode === 200) {
      const chunks = [];
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        const body = Buffer.concat(chunks);
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(body);
        const vehicles = feed.entity.map((entity) => {
          console.log(entity);
          return {
          id: entity.id,
          latitude: entity.vehicle.position.latitude,
          longitude: entity.vehicle.position.longitude,
          routeId: entity.vehicle.trip.routeId,
          }
        });
        res.json(vehicles);
      });
    } else {
      res.status(500).send('Error fetching vehicle positions');
    }
  }).on('error', (error) => {
    res.status(500).send('Error fetching vehicle positions');
  });
});

const rooms = {};


// Handle WebSocket connections and events
io.use((socket, next) => {
  session(sess)(socket.request, {}, next);
});

io.on('connection', (socket) => {
  console.log('A user connected');
  const req = socket.request;

  if (req.session.username) {
    socket.username = req.session.username;
    console.log(`User set their username as: ${req.session.username}`);
  }

  //handles users joining a room
  socket.on('join room', (room) => {
    // Leave the previous room if the user was in one
    const prevRoom = Array.from(socket.rooms).find(r => r !== socket.id);
    if (prevRoom) {
      socket.leave(prevRoom);
      rooms[prevRoom]--;
    }
  
    if (!rooms[room]) {
      rooms[room] = 1;
    } else if (rooms[room] < 20) {
      rooms[room]++;
    } else {
      socket.emit('room full', 'The room is full. Please try another room.');
      return;
    }
    
    socket.join(room);
  
    // Check if the room is empty after the user joins
    const clients = io.sockets.adapter.rooms.get(room);
    if (!clients || clients.size === 0) {
      delete rooms[room];
      console.log(`Room ${room} is empty and has been destroyed.`);
    }
  
    socket.emit('room joined');
  });
  
  // Handle chat messages from users and save them to the database
  socket.on('chat message', async (msg) => {
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) {
      io.to(room).emit('chat message', { username: socket.username, message: msg });
      try {
        await ChatLog.create({
          room: room,
          username: socket.username,
          message: msg,
        });
        console.log('Chat log saved.');
      } catch (error) {
        console.error('Failed to save chat log:', error);
      }
    }
  });

  socket.on('disconnect', () => {
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    console.log('A user disconnected');
    
    if (room) {
      if (rooms[room]) {
        rooms[room]--;
        if (rooms[room] === 0) {
          delete rooms[room];
          console.log(`Room ${room} is empty and has been destroyed.`);
        }
      }
  
      socket.leave(room);
      
      // Check if the room is empty after the user disconnects
      const clients = io.sockets.adapter.rooms.get(room);
      if (!clients || clients.size === 0) {
        delete rooms[room];
        console.log(`Room ${room} is empty and has been destroyed.`);
      }
    }
  });
});





sequelize.sync({ force: false }).then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});