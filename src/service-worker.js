/**
 * Check out https://googlechromelabs.github.io/sw-toolbox/ for
 * more info on how to use sw-toolbox to custom configure your service worker.
 */


'use strict';
importScripts('./build/sw-toolbox.js');

self.toolbox.options.cache = {
  name: 'ionic-cache',
  maxAgeSeconds: 604800
};

// pre-cache our key assets
self.toolbox.precache(
  [
    './build/main.js',
    './build/vendor.js',
    './build/main.css',
    './build/polyfills.js',
    'index.html',
    'manifest.json',
    './assets/imgs/backgrounds/0.jpg',
    './assets/imgs/backgrounds/1.jpg',
  ]
);

// dynamically cache any other local assets
self.toolbox.router.any('/*', self.toolbox.fastest);

// for any requests from firebasestorage that are actual files (token is given)
// use cache first
self.toolbox.router.any(/^.*firebasestorage.*token=.*$/, self.toolbox.cacheFirst,
  { cache: { name: 'ionic-cache-firebase-files', maxAgeSeconds: 15552000 } });

// for any other requests go to the network, cache,
// and then only use that cached resource if your user goes offline
self.toolbox.router.default = self.toolbox.networkFirst;

self.addEventListener('message', async function(event) {
  try {
    if (event.data.command === 'add') {
      let alreadyCached = await caches.match(event.data.url);

      if (!alreadyCached) {
        self.toolbox.cache(
          event.data.url,
          { cache: { name: 'ionic-cache-firebase-files', maxAgeSeconds: 15552000 } }
        ).catch((error) => {
          console.log('Could not cache: ', error);
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

//This is important to get the ServiceWorker working straigt after installation
//Which is important so I can use
//window.navigator.serviceWorker.controller.postMessage() in the rest of the files
self.addEventListener('activate', event => {
    clients.claim();
});
