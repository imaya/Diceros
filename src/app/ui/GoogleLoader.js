goog.provide('imaya.ui.GoogleLoader');

//-----------------------------------------------------------------------------
// google loader
//-----------------------------------------------------------------------------
imaya.ui.GoogleLoader.Handler = 'glhandle';

// Load callback
goog.global[imaya.ui.GoogleLoader.Handler] = function() {
  var i;
  var il;
  var queue =  imaya.ui.GoogleLoader.queue;

  // callback
  imaya.ui.GoogleLoader.isLoaded = true;
  for (i = 0, il = queue.length; i < il; ++i) {
    queue[i]();
  }
  queue.length = 0;
};

document.head.appendChild(goog.dom.createDom(
  'script',
  {
    'type': "text/javascript",
    'src': "http://www.google.com/jsapi?callback=" + imaya.ui.GoogleLoader.Handler
  }
));

imaya.ui.GoogleLoader.queue = [];
imaya.ui.GoogleLoader.registerCallback = function(func) {
  if (imaya.ui.GoogleLoader.isLoaded) {
    func();
  } else {
    imaya.ui.GoogleLoader.queue.push(func);
  }
};

imaya.ui.GoogleLoader.isLoaded = false;