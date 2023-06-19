let map;
let marker;

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

        map.setCenter(location);
        map.setZoom(15);
        marker = new google.maps.Marker({
          position: location,
          map: map,
        });
      } else {
        displayElement.textContent =
          "Geocode was not successful for the following reason: " + status;
      }
    });
  }
}

function findRestaurants() {
  var restaurantType = document.getElementById("restaurant-type").value;
  if (marker) {
    var markerPosition = marker.getPosition();
    var request = {
      location: markerPosition,
      radius: 5000, // Search radius in meters (adjust as needed)
      type: ["restaurant"],
      keyword: restaurantType,
      rankBy: google.maps.places.RankBy.DISTANCE || 2, // Use the value directly or fallback to the numeric value
    };
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, function (results, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        console.log("Five Closest Restaurants:");
        for (var i = 0; i < 5 && i < results.length; i++) {
          console.log(results[i].name);
        }
      }
    });
  }
}
