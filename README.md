uptime
======
A remote monitoring application using Node.js, MongoDB, and Twitter Bootstrap.

Original version from [https://github.com/fzaninotto/uptime](https://github.com/fzaninotto/uptime), this version features a few improvements and fixes.

### Improvements

* Express v4
* TCP Pooler
* MongoDB reconnect
* Hipchat support
* Basic auth removed (should be done externally, ex: nginx)
* Automatic monitor process spawning

<img src="https://raw.github.com/fzaninotto/uptime/downloads/check_details.png" title="Visualizing the availability of an HTTP check in Uptime" width="50%" valign="top" />
<img src="https://raw.github.com/fzaninotto/uptime/downloads/check_form.png" title="Editing check attributes (polling interval, slow threshold, alert threshold, pattern to match, tags) in Uptime" width="50%" valign="top" />

Features
--------

* Monitor websites
* Tweak frequency of monitoring on a per-check basis, up to the second
* Check the presence of a pattern in the response body
* Receive notifications
* Record availability statistics for further reporting
* Detailed uptime reports with animated charts
* Monitor availability, responsiveness, average response time, and total uptime/downtime
* Get details about failed checks (HTTP error code, etc.)
* Group checks by tags and get reports by tag
* Complete API for integration with third-party monitoring services
* Plugin system to ease extension and customization

Installing Uptime
-----------------

Uptime 3.2 requires Node.js 0.10+ and MongoDB 2.1.

To install from GitHub, clone the repository and install dependencies using `npm`:

```sh
$ git clone git://github.com/ptisp/uptime.git
$ cd uptime
$ npm install
```

Lastly, start the application with:

```sh
$ node app
```

Adding Checks
-------------

By default, the web UI runs on port 8082, so just browse to

    http://localhost:8082/

And you're ready to begin. Create your first check by entering an URL, wait for the first pass, and you'll soon see data on the charts.

Configuring
-----------

Uptime uses [node-config](https://github.com/lorenwest/node-config) to allow YAML configuration and environment support. Default configuration at `config/default.yaml`:

To modify this configuration, create a `development.yaml` or a `production.yaml` file in the same directory, and override just the settings you need. For instance, to run Uptime on port 80 in production, create a `production.yaml` file as follows:

```yaml
url: 'http://myDomain.com'
```

Node that Uptime works great behind a proxy - it uses the `http_proxy` environment variable transparently.

Architecture
------------

Uptime is composed of two services: a webapp (in `app.js`), and a polling monitor (in `monitor.js)`. For your convenience, the two services start together when you call `node app`.

<img src="https://raw.github.com/fzaninotto/uptime/downloads/architecture.png" title="Uptime architecture" />

You can also run the monitor in a different server. This second server must be able to reach the API of the webapp server: set the `monitor.apiUrl` setting accordingly in the `production.yaml` file of the monitor server.

Monitoring From Various Locations
---------------------------------

You can even run several monitor servers in several datacenters to get average response time. In that case, make sure you set a different `monitor.name` setting for all monitor servers to be able to tell which server make a particular ping.

Using Plugins
-------------

Plugins can add more notification types, more poller types, new routes to the webapp, etc.

To enable plugins, just add a line to the `plugins:` section of the configuration file.
Three of the bundled plugins are already enabled by default:

```yaml
# in config/default.yaml
plugins:
  - ./plugins/console
  - ./plugins/patternMatcher
  - ./plugins/httpOptions
  # - ./plugins/email
```

You can override these settings in your environment configuration, for instance:

```yaml
# in config/production.yaml
# disable the console plugin and enable the email plugin
plugins:
  # - ./plugins/console
  - ./plugins/patternMatcher
  - ./plugins/httpOptions
  - ./plugins/email
```

Third-party plugins:

 * [`webhooks`](https://github.com/mintbridge/uptime-webhooks): notify events to an URL by sending an HTTP POST request
 * [`campfire`](https://gist.github.com/dmathieu/5592418): notify events to Campfire
 * [`pushover`](https://gist.github.com/xphyr/5994345): Notify events to mobile devices

Writing Plugins
---------------

A plugin is a simple Node.js module which hooks into predefined extension points. Uptime automatically requires plugin modules when starting the webapp and the monitor, and tries to call the two following functions:

* `initWebApp(options)` when starting the webapp
* `initMonitor(options)` when starting the monitor

Check the [app.js](https://github.com/fzaninotto/uptime/blob/master/app.js#L97) and [monitor.js](https://github.com/fzaninotto/uptime/blob/master/monitor.js#L8) to see a detail of the options passed to each hook. Also, check the code of existing plugins to understand how they can add new pollers, new notification types, etc.

For instance, if you had to recreate a simple version of the `console` plugin, you could write it as follows:

```js
// in plugins/console/index.js
var CheckEvent = require('../../models/checkEvent');
exports.initWebapp = function() {
  CheckEvent.on('afterInsert', function(checkEvent) {
    checkEvent.findCheck(function(err, check) {
      console.log(new Date() + check.name + checkEvent.isGoDown ? ' goes down' : ' goes back up');
    });
  });
}
```
All Uptime entities emit lifecycle events that you can listen to on the Model class. These events are `beforeInsert`, `afterInsert`, `beforeUpdate`, `afterUpdate`, `beforeSave` (called for both inserts and updates), `afterSave` (called for both inserts and updates), `beforeRemove`, and `afterRemove`. For more information about these events, check the [mongoose-lifecycle](https://github.com/fzaninotto/mongoose-lifecycle) plugin.

API
---------------

All API requests should be prefixed with `api`.
The API response always uses the `application/json` mimetype.
API requests do not require authentication.

Example of a valid API request:

`GET http://example.com/api/checks`

Example for a valid API request using curl :

`curl -i -H "Accept: application/json" -X PUT -d "name=example" -d "url=http://mysite.com" -d "interval=120" http://example.com/api/checks`

### Status codes

The API is designed to return different status codes :

* `200 Ok` : The request was successful, the resource(s) itself is returned as JSON
* `400 Bad Request` : An attribute of the API request is invalid or missing (e.g. the url of a check is missing)
* `404 Not Found` : A resource could not be accessed (e.g. a check ID could not be found)
* `500 Server Error` : Something went wrong on the server side (e.g. a check could not be saved in database)

### CRUD routes

#### `GET /checks`

Return a list of all checks

#### `GET /checks/needingPoll`

Return a list of checks that need a poll (i.e. not paused, plus new or last tested > interval set between tests)

#### `GET /checks/:id`

Return a single check

Parameter :

* `id` : (required) Id of the check

Ex: `http://localhost:8082/api/checks/527a25bdc9de6e0000000004`

#### `GET /checks/:id/pause`

Toggle the status (isPaused) of a check

Parameter :

* `id` : (required) Id of the check

Ex: `http://localhost:8082/api/checks/527a25bdc9de6e0000000004/pause`

#### `PUT /check/:id/test`

Updates the last checked date for a check. Used to avoid double check when a target is slow.
Return the number of affected records in the database (1 or 0).

Parameter :

* `id` : (required) Id of the check

Ex: `http://localhost:8082/api/checks/527a25bdc9de6e0000000004/test`

#### `GET /pings`

Return a list of all pings

Parameters :

* `?page=1` : (optional) Paginate results by 50
* `?check=:id` : (optional) Return only the pings for a given check

Ex: `http://localhost:8082/api/pings?check=527a25bdc9de6e0000000004`

#### `GET /pings/events`

Return a list of events (CheckEvent) aggregated by day, limited to the latest week, and to 100 results

#### `POST /pings`

Create a ping for a check, if the check exists and is not already polled

Parameters :

* `checkId` : (required) Id of the check
* `status` : (required)  Status
* `timestamp` : (optional) Date of polling
* `time` : (required) Response time
* `name` : (optional) Monitor name
* `error` : (optional)
* `details` : (optional)

#### `GET /tags`

Return list of all tags

#### `GET /tags/:name`

Return a single tag

Parameter :

* `name` : (required) name of the tag

Ex: `http://localhost:8082/tags/good`

#### `PUT /checks`

Create a new check and return it

Parameters :

* `url` : (required) Url of the check
* `name` : (optional) Name of the check - if empty, url will be set as check name
* `interval` : (optional) Interval of polling
* `maxTime` : (optional) Slow threshold
* `isPaused` : (optional) Status of polling
* `alertTreshold` : (optional) set the threshold of failed pings that will create an alert
* `tags` : (optional) list of tags (comma-separated values)
* `type` : (optional) type of check (auto|http|https|udp)

#### `POST /checks/:id`

Update a check and return it

Parameters :

* `id` : (required) Id of the check
* `url` : (optional) Url of the check
* `name` : (optional) Name of the check - if empty, url will be set as check name
* `interval` : (optional) Interval of polling
* `maxTime` : (optional) Slow threshold
* `isPaused` : (optional) Status of polling
* `alertTreshold` : (optional) set the threshold of failed pings that will create an alert
* `tags` : (optional) list of tags (comma-separated values)
* `type` : (optional) type of check - values : `auto`|`http`|`https`|`udp`

Ex: `http://localhost:8082/api/checks/527a25bdc9de6e0000000004`

#### `DELETE /checks/:id`

Delete a check

Parameters :

* `id` : (required) Id of the check

Ex: `http://localhost:8082/api/checks/527a25bdc9de6e0000000004`

### Statistics routes

#### `GET /checks/:id/stat/:period/:timestamp`

Return check stats for a period

Parameters :

   * `id` : (required) Id of the check
   * `period` : (required) Period - values :  `hour`|`day`|`month`|`year`
   * `timestamp` : (required) Start date (timestamp)

Ex: `http://localhost:8082/api/checks/527a25bdc9de6e0000000004/stat/day/1383260400000`

#### `GET /checks/:id/stats/:type`

Return check stats for a period

Parameters :

* `id` : (required) Id of the check
* `type` : (required) Period - values :  `hour`|`day`|`month`|`year`
* `?begin=` : (required) Start date (timestamp)
* `?end=` : (required) End date (timestamp)

Ex: `http://localhost:8082/api/checks/527a25bdc9de6e0000000004/stats/month?begin=1383260400000&end=1385852399999`

#### `GET /tags/:name/checks/:period/:timestamp`

Return tag stats for a period, joined by checks

Parameters :

* `name` : (required) Name of the tag
* `period` : (required) Period - values :  `hour`|`day`|`month`|`year`
* `timestamp` : (required) Start date (timestamp)

Ex: `http://localhost:8082/api/tags/good/checks/month/1384816432099`

#### `GET /tags/:name/stat/:period/:timestamp`

Return tag stats for a period

Parameters :

* `name` : (required) Name of the tag
* `period` : (required) Period - values :  `hour`|`day`|`month`|`year`
* `timestamp` : (required) Start date (timestamp)

Ex: `http://localhost:8082/api/tags/good/stat/month/1383260400000`

#### `GET /tags/:name/stats/:type`

Return tag stats for a period

Parameters :

* `name` : (required) Name of the tag
* `type` : (required) Period - values :  `day`|`month`|`year`
* `?begin=` : (required) Start date (timestamp)
* `?end=` : (required) End date (timestamp)

Ex: `http://localhost:8082/api/tags/good/stats/month?begin=1383260400000&end=1385852399999`

### Event routes

#### `GET /checks/:id/events`

Return the list of all events for the check

Parameter :

* `id` : (required) Id of the check

Ex: `http://localhost:8082/api/checks/527a25bdc9de6e0000000004/events`

#### `GET /tags/:name/events`

Return the list of all events associated to the tag

Parameter :

* `name` : (required) Name of the tag
* `?begin=` : (optional) Start date (timestamp)
* `?end=` : (optional) End date (timestamp)

Ex: `http://localhost:8082/api/tags/good/events?begin=1383260400000&end=1385852399999`


License
-------

The Uptime code is free to use and distribute, under the [MIT license](https://raw.github.com/fzaninotto/uptime/master/LICENSE).

Uptime uses third-party libraries:

* [NodeJS](http://nodejs.org/), licensed under the [MIT License](https://github.com/joyent/node/blob/master/LICENSE#L5-22),
* [Socket.io](http://socket.io/), licensed under the [MIT License](https://github.com/LearnBoost/socket.io/blob/master/Readme.md),
* [MongooseJS](http://mongoosejs.com/), licensed under the [MIT License](https://github.com/LearnBoost/mongoose/blob/master/README.md),
* [jQuery](http://jquery.com/), licensed under the [MIT License](http://jquery.org/license),
* [TwitterBootstrap](http://twitter.github.com/bootstrap/), licensed under the [Apache License v2.0](http://www.apache.org/licenses/LICENSE-2.0),
* [Flotr2](http://www.humblesoftware.com/flotr2/), licensed under the [MIT License](https://github.com/HumbleSoftware/Flotr2/blob/master/LICENSE).
* [Favicon](http://www.alexpeattie.com/projects/justvector_icons/), distributed under the [Free Art License](http://artlibre.org/licence/lal/en).
