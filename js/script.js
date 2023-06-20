let map;
let marker;
let markers = [];
let infoWindow;

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  map = new Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });
}

initMap();

function queryAddress() {
  let address = document.getElementById("address").value;
  let displayElement = document.getElementById("display");
  let selectionDiv = document.getElementById("type-selection");

  if (address) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, function (results, status) {
      if (
        status == google.maps.GeocoderStatus.OK &&
        results[0].geometry &&
        results[0].geometry.location
      ) {
        let location = results[0].geometry.location;
        let latitude = location.lat();
        let longitude = location.lng();
        displayElement.textContent =
          "Latitude: " + latitude + ", Longitude: " + longitude;
        // Use the latitude and longitude for further processing
        selectionDiv.style.display = "block";

        // add listener to button
        document.getElementById("find-restaurants-btn").addEventListener("click", function() {
          searchRestaurants();
        });

        map.setCenter(location);
        map.setZoom(15);
        marker = new google.maps.Marker({
          position: location,
          map: map,
        });
      } else {
        displayElement.textContent =
          status + ": Search unsuccessful";
        selectionDiv.style.display = "none";
      }
    });
  }
}

async function searchRestaurants() {
  let restaurantType = document.getElementById("restaurant-type").value;

  let request = {
    location: marker.getPosition(),
    type: 'restaurant',
    rankBy: google.maps.places.RankBy.DISTANCE,
  };

  if (restaurantType) {
    request.keyword = restaurantType;
  }

  let service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, function(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      let restaurants = results.slice(0, 5);
      let tableBody = document.getElementById("restaurant-table").getElementsByTagName("tbody")[0];
      tableBody.innerHTML = ""; // Clear existing table rows

      // Clear existing markers on the map
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers = [];

      restaurants.forEach(function(restaurant) {
        let name = restaurant.name;
        let address = restaurant.vicinity;
        let state = "";
        let zipCode = "";

        if (restaurant.address_components) {
          for (let component of restaurant.address_components) {
            if (component.types.includes("administrative_area_level_1")) {
              state = component.short_name;
            }
            if (component.types.includes("postal_code")) {
              zipCode = component.long_name;
            }
          }
        }

        let photoUrl = restaurant.photos ? restaurant.photos[0].getUrl() : ""; // Get the URL of the first photo, if available
        let priceLevel = "$".repeat(restaurant.price_level || 0);

        let rating = restaurant.rating || "N/A";
        let ratingStars = '';
        if (rating !== "N/A") {
          let roundedRating = Math.round(rating * 2) / 2; // Round to nearest half
          for (let i = 0; i < 5; i++) {
            if (roundedRating >= i + 0.5) {
              ratingStars += '<i class="bi bi-star-fill gold-star"></i>'; 
            } else if (roundedRating >= i) {
              ratingStars += '<i class="bi bi-star-half gold-star"></i>'; 
            } else {
              ratingStars += '<i class="bi bi-star gold-star"></i>'; 
            }
          }
        }

        // Create marker for the restaurant
        let restaurantLocation = restaurant.geometry.location;
        let marker = new google.maps.Marker({
          position: restaurantLocation,
          map: map,
        });

        // Create info window for the marker
        let infoWindowContent = `<div><h4>${name}</h4><p>${address}, ${state} ${zipCode}</p></div>`;
        infoWindow = new google.maps.InfoWindow({
          content: infoWindowContent,
        });

        // Add click event listener to the marker to open the info window
        marker.addListener('click', function() {
          infoWindow.open(map, marker);
        });

        // Add marker to the markers array
        markers.push(marker);

        let row = tableBody.insertRow();
        let nameCell = row.insertCell();
        let locationCell = row.insertCell(); // New cell for combined location field
        let photoCell = row.insertCell();
        let priceLevelCell = row.insertCell();
        let ratingCell = row.insertCell();

        nameCell.innerHTML = `<span class="restaurant-name" onclick="centerMapOnMarker(${restaurantLocation.lat()}, ${restaurantLocation.lng()}, '${name}', '${address}', '${state}', '${zipCode}')">${name}</span>`;
        locationCell.innerHTML = `${address}, ${state} ${zipCode}`; // Combine address, state, and ZIP code
        photoCell.innerHTML = photoUrl ? `<img src="${photoUrl}" alt="Restaurant Photo" width="100" onclick="openLightbox('${photoUrl}')">` : "N/A";
        priceLevelCell.innerHTML = priceLevel;
        ratingCell.innerHTML = ratingStars;
      });

      document.getElementById("restaurant-display-table").style.display = "block";
    }
  });
}

function centerMapOnMarker(lat, lng, name, address, state, zipCode) {
  map.setCenter({ lat: lat, lng: lng });
  map.setZoom(15);
  let infoWindowContent = `<div><h4>${name}</h4><p>${address}, ${state} ${zipCode}</p></div>`;
  infoWindow.setContent(infoWindowContent); // Update the info window content
  infoWindow.open(map); // Open the info window
}


function openLightbox(imageUrl) {
  document.getElementById("lightbox-image").src = imageUrl;
  document.getElementById("lightbox-container").style.display = "flex";
}

function closeLightbox() {
  document.getElementById("lightbox-container").style.display = "none";
}