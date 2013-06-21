/**
 * Paint tool "Diceros"
 * @author IMAYA Yuta
 */

/**
 * @fileoverview お絵描きソフトウェア.
 */

goog.provide('Diceros.Application');

goog.require('Diceros.CanvasWindow');
goog.require('Diceros.LayerWindow');
goog.require('Diceros.SizerWindow');
goog.require('Diceros.WindowType');
goog.require('Diceros.util');

goog.require('imaya.ui.SplitPane');
goog.require('imaya.ui.GoogleDriveLoadToolbarButton');
goog.require('imaya.ui.GoogleDriveSaveToolbarButton');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math.Size');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.ui.SplitPane');
goog.require('goog.ui.ToolbarToggleButton');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.SelectionModel');

goog.require('imaya.ui.ToolbarHSVColorPickerMenuButton');
goog.require('goog.ui.ToolbarColorMenuButton');
goog.require('goog.ui.ToolbarColorMenuButtonRenderer');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.Option');
goog.require('goog.ui.ToolbarSelect');

goog.require('Zlib.CRC32');

goog.scope(function() {

/**
 * お絵描きアプリケーションクラス
 * @param {Object=} opt_config アプリケーション初期化設定
 * @constructor
 */
Diceros.Application = function(opt_config) {
  if (!opt_config) {
    opt_config = {};
  }

  /**
   * 描画対象エレメント
   * @type {!Element}
   */
  this.target;
  /**
   * CSSプレフィックス
   * @type {string}
   */
  this.cssClassPrefix = 'diceros-';

  // XXX: fixed size
  /**
   * 横幅
   * @type {number}
   */
  this.width = opt_config.width || 1024;
  /**
   * 縦幅
   * @type {number}
   */
  this.height = opt_config.height || 768;
  /**
   * ウィンドウリスト
   * @type {Array.<Diceros.Window>}
   */
  this.windows = [];
  /**
   * 現在のキャンバスウィンドウの index
   * @type {number}
   */
  this.currentCanvasWindow;
  /**
   * 現在のレイヤーウィンドウの index
   * @type {number}
   */
  this.layerWindow;
  /**
   * 現在のペンサイズ調整ウィンドウの index
   * @type {number}
   */
  this.sizerWindow;
  /**
   * レイアウト用のオブジェクト
   * @type {Object}
   */
  this.layoutPanels = {};
  /**
   * @type {goog.ui.Toolbar}
   */
  this.toolbar;
  /** @type {Object} */
  this.save;
};

/**
 * アプリケーションの描画
 * @param {!Element} target 描画対象となる HTML Element.
 */
Diceros.Application.prototype.render = function(target) {
  this.target = target;
  this.layout();
  this.setEvent();
};

/**
 * 各コンポーネントの配置
 */
Diceros.Application.prototype.layout = function() {
  var layer, canvas, sizer,
      height = this.height - Diceros.util.scrollBarWidth(),
      layout = this.layoutPanels;
  /** @type {goog.ui.SplitPane} */
  var baseSplitPane;
  /** @type {goog.ui.SplitPane} */
  var toolSplitPane;
  /** @type {Object} */
  var obj;

  // ウィンドウの生成
  layer = this.addWindow(Diceros.WindowType.LAYER_WINDOW);
  if (!this.save) {
    canvas = this.addWindow(Diceros.WindowType.CANVAS_WINDOW);
  } else {
    // データからの読み込みの場合
    obj = this.save;
    canvas = Diceros.CanvasWindow.fromObject(
      this,
      this.windows.length,
      obj
    );
    this.currentCanvasWindow = this.windows.length;
    this.selectCanvasWindow(this.windows.length);
    this.windows.push(canvas);
  }
  sizer = this.addWindow(Diceros.WindowType.SIZER_WINDOW);

  // 配置

  // ツールバー
  this.createToolbar();

  // サイズとレイヤーウィンドウをツールパネルに
  toolSplitPane = layout.toolSplitPane = new goog.ui.SplitPane(
    sizer, layer,
    goog.ui.SplitPane.Orientation.VERTICAL
  );
  toolSplitPane.setInitialSize(150);
  toolSplitPane.setContinuousResize(true);
  toolSplitPane.resize = function(size) {
    toolSplitPane.setSize(size);
  };

  // ツールパネルとキャンバスウィンドウの結合
  baseSplitPane = layout.baseSplitPane = new imaya.ui.SplitPane(
    canvas, toolSplitPane,
    imaya.ui.SplitPane.Orientation.HORIZONTAL
  );
  baseSplitPane.setInitialSize(this.width - 150);
  baseSplitPane.setContinuousResize(true);
  baseSplitPane.setSnapDirection(false);
  baseSplitPane.setHandleSize(30);

  // 適用
  baseSplitPane.render(this.target);
  baseSplitPane.setSize(new goog.math.Size(this.width, this.height - goog.style.getBorderBoxSize(this.toolbar.getElement()).height));
  toolSplitPane.setSize(new goog.math.Size(toolSplitPane.getFirstComponentSize().width, height));
};

/**
 * ウィンドウの追加
 * @param {Diceros.WindowType} type 追加するウィンドウの型
 * @return {Diceros.Window} 追加したウィンドウ.
 */
Diceros.Application.prototype.addWindow = function(type) {
  /** @type {Diceros.Window} */
  var newWindow;
  /** @type {number} */
  var currentSize = this.windows.length;

  // 事前処理
  switch (type) {
  case Diceros.WindowType.CANVAS_WINDOW:
    newWindow = new Diceros.CanvasWindow(
      this, currentSize, this.width, this.height
    );
    this.currentCanvasWindow = currentSize;
    this.selectCanvasWindow(currentSize);
    break;
  case Diceros.WindowType.LAYER_WINDOW:
    // singleton
    if (typeof this.layerWindow !== 'number') {
      newWindow = new Diceros.LayerWindow(this, currentSize);
      this.layerWindow = currentSize;
    } else {
      return this.windows[this.layerWindow];
    }
    break;
  case Diceros.WindowType.SIZER_WINDOW:
    // singleton
    if (typeof this.sizerWindow !== 'number') {
      newWindow = new Diceros.SizerWindow(this, currentSize);
      this.sizerWindow = currentSize;
    } else {
      return this.windows[this.sizerWindow];
    }
    break;
  default:
    throw 'unsupported window class';
  }

  this.windows.push(newWindow);

  return newWindow;
};

/**
 * キャンバスウィンドウの選択
 * @param {number} index 選択するキャンバスウィンドウの index.
 */
Diceros.Application.prototype.selectCanvasWindow = function(index) {
  this.currentCanvasWindow = index;
};

/**
 * 現在のキャンバスウィンドウの取得
 * @return {Diceros.CanvasWindow} 現在のキャンバスウィンドウ.
 */
Diceros.Application.prototype.getCurrentCanvasWindow = function() {
  return /** @type {Diceros.CanvasWindow} */(this.windows[this.currentCanvasWindow]);
};

/**
 * 現在のサイズ調整ウィンドウの取得
 * @return {Diceros.SizerWindow} 現在のサイズ調整ウィンドウ.
 */
Diceros.Application.prototype.getCurrentSizerWindow = function() {
  return /** @type {Diceros.SizerWindow} */(this.windows[this.sizerWindow]);
};

/**
 * キャンバスの作成
 * @param {number} width 作成するキャンバスの横幅.
 * @param {number} height 作成するキャンバスの縦幅.
 * @return {HTMLCanvasElement} 作成したキャンバス.
 */
Diceros.Application.prototype.makeCanvas = function(width, height) {
  /** @type {HTMLCanvasElement} */
  var canvas =
    /** @type {HTMLCanvasElement} */
    (document.createElement('canvas'));

  canvas.width = width;
  canvas.height = height;

  var ctx = canvas.getContext('2d');
  ctx.getImageData(0, 0, 1, 1);
  ctx.transform(1,0,0,1,0,0);

  return canvas;
};

/**
 * 各種イベントの設定
 */
Diceros.Application.prototype.setEvent = function() {
  /** * @type {Diceros.Application} */
  var app = this;

  // キーボードイベント
  goog.events.listen(
    this.target, goog.events.EventType.KEYDOWN, function(event) {
      var canvasWindow = app.getCurrentCanvasWindow(),
          layer = canvasWindow.getCurrentLayer();

      event.preventDefault();

      if (!layer) {
        return;
      }

      layer.event(event);
    }
  );
  goog.events.listen(
    this.target, goog.events.EventType.KEYUP, function(event) {
      var canvasWindow = app.getCurrentCanvasWindow(),
          layer = canvasWindow.getCurrentLayer();

      event.preventDefault();

      if (!layer) {
        return;
      }

      layer.event(event);
    }
  );
};
/**
 * ツールバーの作成
 */
Diceros.Application.prototype.createToolbar = function() {
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar = new goog.ui.Toolbar();

  // colorpicker
  this.appendColorPickerButton(toolbar);

  // separator
  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  // mode switch button
  this.appendEditModeButton(toolbar);

  // separator
  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  // line optimization
  this.appendOptimizationButton(toolbar);

  // save/load
  this.appendSaveButton_(toolbar);
  this.appendLoadButton_(toolbar);

  // separator
  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  // capture event target
  this.appendCaptureButton(toolbar);

  // ignore touch
  this.getCurrentCanvasWindow().setIgnoreTouch(false);
  this.appendIgnoreTouchButton_(toolbar);

  // separator
  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  this.appendPointerModeButton_(toolbar);

  // rendering
  this.refreshToolbar();
  toolbar.render(this.target);
};

/**
 * @param {goog.ui.Toolbar} toolbar
 */
Diceros.Application.prototype.appendColorPickerButton = function(toolbar) {
  toolbar.colorButton = new imaya.ui.ToolbarHSVColorPickerMenuButton('Color');
  toolbar.colorButton.setSelectedColor('red');
  toolbar.addChild(toolbar.colorButton, true);
};

/**
 * @param {goog.ui.Toolbar} toolbar
 */
Diceros.Application.prototype.appendEditModeButton = function(toolbar) {
  /** @type {Diceros.Application} */
  var app = this;
  /** @type {goog.ui.SelectionModel} */
  var selectionModel = new goog.ui.SelectionModel();

  toolbar.modeButtons = {
    '描画': {
      value: Diceros.VectorLayer.Mode.DEFAULT,
      button: void 0
    },
    '編集': {
      value: Diceros.VectorLayer.Mode.EDIT,
      button: void 0
    },
    '削除': {
      value: Diceros.VectorLayer.Mode.DELETE,
      button: void 0
    },
    '太さ変更': {
      value: Diceros.VectorLayer.Mode.WIDTH_UPDATE,
      button: void 0
    }
  };

  selectionModel.setSelectionHandler(function(button, select) {
    button && button.setChecked(select);
  });

  goog.object.forEach(
    toolbar.modeButtons,
    function(obj, caption) {
      var button = app.toolbar.modeButtons[caption].button =
        new goog.ui.ToolbarToggleButton(caption);

      button.setValue(obj.value);
      button.setAutoStates(goog.ui.Component.State.CHECKED, false);
      selectionModel.addItem(button);
      toolbar.addChild(button, true);
      goog.events.listen(
        button, goog.ui.Component.EventType.ACTION, onClickSelectButton);
    }
  );

  function onClickSelectButton(e) {
    var canvasWindow = app.windows[app.currentCanvasWindow];
    var currentLayer = canvasWindow.layers[canvasWindow.currentLayer];

    selectionModel.setSelectedItem(e.target);

    if (currentLayer instanceof Diceros.VectorLayer) {
      currentLayer.baseMode = currentLayer.mode = e.target.getValue();
      currentLayer.switchMode(currentLayer.mode);
    }

    app.refreshToolbar();
  }
};

/**
 * @param {goog.ui.Toolbar} toolbar
 */
Diceros.Application.prototype.appendOptimizationButton = function(toolbar) {
  var optimizationMenu = new goog.ui.Menu();
  /** @type {number} */
  var i;

  for (i = 0; i <= 10; ++i) {
    optimizationMenu.addChild(new goog.ui.Option(""+i), true);
  }

  var selector = new goog.ui.ToolbarSelect('線の補正', optimizationMenu);

  selector.setTooltip('線の補正');
  toolbar.addChild(selector, true);
  toolbar.lineOptimization = selector;

  goog.dom.classes.add(selector.getElement(), 'goog-toolbar-select');
};

/**
 * @param {goog.ui.Toolbar} toolbar
 */
Diceros.Application.prototype.appendCaptureButton = function(toolbar) {
  /** @type {Diceros.Application} */
  var app = this;
  /** @type {goog.ui.SelectionModel} */
  var selectionModel = new goog.ui.SelectionModel();

  toolbar.captureButtons = {
    'Mouse': {
      value: Diceros.CanvasWindow.CaptureEventType.MOUSE,
      button: void 0
    },
    'Touch': {
      value: Diceros.CanvasWindow.CaptureEventType.TOUCH,
      button: void 0
    },
    'Pen(PointerEvents)': {
      value: Diceros.CanvasWindow.CaptureEventType.POINTER,
      button: void 0
    }
  };

  selectionModel.setSelectionHandler(function(button, select) {
    button && button.setChecked(select);
  });

  goog.object.forEach(
    toolbar.captureButtons,
    function(obj, caption) {
      var button = toolbar.captureButtons[caption].button =
        new goog.ui.ToolbarToggleButton(caption);

      button.setValue(obj.value);
      button.setAutoStates(goog.ui.Component.State.CHECKED, false);
      selectionModel.addItem(button);
      toolbar.addChild(button, true);
      goog.events.listen(
        button, goog.ui.Component.EventType.ACTION, onClickSelectButton);
    }
  );

  function onClickSelectButton(e) {
    var canvasWindow = app.windows[app.currentCanvasWindow];

    selectionModel.setSelectedItem(e.target);
    canvasWindow.setCaptureEventType(e.target.getValue());
    app.refreshToolbar();
  }
};

Diceros.Application.prototype.refreshToolbar = function() {
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {Array.<string>} */
  var keys = Object.keys(toolbar.modeButtons);
  /** @type {string} */
  var key;
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;
  /** @type {goog.ui.ToolbarToggleButton} */
  var button;
  /** @type {Diceros.CanvasWindow} */
  var currentCanvasWindow = this.getCurrentCanvasWindow();
  /** @type {Diceros.Layer} */
  var currentLayer = currentCanvasWindow.getCurrentLayer();
  /** @type {boolean} */
  var isVector = currentLayer instanceof Diceros.VectorLayer;

  // mode buttons
  for (i = 0, il = keys.length; i < il; ++i) {
    key = keys[i];
    button = toolbar.modeButtons[key].button;

    if (isVector) {
      button.setEnabled(true);
      button.setChecked(
        currentLayer.mode === button.getValue()
      );
    } else {
      button.setEnabled(false);
    }
  }

  if (currentCanvasWindow.getCaptureEventType() !== void 0) {
    goog.object.forEach(toolbar.captureButtons, function(value, key) {
      if (value.value === currentCanvasWindow.getCaptureEventType()) {
        value.button.setChecked(true);
      } else {
        value.button.setChecked(false);
      }
    });
  }

  if (currentCanvasWindow.pointerMode !== void 0) {
    goog.object.forEach(toolbar.capturePointerModeButtons, function(value, key) {
      console.log(value.value, currentCanvasWindow.pointerMode);
      if (value.value === currentCanvasWindow.pointerMode) {
        value.button.setChecked(true);
      } else {
        value.button.setChecked(false);
      }
    });
  }
};

/**
 * @param {goog.ui.Toolbar} toolbar
 * @private
 */
Diceros.Application.prototype.appendSaveButton_ = function(toolbar) {
  /** @type {Diceros.Application} */
  var app = this;
  /** @type {imaya.ui.GoogleDriveSaveToolbarButton} */
  var button = new imaya.ui.GoogleDriveSaveToolbarButton('Save');
  /** @type {Diceros.CanvasWindow} */
  var cw = this.getCurrentCanvasWindow();

  button.setClientId('663668731705.apps.googleusercontent.com');
  button.setScope('https://www.googleapis.com/auth/drive');

  // event handler
  button.setCallback(function(token) {
    button.save(Date.now() + '.png', function() {
      /** @type {HTMLCanvasElement} */
      var canvas = cw.createMergedCanvas();
      /** @type {string} */
      var dataURL = canvas.toDataURL();
      /** @type {Array.<string>} */
      var base64 = dataURL.split(',', 2);
      /** @type {string} */
      var dataString = window.atob(base64[1]);
      /** @type {Uint8Array} */
      var dataArray = app.stringToByteArray(dataString);
      /** @type {Uint8Array} */
      var inserted = app.insertDicerosChunk(dataArray, JSON.stringify(cw.toObject()));

      return inserted;
    }, 'image/png', function() {
      // done
    });
  });

  toolbar.addChild(button, true);
};

/**
 * @param {goog.ui.Toolbar} toolbar
 * @private
 */
Diceros.Application.prototype.appendLoadButton_ = function(toolbar) {
  /** @type {imaya.ui.GoogleDriveLoadToolbarButton} */
  var button = new imaya.ui.GoogleDriveLoadToolbarButton('Load');

  button.setClientId('663668731705.apps.googleusercontent.com');
  button.setScope('https://www.googleapis.com/auth/drive');
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

/**
 * @param {goog.ui.Toolbar} toolbar
 * @private
 */
Diceros.Application.prototype.appendIgnoreTouchButton_ = function(toolbar) {
  /** @type {Diceros.Application} */
  var app = this;
  /** @type {goog.ui.ToolbarToggleButton} */
  var button = new goog.ui.ToolbarToggleButton('Ignore Touch (PointerEvents)');

  // event handler
  goog.events.listen(button, goog.ui.Component.EventType.ACTION, function(ev) {
    /** @type {boolean} */
    var disable = ev.target.isChecked();

    app.getCurrentCanvasWindow().setIgnoreTouch(disable);
  });

  toolbar.addChild(button, true);
};


/**
 * @param {goog.ui.Toolbar} toolbar
 */
Diceros.Application.prototype.appendPointerModeButton_ = function(toolbar) {
  /** @type {Diceros.Application} */
  var app = this;
  /** @type {goog.ui.SelectionModel} */
  var selectionModel = new goog.ui.SelectionModel();

  toolbar.capturePointerModeButtons = {
    'Pen': {
      value: Diceros.CanvasWindow.PointerMode.Draw,
      class: 'icon-pen',
      button: void 0
    },
    'Move': {
      value: Diceros.CanvasWindow.PointerMode.Move,
      class: 'icon-hand',
      button: void 0
    }
  };

  selectionModel.setSelectionHandler(function(button, select) {
    button && button.setChecked(select);
  });

  goog.object.forEach(
    toolbar.capturePointerModeButtons,
    function(obj, caption) {
      /** @type {!HTMLElement} */
      var value = goog.dom.createDom('span');
      /** @type {goog.ui.ToolbarToggleButton} */
      var button = toolbar.capturePointerModeButtons[caption].button =
        new goog.ui.ToolbarToggleButton(caption);

      goog.dom.classes.add(value, obj.class);

      button.setContent(value);
      button.setValue(obj.value);
      button.setAutoStates(goog.ui.Component.State.CHECKED, false);
      selectionModel.addItem(button);
      toolbar.addChild(button, true);
      goog.events.listen(
        button, goog.ui.Component.EventType.ACTION, onClickSelectButton);
    }
  );

  function onClickSelectButton(e) {
    var canvasWindow = app.windows[app.currentCanvasWindow];

    selectionModel.setSelectedItem(e.target);
    canvasWindow.setPointerMode(e.target.getValue());
    app.refreshToolbar();
  }
};

Diceros.Application.prototype.refreshFromObject = function(obj) {
  /** @type {number} */
  var width = this.width;
  /** @type {number} */
  var height = this.height;
  /** @type {!Element} */
  var target = this.target;

  if (this.target) {
    this.target.innerHTML = '';
  }

  // TODO
  Object.keys(this).forEach(function(key) {
    this[key] = null;
  }.bind(this));

  this.save = obj;

  Diceros.Application.call(this, {'width': width, 'height': height});
  this.render(target);
};

/**
 * @param {Uint8Array} array
 * @param {string} json
 * @returns {Uint8Array}
 */
Diceros.Application.prototype.insertDicerosChunk = function(array, json) {
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
Diceros.Application.prototype.extractJsonFromPNG = function(array) {
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
Diceros.Application.prototype.stringToByteArray = function(str) {
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
Diceros.Application.prototype.byteArrayToString = function(byteArray) {
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

// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
