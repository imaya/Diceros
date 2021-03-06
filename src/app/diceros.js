/**
 * Paint tool "Diceros"
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
goog.require('Diceros.Toolbar');

goog.require('imaya.ui.SplitPane');
goog.require('imaya.ui.GoogleDriveLoadToolbarButton');
goog.require('imaya.ui.GoogleDriveSaveToolbarButton');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math.Size');
goog.require('goog.array');
goog.require('goog.object');

goog.require('goog.ui.Component');
goog.require('goog.ui.SplitPane');
goog.require('goog.ui.ToolbarToggleButton');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.SelectionModel');

goog.require('goog.ui.ToolbarColorMenuButton');
goog.require('goog.ui.ToolbarColorMenuButtonRenderer');
goog.require('goog.ui.ToolbarSeparator');

goog.scope(function() {

/**
 * お絵描きアプリケーションクラス
 * @param {Object=} opt_config アプリケーション初期化設定
 * @constructor
 * @extends {goog.ui.Component}
 */
Diceros.Application = function(opt_config) {
  goog.base(this);

  if (!opt_config) {
    opt_config = {};
  }

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
  this.width = opt_config['width'] || 1024;
  //this.width = 500;
  /**
   * 縦幅
   * @type {number}
   */
  this.height = opt_config['height'] || 768;
  //this.height = 500;
  /**
   * 画面の横幅
   * @type {number}
   */
  this.screenWidth = goog.global.innerWidth;
  /**
   * 画面の縦幅
   * @type {number}
   */
  this.screenHeight = goog.global.innerHeight;
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
   * @type {Diceros.Toolbar}
   */
  this.toolbar;
  /** @type {Object} */
  this.save;
  /** @type {?string} */
  this.color;
  /** @type {number} */
  this.rgb;
};
goog.inherits(Diceros.Application, goog.ui.Component);

/*
Diceros.Application.prototype.decorate = function(element) {
  goog.base(this, element);
};
*/

Diceros.Application.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var layerWindow;
  var canvasWindow;
  var sizerWindow;
  var layoutPanels = this.layoutPanels;

  // layer window
  layerWindow = this.addWindow(Diceros.WindowType.LAYER_WINDOW);

  // canvas window
  if (!this.save) {
    canvasWindow = this.addWindow(Diceros.WindowType.CANVAS_WINDOW);
  } else {
    // データからの読み込みの場合
    canvasWindow = Diceros.CanvasWindow.fromObject(
      this,
      this.windows.length,
      this.save
    );
    this.currentCanvasWindow = this.windows.length;
    this.selectCanvasWindow(this.windows.length);
    this.windows.push(canvasWindow);
  }

  // sizer window
  sizerWindow = this.addWindow(Diceros.WindowType.SIZER_WINDOW);

  // toolbar
  this.toolbar = new Diceros.Toolbar(this);

  // splitpane
  var toolSplitPane = layoutPanels.toolSplitPane = new goog.ui.SplitPane(
    sizerWindow, layerWindow,
    goog.ui.SplitPane.Orientation.VERTICAL
  );
  toolSplitPane.setInitialSize(150);
  toolSplitPane.setContinuousResize(true);
  toolSplitPane.resize = function(size) {
    toolSplitPane.setSize(size);
  };

  // splitpane
  var baseSplitPane = layoutPanels.baseSplitPane = new imaya.ui.SplitPane(
    canvasWindow, layoutPanels.toolSplitPane,
    imaya.ui.SplitPane.Orientation.HORIZONTAL
  );
  baseSplitPane.setInitialSize(this.screenWidth - 150);
  baseSplitPane.setContinuousResize(true);
  baseSplitPane.setSnapDirection(false);
  baseSplitPane.setHandleSize(30);

  this.addChild(this.toolbar, true);
  this.addChild(baseSplitPane, true);
};

Diceros.Application.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.layout();
  this.setEvent();
};

/**
 * @param {goog.math.Size} size
 */
Diceros.Application.prototype.resizeScreen = function(size) {
  var prevWidth = this.screenWidth;

  this.screenWidth = size.width;
  this.screenHeight = size.height;

  // splitpane
  this.layoutPanels.baseSplitPane.setSize(
    new goog.math.Size(
      this.screenWidth,
      this.screenHeight
    )
  );

  // first component
  this.layoutPanels.baseSplitPane.setFirstComponentSize(
    this.screenWidth -
    (prevWidth - this.layoutPanels.baseSplitPane.getFirstComponentSize())
  );
};

/**
 * 各コンポーネントの配置
 */
Diceros.Application.prototype.layout = function() {
  var height = this.screenHeight - Diceros.util.scrollBarWidth();

  // 適用
  this.layoutPanels.baseSplitPane.setSize(
    new goog.math.Size(
      this.screenWidth,
      height
      //this.screenHeight
    )
  );
  //baseSplitPane.setSize(new goog.math.Size(this.width, this.height - goog.style.getBorderBoxSize(this.toolbar.getElement()).height));
  this.layoutPanels.toolSplitPane.setSize(
    new goog.math.Size(
      this.layoutPanels.toolSplitPane.getFirstComponentSize().width,
      height
    )
  );
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
    this.getElement(), goog.events.EventType.KEYDOWN, function(event) {
      var canvasWindow = app.getCurrentCanvasWindow();
      var layer;

      event.preventDefault();

      // TODO: undo, redo
      // Ctrl+Z, Ctrl+Shift+Z
      if (canvasWindow && !canvasWindow.drag && event.keyCode === 90 && event.ctrlKey) {
        if (event.shiftKey) {
          canvasWindow.redo();
        } else {
          canvasWindow.undo();
        }
        return;
      }

      layer = canvasWindow.getCurrentLayer();

      if (!layer) {
        return;
      }

      layer.event(event);
    }
  );
  goog.events.listen(
    this.getElement(), goog.events.EventType.KEYUP, function(event) {
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
Diceros.Application.prototype.refreshToolbar = function() {
  this.toolbar.refresh();
};

Diceros.Application.prototype.refreshFromObject = function(obj) {
  /** @type {number} */
  var width = this.width;
  /** @type {number} */
  var height = this.height;
  /** @type {!Element} */
  var target = /** @type {!Element} */(this.getElement());

  if (this.target) {
    this.target.innerHTML = '';
  }

  // TODO
  Object.keys(this).forEach(function(key) {
    this[key] = null;
  }.bind(this));

  this.save = obj;

  Diceros.Application.call(this, {'width': obj['width'], 'height': obj['height']});
  this.render(target);
};



// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
