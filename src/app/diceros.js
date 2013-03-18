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

goog.require('goog.ui.ToolbarColorMenuButton');
goog.require('goog.ui.ToolbarColorMenuButtonRenderer');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.Option');
goog.require('goog.ui.ToolbarSelect');

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
  layout.toolSplitPane = new goog.ui.SplitPane(
    sizer, layer,
    goog.ui.SplitPane.Orientation.VERTICAL
  );
  layout.toolSplitPane.setInitialSize(150);
  layout.toolSplitPane.setContinuousResize(true);
  layout.toolSplitPane.resize = function(size) {
    layout.toolSplitPane.setSize(size.width, size.height);
  };

  // ツールパネルとキャンバスウィンドウの結合
  layout.baseSplitPane = new imaya.ui.SplitPane(
    canvas, layout.toolSplitPane,
    imaya.ui.SplitPane.Orientation.HORIZONTAL
  );
  layout.baseSplitPane.setInitialSize(this.width - 150);
  layout.baseSplitPane.setContinuousResize(true);
  layout.baseSplitPane.setSnapDirection(false);
  layout.baseSplitPane.setHandleSize(30);

  // 適用
  layout.baseSplitPane.render(this.target);
  layout.baseSplitPane.setSize(new goog.math.Size(this.width, this.height - goog.style.getBorderBoxSize(this.toolbar.getElement()).height));
  layout.toolSplitPane.setSize(new goog.math.Size(layout.toolSplitPane.getFirstComponentSize().width, height));
};

/**
 * ウィンドウの追加
 * @param {Diceros.WindowType} type 追加するウィンドウの型
 * @return {Diceros.Window} 追加したウィンドウ.
 */
Diceros.Application.prototype.addWindow = function(type) {
  var newWindow, currentSize = this.windows.length,
      initOption = {x: null, y: null, width: null, height: null};

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

  return canvas;
};

/**
 * 各種イベントの設定
 */
Diceros.Application.prototype.setEvent = function() {
  var canvas, _this = this;

  // キーボードイベント
  goog.events.listen(
    document, goog.events.EventType.KEYDOWN, function(event) {
      var canvasWindow = _this.getCurrentCanvasWindow(),
          layer = canvasWindow.getCurrentLayer();

      if (!layer) {
        return;
      }

      layer.event(event);
    }
  );
  goog.events.listen(
    document, goog.events.EventType.KEYUP, function(event) {
      var canvasWindow = _this.getCurrentCanvasWindow(),
          layer = canvasWindow.getCurrentLayer();

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
  /** @type {goog.ui.SelectionModel} */
  var selectionModel = new goog.ui.SelectionModel();
  /** @type {Diceros.Application} */
  var that = this;
  /** @type {number} */
  var i;

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
    }
  };

  // colorpicker
  toolbar.colorButton = new goog.ui.ToolbarColorMenuButton('Color');
  toolbar.colorButton.setSelectedColor('black');
  toolbar.addChild(toolbar.colorButton, true);

  // separator
  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  // mode switch button
  selectionModel.setSelectionHandler(function(button, select) {
    button && button.setChecked(select);
  });
  goog.object.forEach(
    this.toolbar.modeButtons,
    function(obj, caption) {
      var button = that.toolbar.modeButtons[caption].button =
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
    var canvasWindow = that.windows[that.currentCanvasWindow];
    var currentLayer = canvasWindow.layers[canvasWindow.currentLayer];

    selectionModel.setSelectedItem(e.target);

    if (currentLayer instanceof Diceros.VectorLayer) {
      currentLayer.baseMode = currentLayer.mode = e.target.getValue();
      currentLayer.switchMode(currentLayer.mode);
    }

    that.refreshToolbar();
  }
  // separator
  toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

  // line optimization button
  var optimizationMenu = new goog.ui.Menu();
  for (i = 0; i <= 10; ++i) {
    optimizationMenu.addChild(new goog.ui.Option(""+i), true);
  }
  var selector = new goog.ui.ToolbarSelect('線の補正', optimizationMenu);
  selector.setTooltip('線の補正');
  toolbar.addChild(selector, true);
  toolbar.lineOptimization = selector;

  goog.dom.classes.add(selector.getElement(), 'goog-toolbar-select');

  //
  this.appendSaveButton_(toolbar);
  this.appendLoadButton_(toolbar);

  // rendering
  this.refreshToolbar();
  toolbar.render(this.target);
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
  /** @type {Diceros.Layer} */
  var currentLayer = this.getCurrentCanvasWindow().getCurrentLayer();
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

  // line optimization button
  /*
  toolbar.optimizeButton.setEnabled(isVector);

  // point optimization button
  toolbar.pointOptimize.setEnabled(isVector);
  */
};

/**
 * @param {goog.ui.Toolbar} toolbar
 * @private
 */
Diceros.Application.prototype.appendSaveButton_ = function(toolbar) {
  /** @type {imaya.ui.GoogleDriveSaveToolbarButton} */
  var button = new imaya.ui.GoogleDriveSaveToolbarButton('Save');
  /** @type {Diceros.CanvasWindow} */
  var cw = this.getCurrentCanvasWindow();

  button.setClientId('663668731705.apps.googleusercontent.com');
  button.setScope('https://www.googleapis.com/auth/drive');

  // event handler
  button.setCallback(function(token) {
    button.save(Date.now() + '.json', JSON.stringify(cw.toObject()), 'application/json', function() {
      // save done
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
  /** @type {Diceros.CanvasWindow} */
  var cw = this.getCurrentCanvasWindow();

  button.setClientId('663668731705.apps.googleusercontent.com');
  button.setScope('https://www.googleapis.com/auth/drive');

  // event handler
  button.setCallback(function(data) {
    // load done
    this.refreshFromObject(JSON.parse(data));
  }.bind(this));

  toolbar.addChild(button, true);
};

Diceros.Application.prototype.refreshFromObject = function(obj) {
  var width = this.width;
  var height = this.height;
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

// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
