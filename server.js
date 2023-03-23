const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ChatLog = require('./models/ChatLog');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const https = require('https');

app.use(express.static('public'));

// Serve the index.html file on the root path
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Return the current list of chat rooms as JSON
app.get('/rooms', (req, res) => {
  res.json(rooms);
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
        const vehicles = feed.entity.map((entity) => ({
          id: entity.id,
          latitude: entity.vehicle.position.latitude,
          longitude: entity.vehicle.position.longitude,
        }));

        res.json(vehicles);
      });
    } else {
      res.status(500).send('Error fetching vehicle positions');
    }
  }).on('error', (error) => {
    res.status(500).send('Error fetching vehicle positions');
  });
});


// Initialize the chat rooms data structure
const rooms = {};


// Handle WebSocket connections and events
io.on('connection', (socket) => {
  console.log('A user connected');

  //set username
  socket.on('set username', (username) => {
    socket.username = username;
    console.log(`User set their username as: ${username}`);
  });

  //handles users joining a room
  socket.on('join room', (room) => {
    if (!rooms[room]) {
      rooms[room] = 1;
    } else if (rooms[room] < 20) {
      rooms[room]++;
    } else {
      socket.emit('room full', 'The room is full. Please try another room.');
      return;
    }
    socket.join(room);
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
  // Handle user disconnections and update the rooms data structure
  socket.on('disconnect', () => {
    const room = Object.keys(socket.rooms).find(r => r !== socket.id);
    if (room && rooms[room]) {
      rooms[room]--;
    }
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});