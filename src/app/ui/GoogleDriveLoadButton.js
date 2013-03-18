goog.provide('imaya.ui.GoogleDriveLoadButton');

//goog.require('Base64');
goog.require('goog.ui.Button');
goog.require('imaya.ui.GoogleLoader');
goog.require('imaya.ui.GooglePickerAPI');

goog.scope(function() {

/**
 * @param content
 * @param opt_renderer
 * @param opt_domHelper
 * @constructor
 * @extends {goog.ui.Button}
 */
imaya.ui.GoogleDriveLoadButton = function(content, opt_renderer, opt_domHelper) {
  goog.base(this, content, opt_renderer, opt_domHelper);

  /** @type {string} */
  this.clientId;
  /** @type {string} */
  this.responseType;
};
goog.inherits(imaya.ui.GoogleDriveLoadButton, goog.ui.Button);

imaya.ui.GoogleDriveLoadButton.prototype.createDom = function() {
  goog.base(this, 'createDom');

  imaya.ui.GooglePickerAPI.registerCallback(
    function() {
      gapi.auth.authorize(
        {'client_id': this.clientId, 'scope': this.scope, 'immediate': true},
        this.handleAuthFirst.bind(this)
      );
    }.bind(this)
  );
};

/**
 * @param {gapi.auth.Token} auth
 */
imaya.ui.GoogleDriveLoadButton.prototype.handleAuthFirst = function(auth) {
  this.handleAuth(auth, true);
};

/**
 * @param {gapi.auth.Token} auth
 * @param {boolean=} opt_noDialog
 */
imaya.ui.GoogleDriveLoadButton.prototype.handleAuth = function(auth, opt_noDialog) {
  /** @type {imaya.ui.GoogleDriveLoadButton} */
  var that = this;

  // success
  if (auth && !auth.error) {
    goog.events.unlisten(this, goog.ui.Component.EventType.ACTION, this.requestAuth);
    goog.events.listen(this, goog.ui.Component.EventType.ACTION, function() {
      gapi.auth.authorize(
        {'client_id': that.clientId, 'scope': that.scope, 'immediate': true},
        that.showDialog
      );
    });
    this.token = auth.access_token;
    if (!opt_noDialog) {
      this.showDialog();
    }
  // failure
  } else {
    goog.events.listen(this, goog.ui.Component.EventType.ACTION, this.requestAuth);
  }
};

imaya.ui.GoogleDriveLoadButton.prototype.showDialog = function() {
  // 初回成功時に認証済み時のイベントを登録し、コールバック処理も行う
  this.picker = new google.picker.PickerBuilder().
    addView(google.picker.ViewId.DOCS).
    setCallback(this.pickerCallback.bind(this)).
    setAppId(this.clientId).
    build();
  this.picker.setVisible(true);
};

/**
 * @param {Function} func
 */
imaya.ui.GoogleDriveLoadButton.prototype.setCallback = function(func) {
  this.callback = func;
};

imaya.ui.GoogleDriveLoadButton.prototype.requestAuth = function() {
  if (!gapi.auth.getToken()) {
    gapi.auth.authorize(
      {'client_id': this.clientId, 'scope': this.scope, 'immediate': false},
      this.handleAuth.bind(this)
    );
  } else {
    this.handleAuth(gapi.auth.getToken(), false);
  }
};

/**
 * @param {string} id
 */
imaya.ui.GoogleDriveLoadButton.prototype.setClientId = function(id) {
  this.clientId = id;
};

/**
 * @param {string} scope
 */
imaya.ui.GoogleDriveLoadButton.prototype.setScope = function(scope) {
  this.scope = scope;
};

/**
 * @param {string} type
 */
imaya.ui.GoogleDriveLoadButton.prototype.setResponseType = function(type) {
  this.responseType = type;
};

/**
 * @return {string}
 */
imaya.ui.GoogleDriveLoadButton.prototype.getToken = function() {
  return this.token;
};

/**
 * @param {(string|Array.<number>|Uint8Array)} data
 */
imaya.ui.GoogleDriveLoadButton.prototype.pickerCallback = function(data) {
  /** @type {Function} */
  var callback = this.callback;
  /** @type {string} */
  var type = this.responseType;
  /** {Object} */
  var doc;
  /** @type {XMLHttpRequest} */
  var xhr;
  /** @type {gapi.auth.Token} */
  var token;
  /** @type {string} */
  var id;
  /** @type {string} */
  var fileurl;

  if (data[google.picker.Response.ACTION] !== google.picker.Action.PICKED) {
    return;
  }

  doc = data[google.picker.Response.DOCUMENTS][0];
  xhr = new XMLHttpRequest();
  token = gapi.auth.getToken();
  id = doc[google.picker.Document.ID];
  fileurl = 'https://www.googleapis.com/drive/v2/files/' + id;

  xhr.open('GET', fileurl, true);
  xhr.setRequestHeader('Authorization', 'Bearer ' + token.access_token);
  xhr.addEventListener('load', function(ev) {
    var response = JSON.parse(xhr.responseText);
    var dlurl = response['downloadUrl'];
    var dlxhr = new XMLHttpRequest();

    dlxhr.open('GET', dlurl, true);
    dlxhr.setRequestHeader('Authorization', 'Bearer ' + token.access_token);

    if (type) {
      dlxhr.responseType = type;
    }

    dlxhr.addEventListener('load', function(ev) {
      callback(dlxhr.response);
    }, false);
    dlxhr.send();
  }, false);
  xhr.send();
};


});
