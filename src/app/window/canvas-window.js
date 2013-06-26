goog.provide('Diceros.CanvasWindow');

goog.require('goog.object');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.style');
goog.require('goog.math.Matrix');

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

  /**
   * 操作時の一時表示用オーバーレイレイヤー
   * @type {Object}
   */
  this.temp= {};
  this.temp.canvas = app.makeCanvas(app.width, app.height);
  this.temp.ctx = this.temp.canvas.getContext('2d');
  goog.style.setStyle(this.temp.canvas, 'position', 'absolute');

  /**
   * Pointer Events でタッチを無視する
   * @type {boolean}
   */
  this.ignoreTouch = true;

  /**
   * @type {Diceros.CanvasWindow.PointerMode}
   */
  this.pointerMode = Diceros.CanvasWindow.PointerMode.Draw;

  /**
   * ビュー変換の起点 X 座標.
   * @type {number}
   */
  this.originX = 0;

  /**
   * ビュー変換の起点 Y 座標.
   * @type {number}
   */
  this.originY = 0;

  /**
   * ビューの変換行列
   * @type {goog.math.Matrix}
   */
  this.matrix = new goog.math.Matrix([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);

  // line buffer
  Diceros.BezierAGG.BufferCanvas.width = this.width;
  Diceros.BezierAGG.BufferCanvas.height = this.height;
};
goog.inherits(
  Diceros.CanvasWindow,
  Diceros.Window
);

/**
 * @enum {number}
 */
Diceros.CanvasWindow.PointerMode = {
  Draw: 0,
  Move: 1
};

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
Diceros.CanvasWindow.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);

  var layers = this.layers;
  var i;
  var il;

  goog.dom.append(this.app.target, this.element);

  goog.style.setStyle(element, {
    'width': '100%',
    'height': '100%',
    'background-image':
      'url(data:image/png;base64,' +
      'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAAAAACT4cgpAAAAF0lEQVR4AWO4CwX/oWCkC' +
      '8AYMIkRLgAA37fcENcvrt8AAAAASUVORK5CYII=)'
  });

  // キャンバスを重ねる基本要素
  this.canvasBase = goog.dom.createElement('div');
  goog.style.setStyle(this.canvasBase, 'position', 'relative');
  goog.dom.append(this.element, this.canvasBase);
  goog.dom.append(this.canvasBase, this.overlay.canvas);
  this.overlay.canvas.id="ol";
  goog.dom.append(this.canvasBase, this.temp.canvas);
  this.temp.canvas.id="tmp";

  // TODO: canvas size にする
  goog.style.setStyle(this.canvasBase, {
    'width': this.app.width + 'px',
    'height': this.app.height + 'px',
    'border': '1px solid black'
  });

  for (i = 0, il = layers.length; i < il; ++i) {
    // canvas の配置
    goog.dom.insertSiblingBefore(
      layers[i].getCanvas(),
      this.overlay.canvas
    );
  }

  // イベントの設定
  if (!this.getCaptureEventType()) {
    this.decideCapture();
  }
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

/**
 * @param {Diceros.CanvasWindow.CaptureEventType} type
 */
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
  this.captureEventType.type = type;

  this.setEvent();
  this.app.refreshToolbar();
};

/**
 * @returns {(Diceros.CanvasWindow.CaptureEventType|undefined)}
 */
Diceros.CanvasWindow.prototype.getCaptureEventType = function() {
  return this.captureEventType === void 0 ? void 0 : this.captureEventType.type;
};

/**
 * キャプチャするイベントを環境から自動で判定する
 */
Diceros.CanvasWindow.prototype.decideCapture = function() {
  if (navigator.userAgent.indexOf('Android') !== -1) {
    this.setCaptureEventType(Diceros.CanvasWindow.CaptureEventType.TOUCH);
  } else if (window.navigator.msPointerEnabled) {
    this.setCaptureEventType(Diceros.CanvasWindow.CaptureEventType.POINTER);
  } else {
    this.setCaptureEventType(Diceros.CanvasWindow.CaptureEventType.MOUSE);
  }
};

/**
 * イベントの設定
 */
