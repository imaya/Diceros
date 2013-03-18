goog.provide('imaya.ui.GoogleClient');

//-----------------------------------------------------------------------------
// google loader
//-----------------------------------------------------------------------------
imaya.ui.GoogleClient.Handler = 'google-client-' + Date.now();

// Load callback
goog.global[imaya.ui.GoogleClient.Handler] = function() {
  var i;
  var il;
  var queue =  imaya.ui.GoogleClient.queue;

  // callback
  imaya.ui.GoogleClient.isLoaded = true;
  for (i = 0, il = queue.length; i < il; ++i) {
    queue[i]();
  }
  queue.length = 0;
};

document.head.appendChild(goog.dom.createDom(
  'script',
  {
    'type': "text/javascript",
    'src': 'https://apis.google.com/js/client.js?onload=' +imaya.ui.GoogleClient.Handler
  }
));

imaya.ui.GoogleClient.queue = [];
imaya.ui.GoogleClient.registerCallback = function(func) {
  if (imaya.ui.GoogleClient.isLoaded) {
    func();
  } else {
    imaya.ui.GoogleClient.queue.push(func);
  }
};

imaya.ui.GoogleClient.isLoaded = false;