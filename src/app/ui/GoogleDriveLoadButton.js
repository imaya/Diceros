goog.provide('imaya.ui.GoogleDriveLoadButton');

//goog.require('Base64');
goog.require('goog.ui.Button');
goog.require('imaya.ui.GoogleLoader');
goog.require('imaya.ui.GooglePickerAPI');

goog.scope(function() {

/**
 * @param content
 * @param {goog.ui.ButtonRenderer=} opt_renderer
 * @param {goog.dom.DomHelper=} opt_domHelper
 * @constructor
 * @extends {goog.ui.Button}
 */
imaya.ui.GoogleDriveLoadButton = function(content, opt_renderer, opt_domHelper) {
  goog.base(this, content, opt_renderer, opt_domHelper);

  /** @type {string} */
  this.clientId;
  /** @type {string} */
  this.responseType;
  /** @type {HTMLImageElement} */
  this.icon;
};
goog.inherits(imaya.ui.GoogleDriveLoadButton, goog.ui.Button);

/** @enum {string} */
imaya.ui.GoogleDriveLoadButton.Icon = {
  Loading: 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==',
  Drive: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAvVBMVEW/nzXfsDK3lzD4xz8GnlxPd6/6zEX6ykAGnlspcOgobOMJpV8HfUkefkP7zEQJn1wGmVpVlUIHnVsSdYoFmlr4xz7Ppzj2ykQYhKAInlsudO0Aj1DzwzgAAAAHnFr8zkf7y0L4xjw1fPMJoV0KpV/+0Uo5gPcvd/AhVa8Hj1LxwTokYs0LqGFRf7+ykS0+hPrkuj0pcOgpY8OPmDsaaZ0nZMcGe0gvdzwNi2+hnDYaWqAqcOjMozHQrDpLd7gaybt4AAAAHnRSTlPv34C/QN+fMO+vQN9w7++vgN9w75/fEIggz+8QQADxP5zrAAAAnUlEQVR4Xm3P5Q7CUAwFYGTAcJ8wrspcUJf3fyzKBiFZ1n/9cpqT1lBpqsGZhoyx5R8mwZUxSs0fWDo+h5SQkfGFsRCnPVGKtAvQhJTBEEDRTg62jGM8MCFBmx+YCYA+MmrPDWVrAB0upIZQI03TRx3AFkIc/B13kyR5tQA0jC/+kWeZy71tDwAt8C3yCujmLc48unvchX1lVT1Xhjcw0B8Wq0q0eAAAAABJRU5ErkJggg=='
};

imaya.ui.GoogleDriveLoadButton.prototype.createDom = function() {
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
      that.setRequestState(true);
      gapi.auth.authorize(
        {'client_id': that.clientId, 'scope': that.scope, 'immediate': true},
        that.showDialog.bind(this)
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

imaya.ui.GoogleDriveLoadButton.prototype.setRequestState = function(request) {
  this.setEnabled(!request);
  this.icon.src = request ? imaya.ui.GoogleDriveLoadButton.Icon.Loading : imaya.ui.GoogleDriveLoadButton.Icon.Drive;
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
  /** @type {imaya.ui.GoogleDriveLoadButton} */
  var button = this;

  if (data[google.picker.Response.ACTION] !== google.picker.Action.PICKED) {
    button.setRequestState(false);
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
      button.setRequestState(false);
    }, false);
    dlxhr.send();
  }, false);
  xhr.send();
};


});
