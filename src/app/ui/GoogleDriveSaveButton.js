goog.provide('imaya.ui.GoogleDriveSaveButton');

goog.require('Base64');
goog.require('goog.ui.Button');
goog.require('imaya.ui.GooglePickerAPI');
goog.require('imaya.ui.GoogleDriveSaveDialog');

goog.scope(function() {

/**
 * @param content
 * @param {goog.ui.ButtonRenderer=} opt_renderer
 * @param {goog.dom.DomHelper=} opt_domHelper
 * @constructor
 * @extends {goog.ui.Button}
 */
imaya.ui.GoogleDriveSaveButton = function(content, opt_renderer, opt_domHelper) {
  goog.base(this, content, opt_renderer, opt_domHelper);

  /** @type {HTMLImageElement} */
  this.icon;
  /** @type {string} */
  this.clientId;
};
goog.inherits(imaya.ui.GoogleDriveSaveButton, goog.ui.Button);

/** @enum {string} */
imaya.ui.GoogleDriveSaveButton.Icon = {
  Loading: 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==',
  Drive: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAvVBMVEW/nzXfsDK3lzD4xz8GnlxPd6/6zEX6ykAGnlspcOgobOMJpV8HfUkefkP7zEQJn1wGmVpVlUIHnVsSdYoFmlr4xz7Ppzj2ykQYhKAInlsudO0Aj1DzwzgAAAAHnFr8zkf7y0L4xjw1fPMJoV0KpV/+0Uo5gPcvd/AhVa8Hj1LxwTokYs0LqGFRf7+ykS0+hPrkuj0pcOgpY8OPmDsaaZ0nZMcGe0gvdzwNi2+hnDYaWqAqcOjMozHQrDpLd7gaybt4AAAAHnRSTlPv34C/QN+fMO+vQN9w7++vgN9w75/fEIggz+8QQADxP5zrAAAAnUlEQVR4Xm3P5Q7CUAwFYGTAcJ8wrspcUJf3fyzKBiFZ1n/9cpqT1lBpqsGZhoyx5R8mwZUxSs0fWDo+h5SQkfGFsRCnPVGKtAvQhJTBEEDRTg62jGM8MCFBmx+YCYA+MmrPDWVrAB0upIZQI03TRx3AFkIc/B13kyR5tQA0jC/+kWeZy71tDwAt8C3yCujmLc48unvchX1lVT1Xhjcw0B8Wq0q0eAAAAABJRU5ErkJggg=='
};

imaya.ui.GoogleDriveSaveButton.prototype.createDom = function() {
  goog.base(this, 'createDom');

  /** @type {HTMLImageElement} */
  var icon = this.icon = new Image();
  icon.width = icon.height = 12;
  icon.style.paddingRight = "0.25em";
  icon.style.paddingTop = "2px";
  this.setRequestState(false);
  this.getContentElement().insertBefore(icon, this.getContentElement().firstChild);

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
      that.setRequestState(true);
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

imaya.ui.GoogleDriveSaveButton.prototype.setRequestState = function(request) {
  this.setEnabled(!request);
  this.icon.src = request ? imaya.ui.GoogleDriveSaveButton.Icon.Loading : imaya.ui.GoogleDriveSaveButton.Icon.Drive;
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
 * @param {(string|Array.<number>|Uint8Array|function():(string|Array.<number>|Uint8Array))} data
 * @param {string=} opt_type
 * @param {Function=} opt_callback
 */
imaya.ui.GoogleDriveSaveButton.prototype.save = function(filename, data, opt_type, opt_callback) {
  /** @type {imaya.ui.GoogleDriveSaveButton} */
  var button = this;

  if (!this.token) {
    throw new Error('invalid access token');
  }

  var dialog = new imaya.ui.GoogleDriveSaveDialog(
    'Save file to Google Drive',
    function(response) {
      if (response !== null) {
        if (typeof data === 'function') {
          data = data();
        }
        this.sendRequest(response, data, opt_type, opt_callback);
      }
      dialog.dispose();
    }.bind(this),
    filename
  );
  dialog.setVisible(true);
  button.setRequestState(false);
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