Diceros.CanvasWindow.prototype.setEvent = function() {
  /** @type {Diceros.CanvasWindow} */
  var canvasWindow = this;
  /** @type {Object} */
  var canvasWindowEvent;
  /** @type {Element} */
  var element = this.element;
  /** @type {(Element|goog.events.MouseWheelHandler)} */
  var handler;

  // すでに登録済みのキャプチャを外す
  if (this.eventListeners) {
    goog.object.forEach(this.eventListeners, function(value, key) {
      if (key === goog.events.MouseWheelHandler.EventType.MOUSEWHEEL) {
        handler = new goog.events.MouseWheelHandler(element);
      } else {
        handler = element;
      }
      goog.events.unlisten(handler, key, value);
    });
  }

  canvasWindowEvent = this.eventListeners = {};

  // move
  canvasWindowEvent[this.captureEventType.move] = function(event) {
    var layer = canvasWindow.getCurrentLayer();
    var pos = goog.style.getPosition(canvasWindow.canvasBase);

    event.preventDefault();

    if (
      canvasWindow.ignoreTouch &&
      canvasWindow.captureEventType.type === Diceros.CanvasWindow.CaptureEventType.POINTER &&
      event.getBrowserEvent().pointerType !== MSPointerEvent.MSPOINTER_TYPE_PEN
    ) {
      return;
    }

    enchantPoint(event);

    switch (canvasWindow.pointerMode) {
      case Diceros.CanvasWindow.PointerMode.Draw:
        layer && layer.event(event);
        break;
      case Diceros.CanvasWindow.PointerMode.Move:
        if (canvasWindow.drag) {
          if (canvasWindow.getCaptureEventType() === Diceros.CanvasWindow.CaptureEventType.TOUCH) {
            goog.style.setPosition(
              canvasWindow.canvasBase,
              pos.x +
                event.getBrowserEvent().changedTouches[0].clientX -
                canvasWindow.prevEvent.getBrowserEvent().changedTouches[0].clientX,
              pos.y +
                event.getBrowserEvent().changedTouches[0].clientY -
                canvasWindow.prevEvent.getBrowserEvent().changedTouches[0].clientY
            );
          } else {
            goog.style.setPosition(
              canvasWindow.canvasBase,
              pos.x + event.clientX - canvasWindow.prevEvent.clientX,
              pos.y + event.clientY - canvasWindow.prevEvent.clientY
            );
          }
          canvasWindow.prevEvent = event;

        }
        break;
      default:
        throw new Error('invalid pointer mode');
    }
  };

  // start
  canvasWindowEvent[this.captureEventType.start] = function(event) {
    var layer = canvasWindow.getCurrentLayer();
    var pos = goog.style.getPosition(canvasWindow.canvasBase);

    event.preventDefault();

    if (
      canvasWindow.ignoreTouch &&
      canvasWindow.captureEventType.type === Diceros.CanvasWindow.CaptureEventType.POINTER &&
      event.getBrowserEvent().pointerType !== MSPointerEvent.MSPOINTER_TYPE_PEN
    ) {
      return;
    }

    enchantPoint(event);
    canvasWindow.drag = true;

    switch (canvasWindow.pointerMode) {
      case Diceros.CanvasWindow.PointerMode.Draw:
        layer && layer.event(event);
        break;
      case Diceros.CanvasWindow.PointerMode.Move:
        canvasWindow.prevEvent = event;
        break;
      default:
        throw new Error('invalid pointer mode');
    }
  };

  // end
  canvasWindowEvent[this.captureEventType.end] = function(event) {
    var drag = canvasWindow.drag, layer = canvasWindow.getCurrentLayer();
    var pos = goog.style.getPosition(canvasWindow.canvasBase);

    canvasWindow.drag = false;

    event.preventDefault();

    if (
      canvasWindow.ignoreTouch &&
      canvasWindow.captureEventType.type === Diceros.CanvasWindow.CaptureEventType.POINTER &&
      event.getBrowserEvent().pointerType !== MSPointerEvent.MSPOINTER_TYPE_PEN
    ) {
      return;
    }

    enchantPoint(event);

    switch (canvasWindow.pointerMode) {
      case Diceros.CanvasWindow.PointerMode.Draw:
        layer && drag && layer.event(event);
        break;
      case Diceros.CanvasWindow.PointerMode.Move:
        break;
      default:
        throw new Error('invalid pointer mode');
    }
  };

  // out
  canvasWindowEvent[
    this.captureEventType.type === Diceros.CanvasWindow.CaptureEventType.POINTER ?
    goog.events.EventType.MSPOINTEROUT :
    goog.events.EventType.MOUSEOUT
  ] = function(event) {
    event.preventDefault();

    enchantPoint(event);

    // 要素内の範囲内の場合は除外
    var rect = canvasWindow.element.getBoundingClientRect();
    if (event.clientX >= rect.left && event.clientX <= rect.left + rect.width &&
        event.clientY >= rect.top  && event.clientY <= rect.top  + rect.height) {
      return;
    }

    // マウスが外れたときはマウスアップと同じ扱いにする
    event.type = canvasWindow.captureEventType.end;

    return canvasWindowEvent[event.type](event);
  };

  // wheel
  canvasWindowEvent[goog.events.MouseWheelHandler.EventType.MOUSEWHEEL] =
  function(event) {
    var layer = canvasWindow.getCurrentLayer();

    event.preventDefault();

    switch (canvasWindow.pointerMode) {
      case Diceros.CanvasWindow.PointerMode.Draw:
        layer && layer.event(event);
        break;
      case Diceros.CanvasWindow.PointerMode.Move:
        break;
      default:
        throw new Error('invalid pointer mode');
    }
  };

  // hover TODO: event type に追加されたら対応する
  canvasWindowEvent['MSPointerHover'] = function(event) {
    var layer = canvasWindow.getCurrentLayer();

    event.preventDefault();

    switch (canvasWindow.pointerMode) {
      case Diceros.CanvasWindow.PointerMode.Draw:
        layer && layer.event(event);
        break;
      case Diceros.CanvasWindow.PointerMode.Move:
        break;
      default:
        throw new Error('invalid pointer mode');
    }
  };

  /**
   * @param {goog.events.BrowserEvent} event
   */
  function enchantPoint(event) {
    var inner = canvasWindow.canvasBase;
    /** @type {ClientRect} */
    var rect = canvasWindow.element.getBoundingClientRect();
    /** @type {number} */
    var clientX = (event.type.indexOf('touch') !== 0 ? event : event.getBrowserEvent().changedTouches[0]).clientX;
    /** @type {number} */
    var clientY = (event.type.indexOf('touch') !== 0 ? event : event.getBrowserEvent().changedTouches[0]).clientY;
    /** @type {number} */
    var x = clientX - rect.left;
    /** @type {number} */
    var y = clientY - rect.top;
    /** @type {number} */
    var left = parseInt(inner.style.left || 0, 10);
    /** @type {number} */
    var top  = parseInt(inner.style.top  || 0, 10);
    /** @type {number} */
    var ox = canvasWindow.originX || 0;
    /** @type {number} */
    var oy = canvasWindow.originY || 0;
    /** @type {goog.math.Matrix} */
    var matrix = canvasWindow.matrix;
    /** @type {goog.math.Matrix} */
    var inverse = matrix.getInverse();
    /** @type {!Array.<number>} */
    var res = goog.array.flatten(
      inverse.multiply(
        new goog.math.Matrix([
          [x - matrix.getValueAt(0, 2) - left - ox],
          [y - matrix.getValueAt(1, 2) - top  - oy],
          [1]
        ])
      ).toArray()
    );

    event.x = res[0] - inverse.getValueAt(0, 2) + ox;
    event.y = res[1] - inverse.getValueAt(1, 2) + oy;
  }

  goog.array.forEach(Object.keys(canvasWindowEvent), function(eventType){
    if (eventType === goog.events.MouseWheelHandler.EventType.MOUSEWHEEL) {
      handler = new goog.events.MouseWheelHandler(element);
    } else {
      handler = element;
    }

    goog.events.listen(
      handler,
      eventType,
      canvasWindowEvent[eventType]
    );
  }, this);
};

