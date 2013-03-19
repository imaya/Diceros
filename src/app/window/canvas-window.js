goog.provide('Diceros.CanvasWindow');

goog.require('goog.object');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.style');

goog.require('Diceros.Window');
goog.require('Diceros.VectorLayer');
goog.require('Diceros.RasterLayer');
goog.require('Diceros.SVGLayer');

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
   * @type {!Element}
   */
  this.element;
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
  this.currentLayer;
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

  // line buffer
  Diceros.BezierAGG.BufferCanvas.width = this.width;
  Diceros.BezierAGG.BufferCanvas.height = this.height;
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

  var layers = this.layers;
  var i;
  var il;

  goog.dom.append(this.app.target, this.element);

  // キャンバスを重ねる基本要素
  this.canvasBase = goog.dom.createElement('div');
  goog.style.setStyle(this.canvasBase, 'position', 'relative');
  goog.dom.append(this.element, this.canvasBase);
  goog.dom.append(this.canvasBase, this.overlay.canvas);

  for (i = 0, il = layers.length; i < il; ++i) {
    // canvas の配置
    goog.dom.insertSiblingBefore(
      layers[i].getCanvas(),
      this.overlay.canvas
    );
  }

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
 * @enum {number}
 */
Diceros.CanvasWindow.CaptureEventType = {
  MOUSE: 0,
  TOUCH: 1,
  POINTER: 2
};

Diceros.CanvasWindow.prototype.setCaptureEventType = function(type) {
  switch (type) {
    case Diceros.CanvasWindow.CaptureEventType.MOUSE:
      this.captureEventType = {
        start: goog.events.EventType.MOUSEDOWN,
        move: goog.events.EventType.MOUSEMOVE,
        end: goog.events.EventType.MOUSEUP
      };
      break;
    case Diceros.CanvasWindow.CaptureEventType.TOUCH:
      this.captureEventType = {
        start: goog.events.EventType.TOUCHSTART,
        move: goog.events.EventType.TOUCHMOVE,
        end: goog.events.EventType.TOUCHEND
      };
      break;
    case Diceros.CanvasWindow.CaptureEventType.POINTER:
      this.captureEventType = {
        start: goog.events.EventType.MSPOINTERDOWN,
        move: goog.events.EventType.MSPOINTERMOVE,
        end: goog.events.EventType.MSPOINTERUP
      };
  }
};

/**
 * イベントの設定
 */
