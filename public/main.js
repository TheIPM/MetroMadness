document.addEventListener('DOMContentLoaded', () => {
  // Map logic
  const map = L.map('map').setView([-34.9285, 138.6007], 13); // Set coordinates to Adelaide

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
            //Add to chat.handlebars: function to call Chat room via route_id:
            joinRoom(vehicle.routeId);
          
          console.log(vehicle.routeId);
          }
          if (vehicleMarkers[vehicleId]) {
            vehicleMarkers[vehicleId].setLatLng(position);
          } else {
            const marker = L.marker(position).on('click', function(event){
              logger();
            }).addTo(map);
            vehicleMarkers[vehicleId] = marker;
          }
        });
      })
      .catch((error) => console.error('Error fetching vehicle positions:', error));
  };

  setInterval(updateVehiclePositions, 10000); // Update every 10 seconds

  // Chat logic
  const socket = io();
  const usernameForm = document.getElementById('usernameForm');
  const roomForm = document.getElementById('roomForm');
  const chatForm = document.getElementById('chatForm');
  const input = document.getElementById('input');
  const messages = document.getElementById('messages');
  const usernameInput = document.getElementById('username');
  const roomInput = document.getElementById('room');
  let chatRouteId;

  //Join room function which brings in RouteId
  function joinRoom(routeId){
    socket.emit('join room', routeId);
    document.getElementById("busRoute").innerText = routeId;
    chatForm.style.display = 'block';
  }

  usernameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (usernameInput.value) {
      socket.emit('set username', usernameInput.value);
      roomForm.style.display = 'block';
      usernameForm.style.display = 'none';
    }
  });

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

  // User location logic
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

  const updateUserLocation = async () => {
    try {
      const userLocation = await getUserLocation();

      if (userMarker) {
        userMarker.setLatLng([userLocation.latitude, userLocation.longitude]);
      } else {
        const userMarkerIcon = L.icon({
          iconUrl: 'bus.jpg',
          iconSize: [25, 41], // Set the size of the icon
          iconAnchor: [12, 41], // Set the anchor point of the icon
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


  
});