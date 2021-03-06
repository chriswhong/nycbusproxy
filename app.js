var Mustache = require('mustache');
var request = require('request');
var express = require('express');
var app = express();

//B52 Bus working api call
//http://api.prod.obanyc.com/api/siri/vehicle-monitoring.json?&LineRef=MTA%20NYCT_B52&key=adf3b381-85b5-48b9-a049-32c335108f6e

//create a route for a get request to /api/b52
app.get('/api/:route', function(req, res) {

  //empty geojson featureCollection
  var featureCollection = {
    type: 'FeatureCollection',
    features: []
  }
  
  var options = {
    route: req.params.route.toUpperCase(),
    apiKey: 'adf3b381-85b5-48b9-a049-32c335108f6e'
  }

  var template = 'http://api.prod.obanyc.com/api/siri/vehicle-monitoring.json?&LineRef=MTA%20NYCT_{{route}}&key={{apiKey}}'

  var apiCall = Mustache.render(template,options);

  console.log('Getting data for ',apiCall);

  //get data from bustime
  request(apiCall, function(err,response,body) {
    var data = JSON.parse(body);
    data = data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0];
    if(data.VehicleActivity) {
      var vehicles = data.VehicleActivity;

      //iterate over vehicles, convert each to a geojson feature
      vehicles.forEach(function(vehicle) {
        var feature = makeFeature(vehicle);
        featureCollection.features.push(feature);
      });

      //send the featureCollection as the response
      res.send(JSON.stringify(featureCollection));
    } else {
      res.send('Something went wrong');
    }
  });
});

var port = process.env.PORT || 3000;

var server = app.listen(port, function () {
  console.log('App listening on port ',port);
});

//transforms real-time data for a vehicle into a valid geojson feature
function makeFeature(vehicle) {

  //empty geojson point feature
  var feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: []
    }
  };

  //set the coordinates
  var location = vehicle.MonitoredVehicleJourney.VehicleLocation;
  feature.geometry.coordinates = [location.Longitude,location.Latitude];

  //set the properties
  feature.properties = {
    line: vehicle.MonitoredVehicleJourney.PublishedLineName,
    direction: vehicle.MonitoredVehicleJourney.DirectionRef,
    timestamp: vehicle.RecordedAtTime,
    bearing: vehicle.MonitoredVehicleJourney.Bearing
  }

  return feature;
}



