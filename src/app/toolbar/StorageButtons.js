goog.provide('Diceros.ToolbarItem.StorageButton');

goog.require('Diceros.ToolbarItem.Base');
goog.require('imaya.ui.GoogleDriveSaveToolbarButton');
goog.require('imaya.ui.GoogleDriveLoadToolbarButton');
goog.require('goog.ui.Menu');
goog.require('goog.ui.ToolbarMenuButton');

goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.CustomButtonRenderer');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @implements {Diceros.ToolbarItem.Base}
 */
Diceros.ToolbarItem.StorageButton = function(app) {
  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {goog.ui.Toolbar} */
  this.toolbar = app.toolbar;
  /** @type {goog.ui.Menu} */
  this.menu;
  /** @type {goog.ui.MenuItem} */
  this.save;
  /** @type {goog.ui.MenuItem} */
  this.load;
};

Diceros.ToolbarItem.StorageButton.prototype.decorate = function() {
  /** @type {goog.ui.Menu} */
  var menu = new goog.ui.Menu();
  /** @type {goog.ui.ToolbarMenuButton} */
  var menuButton = new goog.ui.ToolbarMenuButton('ストレージ', menu);
  /** @type {goog.ui.MenuItem} */
  var saveMenuItem;
  /** @type {imaya.ui.GoogleDriveSaveButton} */
  var saveButton;
  /** @type {goog.ui.MenuItem} */
  var loadMenuItem;
  /** @type {imaya.ui.GoogleDriveLoadButton} */
  var loadButton;

  // save
  saveMenuItem = this.save = new goog.ui.MenuItem('');
  saveButton = this.createSaveButton_();
  saveMenuItem.addChild(saveButton, true);
  menu.addChild(saveMenuItem, true);

  // load
  loadMenuItem = this.load = new goog.ui.MenuItem('');
  loadButton = this.createLoadButton_();
  loadMenuItem.addChild(loadButton, true);
  menu.addChild(loadMenuItem, true);

  // tooltip
  menuButton.setTooltip('ストレージ');

  this.toolbar.addChild(menuButton, true);
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
 * @returns {imaya.ui.GoogleDriveSaveButton}
 * @private
 */
Diceros.ToolbarItem.StorageButton.prototype.createSaveButton_ = function() {
  /** @type {Diceros.Application} */
  var app = this.app;
  /** @type {imaya.ui.GoogleDriveSaveButton} */
  var button = new imaya.ui.GoogleDriveSaveButton('Save to Google Drive');
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

  return button;
};

/**
 * @returns {imaya.ui.GoogleDriveLoadButton}
 * @private
 */
Diceros.ToolbarItem.StorageButton.prototype.createLoadButton_ = function() {
  /** @type {imaya.ui.GoogleDriveLoadButton} */
  var button = new imaya.ui.GoogleDriveLoadButton('Load from Google Drive');

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

  return button;
};

Diceros.ToolbarItem.StorageButton.prototype.refresh = function() {

};

});