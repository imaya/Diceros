goog.provide('Diceros.ToolbarItem.StorageButton');

goog.require('Diceros.ToolbarItem.Base');
goog.require('imaya.ui.GoogleDriveSaveToolbarButton');
goog.require('imaya.ui.GoogleDriveLoadToolbarButton');
goog.require('goog.ui.Menu');
goog.require('goog.ui.ToolbarMenuButton');

goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.CustomButtonRenderer');

goog.require('Zlib.CRC32');

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
      var dataArray = this.stringToByteArray(dataString);

      return this.insertDicerosChunk(dataArray, JSON.stringify(canvasWindow.toObject()));
    }.bind(this), 'image/png', function() {
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
    this.app.refreshFromObject(
      JSON.parse(
        json
      )
    );
  }.bind(this));

  return button;
};

Diceros.ToolbarItem.StorageButton.prototype.refresh = function() {

};

/**
 * @param {Uint8Array} array
 * @param {string} json
 * @returns {Uint8Array}
 */
Diceros.ToolbarItem.StorageButton.prototype.insertDicerosChunk = function(array, json) {
  /** @type {Uint8Array} */
  var newPng = new Uint8Array(array.length + json.length + 12);
  /** @type {Uint8Array} */
  var chunkData = this.stringToByteArray(json);
  /** @type {number} */
  var chunkLength = chunkData.length;
  /** @type {number} */
  var pos = 0;
  /** @type {number} */
  var wpos;
  /** @type {number} */
  var length;
  /** @type {string} */
  var type;
  /** @type {number} */
  var limit = array.length;
  /** @type {number} */
  var crc32;

  if (String.fromCharCode.apply(null, array.subarray(pos, pos += 8)) !==
    String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10)) {
    throw new Error('invalid png singature');
  }

  while (pos < limit) {
    length =
      (array[pos++] << 24) +
      (array[pos++] << 16) +
      (array[pos++] <<  8) +
      (array[pos++] <<  0);

    type = String.fromCharCode.apply(null, array.subarray(pos, pos += 4));

    if (type === 'IDAT') {
      // copy before IDAT
      pos -= 8;
      newPng.set(array.subarray(0, pos), 0);

      // insert Diceros specific chunk
      wpos = pos;
      chunkData = this.stringToByteArray(json);
      chunkLength = chunkData.length;

      // length
      newPng[wpos++] = (chunkLength >> 24) & 0xff;
      newPng[wpos++] = (chunkLength >> 16) & 0xff;
      newPng[wpos++] = (chunkLength >>  8) & 0xff;
      newPng[wpos++] = (chunkLength >>  0) & 0xff;

      // type
      newPng.set(this.stringToByteArray('dvIT'), wpos);
      wpos += 4;

      // data
      newPng.set(chunkData, wpos);
      wpos += chunkLength;

      // crc32
      crc32 = Zlib.CRC32.calc(chunkData);
      newPng[wpos++] = (crc32 >> 24) & 0xff;
      newPng[wpos++] = (crc32 >> 16) & 0xff;
      newPng[wpos++] = (crc32 >>  8) & 0xff;
      newPng[wpos++] = (crc32 >>  0) & 0xff;

      // copy IDAT, after IDAT
      newPng.set(array.subarray(pos), wpos);

      return newPng;
    } else {
      pos += length + 4;
    }
  }

  throw new Error('IDAT chunk not found');
};


/**
 * @param {Uint8Array} array
 * @returns {string}
 */
Diceros.ToolbarItem.StorageButton.prototype.extractJsonFromPNG = function(array) {
  /** @type {number} */
  var pos = 0;
  /** @type {number} */
  var length;
  /** @type {string} */
  var type;
  /** @type {number} */
  var limit = array.length;

  if (String.fromCharCode.apply(null, array.subarray(pos, pos += 8)) !==
    String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10)) {
    throw new Error('invalid png singature');
  }

  while (pos < limit) {
    length =
      (array[pos++] << 24) +
        (array[pos++] << 16) +
        (array[pos++] <<  8) +
        (array[pos++] <<  0);

    type = String.fromCharCode.apply(null, array.subarray(pos, pos += 4));

    if (type !== 'dvIT') {
      pos += length + 4;
    } else {
      return this.byteArrayToString(array.subarray(pos, pos += length));
    }
  }

  throw new Error('json not found');
};

/**
 * @param {string} str
 * @returns {Uint8Array}
 */
Diceros.ToolbarItem.StorageButton.prototype.stringToByteArray = function(str) {
  /** @type {Uint8Array} */
  var array = new Uint8Array(str.length);
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  for (i = 0, il = str.length; i < il; ++i) {
    array[i] = str.charCodeAt(i);
  }

  return array;
};

/**
 * @param {Uint8Array} byteArray
 * @returns {string}
 */
Diceros.ToolbarItem.StorageButton.prototype.byteArrayToString = function(byteArray) {
  /** @type {string} */
  var str = "";
  /** @type {number} */
  var pos = 0;
  /** @type {number} */
  var limit = byteArray.length;

  while (pos < limit) {
    str += String.fromCharCode.apply(null, byteArray.subarray(pos, pos += 0x8000));
  }

  return str;
};

});