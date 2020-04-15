/**
 * Check out https://googlechromelabs.github.io/sw-toolbox/ for
 * more info on how to use sw-toolbox to custom configure your service worker.
 */


'use strict';
importScripts('./build/sw-toolbox.js');

self.toolbox.options.cache = {
  name: 'ionic-cache'
};

self.toolbox.options.debug = false;

// pre-cache our key assets
self.toolbox.precache(
  [
    './build/main.js',
    './build/vendor.js',
    './build/main.css',
    './build/polyfills.js',
    'index.html',
    'manifest.json'
  ]
);

// dynamically cache any other local assets
self.toolbox.router.any('/*', self.toolbox.fastest);

// for any other requests go to the network, cache,
// and then only use that cached resource if your user goes offline
self.toolbox.router.default = self.toolbox.networkFirst;

// for any requests from firebasestorage that are actual files (token is given)
// use cache first
self.toolbox.router.any(/^.*firebasestorage.*token=.*$/, async function(request, values, options) {
  try {
    if (request.headers.get('range')) {
      var pos = Number(/^bytes\=(\d+)\-$/g.exec(request.headers.get('range'))[1]);
      console.log('Range request for', request.url, ', starting position:', pos);

      let response = await caches.match(request);

      if (response) {
        console.log('Found response in cache:', response);
        return response;
      } else {
        console.log('No response found in cache. About to fetch from network...');

        self.toolbox.cache(request.url, {}).then(() => {
          console.log('Cached file')
        }).catch((error) => {
          console.log('Could not cache: ', error);
        });

        response = await fetch(request);

        console.log('Response from network is:', response);

        return response;
      }

    } else {
      console.log('Non-range request for', request.url);
      
      let response = await caches.match(request);

      if (response) {
        console.log('Found response in cache:', response);
        return response;
      } else {
        console.log('No response found in cache. About to fetch from network...');

        self.toolbox.cache(request.url, {}).then(() => {
          console.log('Cached file')
        }).catch((error) => {
          console.log('Could not cache: ', error);
        });

        response = await fetch(request);
        console.log('Response from network is:', response);

        return response;
      }
    }
  } catch (error) {
    console.error('Fetching failed:', error);

    throw error;
  }
});
