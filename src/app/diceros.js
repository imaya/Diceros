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

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.ui.SplitPane');


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
   * @type {HTMLElement}
   */
  this.target = null;
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
  this.currentCanvasWindow = null;
  /**
   * 現在のレイヤーウィンドウの index
   * @type {number}
   */
  this.layerWindow = null;
  /**
   * 現在のペンサイズ調整ウィンドウの index
   * @type {number}
   */
  this.sizerWindow = null;
  /**
   * レイアウト用のオブジェクト
   * @type {Object}
   */
  this.layoutPanels = {};
};

/**
 * アプリケーションの描画
 * @param {HTMLElement} target 描画対象となる HTML Element.
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
  var layer, canvas,
      height = this.height - Diceros.util.scrollBarWidth(),
      layout = this.layoutPanels;

  // ウィンドウの生成
  layer = this.addWindow(Diceros.WindowType.LAYER_WINDOW);
  canvas = this.addWindow(Diceros.WindowType.CANVAS_WINDOW);
  sizer = this.addWindow(Diceros.WindowType.SIZER_WINDOW);

  // 配置

  // サイズウィンドウとレイヤーウィンドウをツールパネルに
  layout.toolSplitPane = new goog.ui.SplitPane(
    sizer, layer,
    goog.ui.SplitPane.Orientation.VERTICAL
  );
  layout.toolSplitPane.setInitialSize(100);
  layout.toolSplitPane.setContinuousResize(true);
  layout.toolSplitPane.resize = function(size) {
    layout.toolSplitPane.setSize(size.width, size.height);
  };

  // ツールパネルとキャンバスウィンドウの結合
  layout.baseSplitPane = new goog.ui.SplitPane(
    canvas, layout.toolSplitPane,
    goog.ui.SplitPane.Orientation.HORIZONTAL
  );
  layout.baseSplitPane.setInitialSize(this.width - 200);
  layout.baseSplitPane.setContinuousResize(true);

  // 適用
  layout.baseSplitPane.render(this.target);
  layout.baseSplitPane.setSize(new goog.math.Size(this.width, this.height));
  layout.toolSplitPane.setSize(new goog.math.Size('100%', height));

  // スタイル変更
  layout.toolSplitPane.getFirstContainer = function(){
    return this.firstComponentContainer_;
  };
  goog.style.setStyle(
    layout.toolSplitPane.getFirstContainer(),
    'overflow', 'hidden'
  );
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
  return this.windows[this.currentCanvasWindow];
};

/**
 * 現在のサイズ調整ウィンドウの取得
 * @return {Diceros.SizerWindow} 現在のサイズ調整ウィンドウ.
 */
Diceros.Application.prototype.getCurrentSizerWindow = function() {
  return this.windows[this.sizerWindow];
};

/**
 * キャンバスの作成
 * @param {number} width 作成するキャンバスの横幅.
 * @param {number} height 作成するキャンバスの縦幅.
 * @return {HTMLElement} 作成したキャンバス.
 */
Diceros.Application.prototype.makeCanvas = function(width, height) {
  var canvas = document.createElement('canvas');

  // for canvas emulator
  if (!canvas.getContext) {
    // excanvas
    if (window.G_vmlCanvasManager && window.G_vmlCanvasManager.initElement) {
      canvas = window.G_vmlCanvasManager.initElement(canvas);
    // uucanvas
    } else if (window.uu && window.uu.canvas &&
               typeof window.uu.canvas.create === 'function') {
      var dummynode = goog.dom.createElement('div', {'id': '_canvas_dummy'});

      goog.dom.removeElement(canvas); // uuCanvasはノードの作り方が違うので一度消す
      canvas = uu.canvas.create(
        width, height, 'vml', uu.id('_canvas_dummy')
      );
    } else {
      throw 'canvas not supported';
    }
  }

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

});
/* vim:set expandtab ts=2 sw=2 tw=80: */
