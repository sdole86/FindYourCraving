let map;
let marker;
let markers = [];
let infoWindow;

(g => {
  var h, a, k, p = "The Google Maps JavaScript API",
      c = "google",
      l = "importLibrary",
      q = "__ib__",
      m = document,
      b = window;
  b = b[c] || (b[c] = {});
  var d = b.maps || (b.maps = {}),
      r = new Set,
      e = new URLSearchParams,
      u = () => h || (h = new Promise(async (f, n) => {
          await (a = m.createElement("script"));
          e.set("libraries", [...r, "places"] + ""); // Include the 'places' library in the libraries list
          for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => h = n(Error(p + " could not load."));
          a.nonce = m.querySelector("script[nonce]")?.nonce || "";
          m.head.append(a)
      }));
  d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n))
})({
  key: "AIzaSyD5MphVq4ozKxB3zywFZEa6ceaNDNgEKQA", 
  v: "weekly"
});

async function initMap() {
  await google.maps.importLibrary("maps");
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });

  // Check if the places library is loaded
  if (!google.maps.places) {
    console.error("Google Maps Places library not loaded!");
    return;
  }

  // Autocomplete
  let input = document.getElementById("address");
  let autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  // Add listener for place selection
  autocomplete.addListener('place_changed', function() {
    let place = autocomplete.getPlace();

    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    // Update address field with full address of the place
    input.value = place.formatted_address;

    // Trigger your queryAddress when selecting option from list
    queryAddress();
  });
}



initMap();

function queryAddress() {
  let address = document.getElementById("address").value;
  let displayElement = document.getElementById("display");
  let selectionDiv = document.getElementById("type-selection");
  document.getElementById("restaurant-display-table").style.display = "none";

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
          icon: "img/house.png",
        });
      } 
      else 
      {
        
        if (status === "success") {
          message = "Search successful!";
        } 
        else 
        {
            message = "Search unsuccessful";
            selectionDiv.style.display = "none";
            // Set the message in the modal
            const modalMessage = document.getElementById("modalMessage");
            modalMessage.textContent = message;

            // Show the modal
            const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
            resultModal.show();
        }
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

  let bounds = new google.maps.LatLngBounds(); 
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

      let currentInfoWindow = null;

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
        
        // Create a unique info window for this marker
        let infoWindowContent = `<div><h4>${name}</h4><p>${address}, ${state} ${zipCode}</p></div>`;
        let localInfoWindow = new google.maps.InfoWindow({
            content: infoWindowContent,
        });

        // Add click event listener to the marker to open the info window
        marker.addListener('click', function() {
        // Close previously opened infoWindow
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        localInfoWindow.open(map, marker);
        currentInfoWindow = localInfoWindow; // Store reference to the open infoWindow
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
        nameCell.setAttribute("data-label", "Name");

        locationCell.innerHTML = `${address}, ${state} ${zipCode}`;
        locationCell.setAttribute("data-label", "Address");

        photoCell.innerHTML = photoUrl ? `<img src="${photoUrl}" alt="Restaurant Photo" width="100" onclick="openLightbox('${photoUrl}')">` : "N/A";
        photoCell.setAttribute("data-label", "Photo");

        priceLevelCell.innerHTML = priceLevel;
        priceLevelCell.setAttribute("data-label", "Price Level");

        ratingCell.innerHTML = ratingStars;
        ratingCell.setAttribute("data-label", "User Ranking");

        bounds.extend(restaurantLocation);
      });

      document.getElementById("restaurant-display-table").style.display = "block";

      map.fitBounds(bounds);
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

document.getElementById("confirm-address-btn").addEventListener("click", queryAddress);