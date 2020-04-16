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

// for any requests from firebasestorage that are actual files (token is given)
// use cache first
self.toolbox.router.any(/^.*firebasestorage.*token=.*$/, self.toolbox.cacheFirst);
/*self.toolbox.router.any(/^.*firebasestorage.*token=.*$/, async function(request, values, options) {
  try {
    let response = await caches.match(request.url);

    if (request.headers.get('range')) {
      console.log(/^bytes\=(\d+)\-$/g.exec(request.headers.get('range')));
      var pos = Number(/^bytes\=(\d+)\-$/g.exec(request.headers.get('range'))[1]);
      console.log('Range request for', request.url, ', starting position:', pos);

      if (!response) {
        console.log(request);
        response = await fetch(request.url, {method: 'GET', mode: 'cors'});
        //, headers: {'Content-Range': 'bytes ' + pos + '-' + (pos + 100000) + '/' + '*'}
        console.log(response);
      }

      let ab = await response.arrayBuffer();

      //let ab = await (response ? response.arrayBuffer() : (await fetch(request)).arrayBuffer());

      console.log(ab);

      return new Response(ab.slice(pos), {
        status: 206,
        statusText: 'Partial Content',
        headers: [['Content-Range', 'bytes ' + pos + '-' + (ab.byteLength - 1) + '/' + ab.byteLength]]
      });
    } else {
      if (response) {
        return response;
      } else {
        self.toolbox.cache(request.url, {}).catch((error) => {
          console.log('Could not cache: ', error);
        });

        return await fetch(request);
      }
    }
  } catch (error) {
    throw error;
  }
});*/

// for any other requests go to the network, cache,
// and then only use that cached resource if your user goes offline
self.toolbox.router.default = self.toolbox.networkFirst;

self.addEventListener('message', async function(event) {
  if (event.data.command === 'add') {
    let alreadyCached = await caches.match(event.data.url);

    if (!alreadyCached) {
      self.toolbox.cache(event.data.url).catch((error) => {
        console.log('Could not cache: ', error);
      });
    }
  }
});

//This is important to get the ServiceWorker working straigt after installation
//Which is important so I can use
//window.navigator.serviceWorker.controller.postMessage() in the rest of the files
self.addEventListener('activate', event => {
    clients.claim();
});
