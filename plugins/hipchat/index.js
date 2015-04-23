/**
 * HipChat plugin

 * To enable the plugin, add the following line to the plugins section of your config file
 * plugins:
 *  - ./plugins/hipchat
 *
 * Example configuration
 *
 *
 *   hipchat:
 *     roomId: 1  # HipChat API Room ID or name (see Hipchatter docs)
 *     token: your-hipchat-room-notification-token
 *     uptimeDashboardURL: https://your-uptime-installation.example.com
 *
 *     event:
 *       up:        true
 *       down:      true
 *       paused:    false
 *       restarted: false
 */

var config = require('config').hipchat;
var CheckEvent = require('../../models/checkEvent');
var Hipchatter = require('hipchatter');


var roomId = config.roomId;
var token = config.token;
var uptimeDashboardURL = config.uptimeDashboardURL;
var hipchatter = new Hipchatter(token);

exports.initWebApp = function() {

  CheckEvent.on('afterInsert', function(checkEvent) {
    /* Example checkEvent: {
    "__v":0,
    "check": "54863f2cf7236e1074121f7b",
    "message": "restarted",
    "_id": "54c2fc0cad3c3f7b6cc28f1d",
    "tags": ["quux","baz","foo: bar"],
    "timestamp": "2015-01-24T01:57:32.918Z"
    } */


    if (!config.event[checkEvent.message]) {
      console.log('Event ' + checkEvent.message + ' is not enabled in the event section of HipChat config. Will not notify.');
      return;
    } else {
      console.log('Event ' + checkEvent.message + 'caught. Will notify!');

    }


    checkEvent.findCheck(function(err, check) {
      if (err) {
        console.log('HipChat Plugin Error: ' + err);
      }

      var payload = {
        'token': token,
        'color': 'purple',
        'message': 'Application <a href="' + uptimeDashboardURL + '/dashboard/checks/' + check._id + '">' + check.name + '</a> -> ' + checkEvent.message,
        'notify': true,
        'message_format': 'html'
      };

      hipchatter.notify(roomId, payload, function(err) {
        if (!err) {
          console.log('HipChat notification successful. Sent: ' + payload);
        }
      });
    }); // end checkEvent.findCheck(function(err, check) block
  }); // end CheckEvent.on('afterInsert', function(checkEvent) block

  console.log('Enabled HipChat notifications');

}; // end exports.initWebApp = function()
