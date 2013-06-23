goog.provide('Diceros.ToolbarItem.StorageButton');

goog.require('Diceros.ToolbarItem.Base');
goog.require('imaya.ui.GoogleDriveSaveToolbarButton');
goog.require('imaya.ui.GoogleDriveLoadToolbarButton');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @extends {Diceros.ToolbarItem.Base}
 */
Diceros.ToolbarItem.StorageButton = function(app) {
  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {goog.ui.Toolbar} */
  this.toolbar = app.toolbar;
};

Diceros.ToolbarItem.StorageButton.prototype.decorate = function() {
  this.appendSaveButton_();
  this.appendLoadButton_();
};

/**
 * @define {string}
 */
Diceros.ToolbarItem.StorageButton.ClientId =
  '663668731705.apps.googleusercontent.com';

/**
 * @define {string}
 */
Diceros.ToolbarItem.StorageButton.ScopeUrl =
  'https://www.googleapis.com/auth/drive';

/**
 * @private
 */
Diceros.ToolbarItem.StorageButton.prototype.appendSaveButton_ = function() {
  /** @type {Diceros.Application} */
  var app = this.app;
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {imaya.ui.GoogleDriveSaveToolbarButton} */
  var button = new imaya.ui.GoogleDriveSaveToolbarButton('Save');
  /** @type {Diceros.CanvasWindow} */
  var canvasWindow = app.getCurrentCanvasWindow();

  button.setClientId(Diceros.ToolbarItem.StorageButton.ClientId);
  button.setScope(Diceros.ToolbarItem.StorageButton.ScopeUrl);

  // event handler
  button.setCallback(function(token) {
    button.save(Date.now() + '.png', function() {
      /** @type {HTMLCanvasElement} */
      var canvas = canvasWindow.createMergedCanvas();
      /** @type {string} */
      var dataURL = canvas.toDataURL();
      /** @type {Array.<string>} */
      var base64 = dataURL.split(',', 2);
      /** @type {string} */
      var dataString = window.atob(base64[1]);
      /** @type {Uint8Array} */
      var dataArray = app.stringToByteArray(dataString);

      return app.insertDicerosChunk(dataArray, JSON.stringify(canvasWindow.toObject()));
    }, 'image/png', function() {
      // done
    });
  });

  toolbar.addChild(button, true);
};

/**
 * @private
 */
Diceros.ToolbarItem.StorageButton.prototype.appendLoadButton_ = function() {
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {imaya.ui.GoogleDriveLoadToolbarButton} */
  var button = new imaya.ui.GoogleDriveLoadToolbarButton('Load');

  button.setClientId(Diceros.ToolbarItem.StorageButton.ClientId);
  button.setScope(Diceros.ToolbarItem.StorageButton.ScopeUrl);
  button.setResponseType('arraybuffer');

  // event handler
  button.setCallback(function(data) {
    var json = this.extractJsonFromPNG(new Uint8Array(data));

    // load done
    this.refreshFromObject(
      JSON.parse(
        json
      )
    );
  }.bind(this));

  toolbar.addChild(button, true);
};

Diceros.ToolbarItem.StorageButton.prototype.refresh = function() {

};

});