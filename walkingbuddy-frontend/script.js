/*
-------------------------------------------------------
[program description]
-------------------------------------------------------
Author:  Keith Oruwari
ID:      169064920
Email:   oruw4920@mylaurier.ca
__updated__ = "2025-10-27"
-------------------------------------------------------
Description:
Frontend prototype for the Walking Buddy feature of the
Campus Navigator app. Allows users to find nearby walkers,
view their locations on a Leaflet map, and connect safely.
-------------------------------------------------------
*/

// Initialize Leaflet map centered on Laurier
const map = L.map("map").setView([43.4731, -80.5267], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let userMarker = null;
let buddyMarkers = [];
let userCoords = null;

// Get user location
function getUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      userCoords = [latitude, longitude];

      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker(userCoords).addTo(map).bindPopup("You are here 📍").openPopup();
      map.setView(userCoords, 15);

      document.getElementById("status").innerText =
        `Your location: (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
    },
    (err) => {
      console.error("Location error:", err);
      alert("Could not get location.");
    }
  );
}

// Find Walking Buddy (calls backend)
async function findWalkingBuddy() {
  const destInput = document.getElementById("dest");
  const destValue = destInput.value.trim();
  if (!userCoords) {
    alert("Please click 'Use My Location' first.");
    return;
  }
  if (!destValue) {
    alert("Enter a destination address.");
    return;
  }

  // Clear old markers
  buddyMarkers.forEach((m) => map.removeLayer(m));
  buddyMarkers = [];

  document.getElementById("status").innerText = "Finding nearby walkers... ⏳";

  const reqBody = {
    user_id: "user_" + Math.random().toString(26).substring(2, 9),
    start_coord: userCoords,
    destination_address: destValue, // Send the address string for the backend to geocode
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch("https://cp317-group-18-project.onrender.com/service/v1/walking_buddy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || "Server error");

    if (data.count === 0) {
      document.getElementById("status").innerText = "No walking buddies nearby right now 😕";
      return;
    }

    document.getElementById("status").innerText = `Found ${data.count} walking buddy match(es)!`;

    // Add markers for each buddy
    data.matches.forEach((buddy) => {
      const marker = L.marker(buddy.start_coord) // The backend will return the buddy start location
        .addTo(map)
        .bindPopup(
          `<b>${buddy.user_id}</b><br>Distance: ${buddy.distance_km} km away`
        );
      buddyMarkers.push(marker);
    });

  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText =
      "Error connecting to Walking Buddy service.";
  }
}
