goog.provide('imaya.ui.GoogleDriveSaveButton');

goog.require('Base64');
goog.require('goog.ui.Button');
goog.require('imaya.ui.GooglePickerAPI');
goog.require('imaya.ui.GoogleDriveSaveDialog');

goog.scope(function() {

/**
 * @param content
 * @param opt_renderer
 * @param opt_domHelper
 * @constructor
 * @extends {goog.ui.Button}
 */
imaya.ui.GoogleDriveSaveButton = function(content, opt_renderer, opt_domHelper) {
  goog.base(this, content, opt_renderer, opt_domHelper);

  /** @type {string} */
  this.clientId;
};
goog.inherits(imaya.ui.GoogleDriveSaveButton, goog.ui.Button);

imaya.ui.GoogleDriveSaveButton.prototype.createDom = function() {
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
imaya.ui.GoogleDriveSaveButton.prototype.handleAuthFirst = function(auth) {
  this.handleAuth(auth, true);
};

/**
 * @param {gapi.auth.Token} auth
 * @param {boolean=} opt_noDialog
 */
imaya.ui.GoogleDriveSaveButton.prototype.handleAuth = function(auth, opt_noDialog) {
  var that = this;

  // success
  if ((auth && !auth.error) || gapi.auth.getToken()) {
    goog.events.unlisten(this, goog.ui.Component.EventType.ACTION, this.requestAuth);

    // 初回成功時に認証済み時のイベントを登録し、コールバック処理も行う
    goog.events.listen(this, goog.ui.Component.EventType.ACTION, function() {
      // セッションがタイムアウトしていたら再接続
      gapi.auth.authorize(
        {'client_id': that.clientId, 'scope': that.scope, 'immediate': true},
        function() {
          if (that.callback) {
            that.callback(that.token);
          }
        }
      )
    });

    this.token = auth.access_token;
    if (this.callback && !opt_noDialog) {
      this.callback(auth.access_token);
    }
  // failure
  } else {
    // button
    goog.events.listen(this, goog.ui.Component.EventType.ACTION, this.requestAuth);
  }
};

/**
 * @param {Function} func
 */
imaya.ui.GoogleDriveSaveButton.prototype.setCallback = function(func) {
  this.callback = func;
};

imaya.ui.GoogleDriveSaveButton.prototype.requestAuth = function() {
  if (!gapi.auth.getToken()) {
    gapi.auth.authorize(
      {'client_id': this.clientId, 'scope': this.scope, 'immediate': false},
      this.handleAuth.bind(this)
    );
  } else {
    this.handleAuth(gapi.auth.getToken());
  }
};
/**
 * @param {string} id
 */
imaya.ui.GoogleDriveSaveButton.prototype.setClientId = function(id) {
  this.clientId = id;
};

/**
 * @param {string} scope
 */
imaya.ui.GoogleDriveSaveButton.prototype.setScope = function(scope) {
  this.scope = scope;
};

/**
 * @return {string}
 */
imaya.ui.GoogleDriveSaveButton.prototype.getToken = function() {
  return this.token;
};

/**
 * @param {string} filename
 * @param {(string|Array.<number>|Uint8Array)} data
 * @param {string=} opt_type
 * @param {Function=} opt_callback
 */
imaya.ui.GoogleDriveSaveButton.prototype.save = function(filename, data, opt_type, opt_callback) {
  if (!this.token) {
    throw new Error('invalid access token');
  }

  var dialog = new imaya.ui.GoogleDriveSaveDialog(
    'Save file to Google Drive',
    function(response) {
      if (response !== null) {
        this.sendRequest(response, data, opt_type, opt_callback);
      }
      dialog.dispose();
    }.bind(this),
    filename
  );
  dialog.setVisible(true);
};

/**
 * @param {(string|Array.<number>|Uint8Array)} data
 * @param {string=} opt_type
 * @param {Function=} opt_callback
 */
imaya.ui.GoogleDriveSaveButton.prototype.sendRequest = function(filename, data, opt_type, opt_callback) {
  /** @type {string} @const */
  var boundary = '-------314159265358979323846';
  /** @type {string} @const */
  var delimiter = "\r\n--" + boundary + "\r\n";
  /** @type {string} @const */
  var close_delim = "\r\n--" + boundary + "--";
  /** @type {string} */
  var contentType = opt_type || 'application/octet-stream';
  /** @type {Object} */
  var metadata = {
    'title': filename,
    'mimeType': contentType
  };
  /** @type {string} */
  var base64Data;
  /** @type {string} */
  var multipartRequestBody;
  // TODO
  var request;

  if (typeof data === 'string') {
    base64Data = goog.global.btoa(data);
  } else {
    base64Data = Base64.btoaArray(data);
  }

  multipartRequestBody = delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + contentType + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n' +
    '\r\n' +
    base64Data +
    close_delim;

  request = gapi.client.request({
    'path': '/upload/drive/v2/files',
    'method': 'POST',
    'params': {'uploadType': 'multipart'},
    'headers': {
      'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
    },
    'body': multipartRequestBody
  });

  request.execute(opt_callback || function() {});
};

});
