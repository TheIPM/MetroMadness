let currentRoom = null;
document.addEventListener('DOMContentLoaded', () => {
  //-------------Map logic
  const map = L.map('map').setView([-34.9285, 138.6007], 13); //-------------Set coordinates to Adelaide
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const vehicleMarkers = {};
  const updateVehiclePositions = () => {
    fetch('/api/vehicle_positions')
      .then((response) => response.json())
      .then((data) => {
        data.forEach((vehicle) => {
          const vehicleId = vehicle.id;
          const position = [vehicle.latitude, vehicle.longitude];
          console.log(vehicle);
          function logger(){
            //-------------Add to chat.handlebars: function to call Chat room via route_id:
            joinRoom(vehicle.routeId);
          console.log(vehicle.routeId);
          }
          if (vehicleMarkers[vehicleId]) {
            vehicleMarkers[vehicleId].setLatLng(position);
          } else {
            const marker = L.marker(position).on('click', function(event){
              logger();
              //-------------Tooltip added to map; to display each bus/train & tram so user can select desired route they wish to catch.
            }).bindTooltip(vehicle.routeId).addTo(map);
            vehicleMarkers[vehicleId] = marker;
          }
        });
      })
      .catch((error) => console.error('Error fetching vehicle positions:', error));
  };
  setInterval(updateVehiclePositions, 10000); // Update every 10 seconds

//-------------Chat logic:
  const socket = io();
  const roomForm = document.getElementById('roomForm');
  const chatForm = document.getElementById('chatForm');
  const input = document.getElementById('input');
  const messages = document.getElementById('messages');
  const roomInput = document.getElementById('room');
  let chatRouteId;

//-------------Join room function which brings in RouteId
  function joinRoom(routeId){
    socket.emit('join room', routeId);
    document.getElementById("busRoute").innerText = routeId;
    Get_Route_Deatails(routeId);
    chatForm.style.display = 'block';
  }
  roomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (roomInput.value) {
      joinRoom(roomInput.value);
      // roomForm.style.display = 'none';
    }
  });
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });
  socket.on('chat message', (data) => {
    console.log('Received chat message:', data)
    const li = document.createElement('li');
    li.textContent = `${data.username}: ${data.message}`;
    messages.appendChild(li);
  });
  async function fetchRooms() {
    const response = await fetch('/rooms');
    const roomsData = await response.json();
    const roomsList = document.getElementById('roomsList');
    roomsList.innerHTML = '';
    for (const room in roomsData) {
      const li = document.createElement('li');
      li.textContent = `${room}: ${roomsData[room]} user(s)`;
      roomsList.appendChild(li);
    }
  }
  const fetchRoomsButton = document.getElementById('fetchRoomsButton');
  fetchRoomsButton.addEventListener('click', fetchRooms);

  //-------------User location logic
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser.'));
      }
    });
  };
  let userMarker;

//-------------Ability to pin user to map using their current location
  const updateUserLocation = async () => {
    try {
      const userLocation = await getUserLocation();

      if (userMarker) {
        userMarker.setLatLng([userLocation.latitude, userLocation.longitude]);
      } else {
        const userMarkerIcon = L.icon({
          iconUrl: 'bus.jpg',
          iconSize: [25, 41], //-------------Set the size of the icon
          iconAnchor: [12, 41], //-------------et the anchor point of the icon
        });
        userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userMarkerIcon }).addTo(map);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  // Call updateUserLocation initially to add the user marker
  updateUserLocation();

  // Update user location every 10 seconds
  setInterval(updateUserLocation, 10000);


//-------------Automatically back to login page afte 5 minutes of inactivity
function back_to_login() {
  if(typeof timeOutObj != "undefined") {
    clearTimeout(timeOutObj);
}
timeOutObj = setTimeout(function(){ 
    localStorage.clear();
    window.location = "/login";
}, 60000);   //will expire after 1 minutes (300000 for 5 minutes)
}
document.onclick = back_to_login;
});
async function getUserName() {
  try {
    const response = await fetch('/username');
    if (response.ok) {
      const data = await response.json();
      console.log('Fetched username:', data.username);
      return data.username;
    } else {
      console.error('Error fetching user data:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}
//-------------Updates Welcome message to display User Name:
async function updateWelcomeMessage() {
  const welcomeMessage = document.querySelector('h2');
  if (welcomeMessage) {
    const username = await getUserName();
    if (username !== null) {
      welcomeMessage.textContent = `Welcome, ${username}!`;
    } else {
      console.error('Username not available');
    }
  }
}
//-------------Displays User Name:
function displayUserName(username) {
  const welcomeText = document.querySelector("#welcome-text");
  if (welcomeText) {
    welcomeText.textContent = `Welcome, ${username}`;
  }
}
document.addEventListener('DOMContentLoaded', () => {
  updateWelcomeMessage();
});

//-------------Fetches all chat log history for user:
async function fetchChatLogs(username) {
  const response = await fetch(`/api/chat_logs/${username}`);
  const chatLogsData = await response.json();
  const chatLogsList = document.getElementById('chatLogsList');
  chatLogsList.innerHTML = '';
  chatLogsData.forEach((chatLog) => {
    const li = document.createElement('li');
    li.textContent = `${chatLog.username}: ${chatLog.message} (${chatLog.timestamp})`;
    chatLogsList.appendChild(li);
  });
}
//-------------Added ability for user to delate all chat log history if they wish
const fetchChatLogsButton = document.getElementById('fetchChatLogsButton');
fetchChatLogsButton.addEventListener('click', async () => {
  const username = await getUserName();
  if (username !== null) {
    fetchChatLogs(username);
    document.getElementById('deleteChatLogsButton').style.display = 'block'; //-------------Show the delete button
  } else {
    console.error('Username not available');
  }
});
document.getElementById('deleteChatLogsButton').addEventListener('click', async () => {
  const username = await getUserName();
  if (username !== null) {
    try {
      const response = await fetch(`/api/chat_logs/${username}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        console.log('Chat logs deleted successfully');
        fetchChatLogs(username);
      } else {
        console.error('Failed to delete chat logs');
      }
    } catch (error) {
      console.error('Error deleting chat logs:', error);
    }
  } else {
    console.error('Username not available');
  }
});

//-------------Gets all route information which displays once the bus/train or tram is selected:
async function Get_Route_Deatails(Route_id) {
  const response = await fetch(`/api/metro_routes/${Route_id}`);
  const Route_Data = await response.json();
  if (Route_Data != null) {
      var Discription = Route_Data[0].mr_toute_description;
      document.getElementById("RouteDiscription").innerText = Discription;
  }
}