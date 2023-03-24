var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var request = require('request');
var requestSettings = {
  method: 'GET',
  url: 'https://gtfs.adelaidemetro.com.au/v1/realtime/vehicle_positions',
  encoding: null
};
request(requestSettings, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(body);
    feed.entity.forEach(function(entity) {
        console.log(entity);
    });
  }
});