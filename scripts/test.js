var fs = require('fs');
var path = require('path');
var simpleDOM = require('simple-dom');

// Alias the global as "window". Some parts of the client app need this.
var window = global;

// Load in the vendor and app bundles
var vendorSrc = fs.readFileSync('dist/assets/vendor.js').toString();
var appSrc = fs.readFileSync('dist/assets/leaktest.js').toString();

eval(vendorSrc);
eval(appSrc);

// Alias require to requirejs. Some parts of the client app need this.
var requirejs = require;

// Shim for jquery "get" function, so that the data fetch will work.
define('jquery', [], function() {
  return { 'default': {
    get: function(url) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        var filepath = path.join('public', url);

        try {
          var contents = fs.readFileSync(filepath).toString();
          var data = JSON.parse(contents);
          resolve(data);
        } catch(e) {
          console.log('Couldn\'t read file:', filepath);
          reject(e);
        }
      });
    }
  }};
});

// Actual testing code below
App = require('leaktest/app').default;

function createApp() {
  var app = null;

  Ember.run(function() {
    app = App.create({ autoboot: false });

    app.instanceInitializer({
      name: 'stub-renderer',
      initialize: function(app) {
        var doc = new simpleDOM.Document();
        var domHelper = new Ember.View.DOMHelper(doc);

        app.registry.register('renderer:-dom', {
          create: function() {
            return new Ember.View._Renderer(domHelper);
          }
        });
      }
    });
  });

  return app;
}

var app = createApp();

function serialize(element) {
  var serializer = new simpleDOM.HTMLSerializer(simpleDOM.voidMap);
  return serializer.serialize(element);
}

function cleanup(result) {

  // There's currently a memory leak in Ember where cached action helper
  // instances are never released. This manually cleans the cache after a
  // render. More detail here:
  //
  //   https://dl.dropboxusercontent.com/u/23503375/leak.pdf
  //
  // Note: we can't simply reset the object to {}, because it's aliased in other
  // places, and doing so would only wipe out this one reference to the object.
  var ActionHelper = Ember.__loader.require(
    'ember-routing-htmlbars/helpers/action').ActionHelper;

  for (var action in ActionHelper.registeredActions) {
    delete ActionHelper.registeredActions[action];
  }

  return result;
}

function render(instance) {
  var element;

  Ember.run(function() {
    element = instance.view.renderToElement();
  });

  return serialize(element);
}

function runOnce() {
  var ActionHelper = Ember.__loader.require(
    'ember-routing-htmlbars/helpers/action').ActionHelper;
  console.log('Registered actions:',
              Object.keys(ActionHelper.registeredActions).length);

  return app.visit('/')
    .then(render);
}

function runOnceWithPatch() {
  return app.visit('/')
    .then(render)
    .then(cleanup);
}

function nTimes(fn, n) {
  if (n <= 0) {
    return;
  }

  fn().then(nTimes.bind(null, fn, n - 1));
}

nTimes(runOnce, 2000);