Diceros.CanvasWindow.prototype.setEvent = function() {
  var self = this, canvasWindowEvent;

  if (navigator.userAgent.indexOf('Android') !== -1) {
    this.setCaptureEventType(Diceros.CanvasWindow.CaptureEventType.TOUCH);
  } else if (window.navigator.msPointerEnabled) {
    this.setCaptureEventType(Diceros.CanvasWindow.CaptureEventType.POINTER);
  } else {
    this.setCaptureEventType(Diceros.CanvasWindow.CaptureEventType.MOUSE);
  }

  // XXX: クラス定数にするか？
  canvasWindowEvent = {};

  // move
  canvasWindowEvent[this.captureEventType.move] = function(event) {
    var layer = self.getCurrentLayer();

    event.event_.preventDefault();
    event.preventDefault();

    if (!layer) {
      return;
    }

    layer.event(event);
  };

  // start
  canvasWindowEvent[this.captureEventType.start] = function(event) {
    var layer = self.getCurrentLayer();

    event.event_.preventDefault();
    event.preventDefault();

    self.drag = true;

    if (!layer) {
      return;
    }

    layer.event(event);
  };

  // end
  canvasWindowEvent[this.captureEventType.end] = function(event) {
    var drag = self.drag, layer = self.getCurrentLayer();

    self.drag = false;

    if (!layer) {
      return;
    }

    if (drag) {
      layer.event(event);
    }
  };

  // out
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
    event.type = self.captureEventType.end;
    return canvasWindowEvent[event.type](event);
  };

  // wheel
  canvasWindowEvent[goog.events.MouseWheelHandler.EventType.MOUSEWHEEL] =
  function(event) {
    var layer = self.getCurrentLayer();

    if (layer) {
      layer.event(event);
    }

    event.preventDefault();
  };

  goog.array.forEach(Object.keys(canvasWindowEvent), function(eventType){
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
Diceros.CanvasWindow.prototype.addLayer = function (type) {
  var newLayer, layersSize = this.layers.length;

  switch (type) {
  case Diceros.LayerType.VECTOR_LAYER:
    newLayer = new Diceros.VectorLayer(this.app);
    break;
  case Diceros.LayerType.RASTER_LAYER:
    newLayer = new Diceros.RasterLayer(this.app);
    break;
  case Diceros.LayerType.SVG_LAYER:
    newLayer = new Diceros.SVGLayer(this.app);
    break;
  default:
    throw 'unsupported layer class';
  }

  newLayer.init();

  // canvas の配置
  goog.dom.insertSiblingBefore(
    newLayer.getCanvas(),
    this.overlay.canvas
  );

  //goog.style.setStyle(newLayer.canvas, 'border', '1px solid black');

  this.layers.push(newLayer);
  this.selectLayer(layersSize);

  // レイヤー一覧を更新 XXX: どこかでメソッド化
  if (typeof this.app.currentLayerWindow === 'number') {
    this.app.windows[this.app.currentLayerWindow].refresh();
  }
};

/**
 * レイヤーの選択
 * @param {number} index
 */
Diceros.CanvasWindow.prototype.selectLayer = function(index) {
  /** @type {Diceros.Layer} */
  var currentLayer = this.layers[this.currentLayer];

  // 現在のレイヤーの終了処理
  if (currentLayer instanceof Diceros.VectorLayer) {
    currentLayer.switchMode(Diceros.VectorLayer.Mode.DEFAULT);
  }

  this.currentLayer = index;

  // 現在のレイヤーのツールバーに更新
  this.app.refreshToolbar();
};

/**
 * イベント発火時の座標がキャンバス内かどうかを判定する
 * @param {Event} event
 */
Diceros.CanvasWindow.prototype.checkCanvasArea = function(event) {
  var offset, x, y;

  /** @type {Element} */
  event.target;

  offset = goog.style.getPageOffset(event.target);
  x = event.pageX - offset.x;
  y = event.pageY - offset.y;

  // canvas 内
  return (x >= 0 && x < this.width && y >= 0 && y < this.height);
};

/**
 * 現在選択中のレイヤーオブジェクトを返却する
 * @return {Diceros.Layer}
 */
Diceros.CanvasWindow.prototype.getCurrentLayer = function() {
  return this.layers[this.currentLayer];
};

/**
 * @return {Array.<Object>}
 */
Diceros.CanvasWindow.prototype.toObject = function() {
  /** @type {Array.<Diceros.Layer>} */
  var layers = this.layers;
  /** @type {Array.<Object>} */
  var obj = [];
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  for (i = 0, il = layers.length; i < il; ++i) {
    obj[i] = layers[i].toObject();
  }

  return obj
};

/**
 * @param {Diceros.Application} app
 * @param {number} index
 * @param {Object} obj
 * @param {number=} opt_width
 * @param {number=} opt_height
 * @return {Diceros.CanvasWindow}
 */
Diceros.CanvasWindow.fromObject = function(app, index, obj, opt_width, opt_height) {
  /** @type {Diceros.CanvasWindow} */
  var cw = new Diceros.CanvasWindow(app, index, opt_width, opt_height);
  /** @type {Array.<Diceros.Layer>} */
  var layers = cw.layers;
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  for (i = 0, il = obj.length; i < il; ++i) {
     switch (obj[i]['type']) {
       case 'VectorLayer':
         layers[i] = Diceros.VectorLayer.fromObject(app, obj[i]);
         break;
       case 'RasterLayer':
         layers[i] = Diceros.RasterLayer.fromObject(app, obj[i]);
         break;
       case 'SVGLayer':
         layers[i] = Diceros.SVGLayer.fromObject(app, obj[i]);
         break;
       default:
         throw new Error('unknown layer type');
     }
  }

  return cw;
};

});
/* vim:set expandtab ts=2 sw=2 tw=80: */