/**
 * @param {Diceros.CanvasWindow.PointerMode} pointerMode
 */
Diceros.CanvasWindow.prototype.setPointerMode = function(pointerMode) {
  this.pointerMode = pointerMode;
};

/**
 * @param {boolean} ignore
 */
Diceros.CanvasWindow.prototype.setIgnoreTouch = function(ignore) {
  this.ignoreTouch = ignore;
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

/**
 * @returns {HTMLCanvasElement}
 */
Diceros.CanvasWindow.prototype.createMergedCanvas = function() {
  /** @type {Array.<Diceros.Layer>} */
  var layers = this.layers;
  /** @type {HTMLCanvasElement} */
  var canvas =
    /** @type {HTMLCanvasElement} */
    (document.createElement('canvas'));
  /** @type {CanvasRenderingContext2D} */
  var ctx =
    /** @type {CanvasRenderingContext2D} */
    (canvas.getContext('2d'));
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;
  /** @type {Diceros.Layer} */
  var layer;

  canvas.width = this.width;
  canvas.height = this.height;

  for (i = 0, il = layers.length; i < il; ++i) {
    layer = layers[i];
    if (layer instanceof Diceros.SVGLayer) {
      layer = layer.toVectorLayer();
    }
    ctx.drawImage(layer.canvas, 0, 0);
  }

  return canvas;
}

});
/* vim:set expandtab ts=2 sw=2 tw=80: */
