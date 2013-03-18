goog.provide('imaya.ui.GooglePickerAPI');

goog.require('imaya.ui.GoogleLoader');
goog.require('imaya.ui.GoogleClient');

/** @type {string} @const */
imaya.ui.GooglePickerAPI.Scope = 'https://www.googleapis.com/auth/drive';
/** @type {string} @const */
imaya.ui.GooglePickerAPI.ClientId = '';

// Load callback
imaya.ui.GoogleLoader.registerCallback(function() {
  imaya.ui.GoogleClient.registerCallback(function() {
    google.load('picker', '1', {
      'language': 'ja',
      'callback': function() {
        var i;
        var il;
        var queue =  imaya.ui.GooglePickerAPI.queue;

        // dummy auth
        setTimeout(imaya.ui.GooglePickerAPI.dummyAuth, 1);

        // callback
        imaya.ui.GooglePickerAPI.isLoaded = true;
        for (i = 0, il = queue.length; i < il; ++i) {
          queue[i]();
        }
        queue.length = 0;
      }
    });
  });
});

imaya.ui.GooglePickerAPI.dummyAuth = function() {
  gapi.auth.authorize(
    {'client_id': imaya.ui.GooglePickerAPI.ClientId, 'scope': imaya.ui.GooglePickerAPI.Scope, 'immediate': true},
    function() {}
  );
};

imaya.ui.GooglePickerAPI.queue = [];
imaya.ui.GooglePickerAPI.registerCallback = function(func) {
  if (imaya.ui.GooglePickerAPI.isLoaded) {
    func();
  } else {
    imaya.ui.GooglePickerAPI.queue.push(func);
  }
};

imaya.ui.GooglePickerAPI.isLoaded = false;
