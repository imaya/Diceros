goog.provide('Diceros.CanvasWindow');

goog.require('goog.object');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.style');

goog.require('Diceros.Window');
goog.require('Diceros.VectorLayer');
goog.require('Diceros.RasterLayer');

goog.scope(function(){

/**
 * キャンバスウィンドウクラス
 *
 * @param {Diceros.Application} app
 * @param {number} index
 * @param {number=} [opt_width]
 * @param {number=} [opt_height]
 *
 * @extends {Diceros.Window}
 * @constructor
 */
Diceros.CanvasWindow =
function(app, index, opt_width, opt_height) {
  goog.base(this, app, index);

  /**
   * クラス名
   * @type {string}
   */
  this.name = 'CanvasWindow';
  /**
   * XXX: キャンバスエレメント?
   * @type {Element}
   */
  this.element = null;
  /**
   * XXX: ドラッグ中？
   * @type {boolean}
   */
  this.drag = false;
  /**
   * レイヤーリスト
   * @type {Array.<Diceros.Layer>}
   */
  this.layers = [];
  /**
   * 現在編集中のレイヤー index
   * @type {number}
   */
  this.currentLayer = null;
  /**
   * 横幅
   * @type {number}
   */
  this.width  = (!!opt_width)  ? opt_width  : app.width;
  /**
   * 縦幅
   * @type {number}
   */
  this.height = (!!opt_height) ? opt_height : app.height;

  /**
   * 操作時の表示用オーバーレイレイヤー
   * @type {Object}
   */
  this.overlay = {};
  this.overlay.canvas = app.makeCanvas(app.width, app.height);
  this.overlay.ctx = this.overlay.canvas.getContext('2d');
  goog.style.setStyle(this.overlay.canvas, 'position', 'absolute');

  /**
   * よろず作業用 canvas context
   * 主にベクタレイヤでの線毎のImageDataオブジェクトを生成するなどに利用
   * @type {Object}
   */
  this.tempctx = app.makeCanvas(app.width, app.height).getContext('2d');
};
goog.inherits(
  Diceros.CanvasWindow,
  Diceros.Window
);

/**
 * このコンポーネントが decorate 可能かどうか
 * @return {boolean} decorete 不可のため必ず false を返す.
 */
Diceros.CanvasWindow.prototype.canDecorate = function() {
  return false;
};

/**
 * コンポーネントの初期化処理
 * @param {Element} element
 */
Diceros.CanvasWindow.prototype.decorateInternal =
function(element) {
  goog.base(this, 'decorateInternal', element);

  goog.dom.append(this.app.target, this.element);

  // キャンバスを重ねる基本要素
  this.canvasBase = goog.dom.createElement('div');
  goog.style.setStyle(this.canvasBase, 'position', 'relative');
  goog.dom.append(this.element, this.canvasBase);
  goog.dom.append(this.canvasBase, this.overlay.canvas);

  // イベントの設定
  this.setEvent();
};

/**
 * ルートノードの作成
 */
Diceros.CanvasWindow.prototype.createDom = function() {
  this.element = goog.dom.createElement('div');

  this.decorateInternal(this.element);
};

/**
 * イベントの設定
 */
Diceros.CanvasWindow.prototype.setEvent = function() {
  var self = this, canvasWindowEvent, handleEventList;

  // XXX: クラス定数にするか？
  canvasWindowEvent = {};
  canvasWindowEvent[goog.events.EventType.MOUSEMOVE] = function(event) {
    var layer = self.getCurrentLayer();

    if (!layer) {
      return;
    }

    layer.event(event);
  };
  canvasWindowEvent[goog.events.EventType.MOUSEDOWN] = function(event) {
    var layer = self.getCurrentLayer();

    self.drag = true;

    if (!layer) {
      return;
    }

    layer.event(event);
  };
  canvasWindowEvent[goog.events.EventType.MOUSEUP] = function(event) {
    var drag = self.drag, layer = self.getCurrentLayer();

    self.drag = false;

    if (!layer) {
      return;
    }

    if (drag) {
      layer.event(event);
    }
  };
  canvasWindowEvent[goog.events.EventType.MOUSEOUT] = function(event) {
    var offset = goog.style.getPageOffset(self.element),
        x = event.pageX - offset.x,
        y = event.pageY - offset.y;

    // 要素内の範囲内の場合は除外
    if (x >= 0 && x < self.element.width() &&
        y >= 0 && y < self.element.height()) {
      return;
    }

    // マウスが外れたときはマウスアップと同じ扱いにする
    event.type = goog.events.EventType.MOUSEUP;
    return canvasWindowEvent[event.type](event);
  };
  canvasWindowEvent[goog.events.MouseWheelHandler.EventType.MOUSEWHEEL] =
  function(event) {
    var layer = self.getCurrentLayer();

    if (layer) {
      layer.event(event);
    }

    event.preventDefault();
  };

  handleEventList = [
    goog.events.EventType.MOUSEMOVE,
    goog.events.EventType.MOUSEDOWN,
    goog.events.EventType.MOUSEUP,
    goog.events.EventType.MOUSEOUT,
    goog.events.MouseWheelHandler.EventType.MOUSEWHEEL
  ];

  goog.array.forEach(handleEventList, function(eventType){
    var element = this.element;

    if (eventType === goog.events.MouseWheelHandler.EventType.MOUSEWHEEL) {
      element = new goog.events.MouseWheelHandler(element);
    }

    goog.events.listen(
      element,
      eventType,
      canvasWindowEvent[eventType]
    );
  }, this);
};

/**
 * レイヤーの追加
 * @param {Diceros.LayerType} type
 */
Diceros.CanvasWindow.prototype.addLayer =
function (type) {
  var newLayer, layersSize = this.layers.length;

  switch (type) {
  case Diceros.LayerType.VECTOR_LAYER:
    newLayer = new Diceros.VectorLayer(this.app);
    break;
  case Diceros.LayerType.RASTER_LAYER:
    newLayer = new Diceros.RasterLayer(this.app);
    break;
  default:
    throw 'unsupported layer class';
  }

  newLayer.init();
  goog.style.setStyle(newLayer.canvas, 'border', '1px solid black');

  this.selectLayer(layersSize);
  this.layers.push(newLayer);

  // レイヤー一覧を更新 XXX: どこかでメソッド化
  if (typeof this.app.currentLayerWindow === 'number') {
    this.app.windows[this.app.currentLayerWindow].refresh();
  }
};

/**
 * レイヤーの選択
 * @param {number} index
 */
Diceros.CanvasWindow.prototype.selectLayer =
function(index) {
  this.currentLayer = index;
};

/**
 * イベント発火時の座標がキャンバス内かどうかを判定する
 *
 * @param {Event} event
 */
Diceros.CanvasWindow.prototype.checkCanvasArea =
function(event) {
  var offset = goog.style.getPageOffset(event.target),
      x = event.pageX - offset.x,
      y = event.pageY - offset.y;

  // canvas 内
  if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
    return true;
  }

  return false;
};

/**
 * 現在選択中のレイヤーオブジェクトを返却する
 *
 * @return {Diceros.Layer}
 */
Diceros.CanvasWindow.prototype.getCurrentLayer =
function() {
  return this.layers[this.currentLayer];
};

});
/* vim:set expandtab ts=2 sw=2 tw=80: */
