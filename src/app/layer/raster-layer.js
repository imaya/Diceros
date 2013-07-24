goog.provide('Diceros.RasterLayer');

goog.require('Diceros.Layer');
goog.require('goog.object');
goog.require('CanvasFillAlgorithm');

goog.scope(function() {
/**
 * ラスタレイヤー実装
 * @extends {Diceros.Layer}
 * @constructor
 */
Diceros.RasterLayer = function(app) {
  goog.base(this, app);

  /** * @type {string} */
  this.name = 'RasterLayer';

  /** @type {Diceros.Line} */
  this.currentLine;

  /** @type {Object} */
  this.outlineArea;

  /** @type {Diceros.RasterLayer.Mode} */
  this.baseMode = Diceros.RasterLayer.Mode.DEFAULT;

  /** @type {Diceros.RasterLayer.Mode} */
  this.mode = Diceros.RasterLayer.Mode.DEFAULT;
};
goog.inherits(
  Diceros.RasterLayer,
  Diceros.Layer
);

/**
 * 編集モード
 * @enum {number}
 */
Diceros.RasterLayer.Mode = {
  DEFAULT: 0,  // デフォルトモード (描画)
  FILL: 1 // 塗りつぶし
};

// reset
Diceros.RasterLayer.prototype.switchMode = function(mode) {
  this.baseMode = this.mode = mode;
};

/**
 * イベントハンドラ
 * @param {goog.events.BrowserEvent} event Eventオブジェクト.
 */
Diceros.RasterLayer.prototype.event = function(event) {
  var canvas = this.canvas,
      ctx = this.ctx;

  /** @type {Element} */
  event.target;

  if (canvas === null || ctx === null) {
    throw 'canvas not initialized';
  }

  //
  // 事前共通処理
  //

  switch (this.mode) {
    case Diceros.RasterLayer.Mode.DEFAULT:
      this.handleEventDefault(event);
      break;
    case Diceros.RasterLayer.Mode.FILL:
      this.handleEventFill(event);
      break;
    default:
      throw new Error('invalid rasterlayer mode');
  }
};

/**
 * @param {goog.events.BrowserEvent} event browser event.
 */
Diceros.RasterLayer.prototype.handleEventDefault = function(event) {
  switch (event.type) {
    case goog.events.EventType.KEYDOWN:
      break;
    case goog.events.EventType.KEYUP:
      break;
    case goog.events.EventType.MSPOINTERMOVE: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHMOVE: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEMOVE:
      // ドラッグ中
      if (this.app.getCurrentCanvasWindow().drag) {
        this.sampling(event);
        this.refreshCurrentLineOutline();
      }

      break;
    case goog.events.EventType.MSPOINTERDOWN: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHSTART: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEDOWN:
      var line, point; // XXX
      // 線のセットアップ
      line = this.currentLine = new Diceros.BezierAGG(this.app.color);
      point = Diceros.Point.createFromEvent(event, this.getCurrentPenSize()); // XXX

      line.addControlPoint(point);

      this.refreshCurrentLineOutline();

      break;
    case goog.events.EventType.MSPOINTERUP: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHEND: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEUP:
      this.drawNewLine();
      break;
    case goog.events.MouseWheelHandler.EventType.MOUSEWHEEL:
      break;
    default:
    // NOP
  }
};

Diceros.RasterLayer.prototype.handleEventFill = function(event) {
  switch (event.type) {
    case goog.events.EventType.KEYDOWN: /* FALLTHROUGH */
    case goog.events.EventType.KEYUP: /* FALLTHROUGH */
    case goog.events.EventType.MSPOINTERMOVE: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHMOVE: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEMOVE: /* FALLTHROUGH */
    case goog.events.EventType.MSPOINTERDOWN: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHSTART: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEDOWN:
      break;
    case goog.events.EventType.MSPOINTERUP: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHEND: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEUP:
      this.fill(event.x, event.y);
      break;
    case goog.events.MouseWheelHandler.EventType.MOUSEWHEEL:
      break;
    default:
    // NOP
  }
};

/**
 * アウトラインの描画
 */
Diceros.RasterLayer.prototype.refreshCurrentLineOutline = function() {
  var ctx = this.app.windows[this.app.currentCanvasWindow].overlay.ctx;
  var outline = this.outline;

  // clear previous outline
  if (outline) {
    ctx.clearRect(outline.x, outline.y, outline.width, outline.height);
  }

  outline = this.outline = this.currentLine.outline();

  if (outline) {
    ctx.save();
    ctx.lineCap = 'round';
    outline.draw(ctx);
    ctx.restore();
  }
};

Diceros.RasterLayer.prototype.drawNewLine = function() {
  /** @type {CanvasRenderingContext2D} */
  var ctx = this.app.windows[this.app.currentCanvasWindow].overlay.ctx;
  /** @type {Diceros.LinePath} */
  var outline = this.outline;
  /** @type {Diceros.LinePath} */
  var path;
  /** @type {Diceros.Line} */
  var line = this.currentLine;
  /** @type {Element} */
  var before;
  /** @type {Element} */
  var after;

  if (outline) {
    ctx.clearRect(outline.x, outline.y, outline.width, outline.height);

    // optimization
    if (typeof line.optimize === 'function') {
      line.optimize(this.app.lineOptimization);
    }

    path = line.path();

    // save state before drawing
    before = document.createElement('canvas');
    before.width = path.width;
    before.height = path.height;
    before.getContext('2d').putImageData(
      this.ctx.getImageData(path.x, path.y, path.width, path.height),
      0,
      0
    );

    // draw new line
    if (path) {
      path.draw(this.ctx);
    }

    // save state after drawing
    after = document.createElement('canvas');
    after.width = path.width;
    after.height = path.height;
    after.getContext('2d').putImageData(
      this.ctx.getImageData(path.x, path.y, path.width, path.height),
      0,
      0
    );

    // save history
    if (this.history.length > this.historyIndex) {
      this.history.length = this.historyIndex;
    }
    this.history[this.historyIndex++] = new Diceros.HistoryObject(
      path.x,
      path.y,
      path.width,
      path.height,
      before.toDataURL(),
      after.toDataURL()
    );
    this.sendHistoryTarget();
  }
};

Diceros.RasterLayer.prototype.fill = function(x, y) {
  var cfa = new CanvasFillAlgorithm(this.canvas);

  cfa.paint((x + 0.5) | 0, (y + 0.5) | 0, this.app.rgb);
};


Diceros.RasterLayer.prototype.undo = function() {
  /** @type {Diceros.HistoryObject} */
  var history;
  /** @type {Image} */
  var image;
  /** @type {CanvasRenderingContext2D} */
  var ctx = this.ctx;

  if (this.historyIndex < 1) {
    return;
  }

  history = this.history[--this.historyIndex];
  image = new Image();

  image.addEventListener('load', function() {
    ctx.clearRect(history.x, history.y, history.width, history.height);
    ctx.drawImage(image, history.x, history.y, history.width, history.height);
  }, false);
  image.src = history.before;
};

Diceros.RasterLayer.prototype.redo = function() {
  /** @type {Diceros.HistoryObject} */
  var history;
  /** @type {Image} */
  var image;
  /** @type {CanvasRenderingContext2D} */
  var ctx = this.ctx;

  if (this.history.length <= this.historyIndex) {
    return;
  }

  history = this.history[this.historyIndex++];
  image = new Image();
  ctx = this.ctx;


  image.addEventListener('load', function() {
    ctx.clearRect(history.x, history.y, history.width, history.height);
    ctx.drawImage(image, history.x, history.y, history.width, history.height);
  }, false);
  image.src = history.after;
};

/**
 * サンプリングを行う
 */
Diceros.RasterLayer.prototype.sampling = function(event) {
  /** @type {Diceros.Line} */
  var currentLine = this.currentLine;
  /** @type {Diceros.Point} */
  var point =
        Diceros.Point.createFromEvent(event, this.getCurrentPenSize()); // XXX

  currentLine.addControlPoint(point);
};

Diceros.RasterLayer.prototype.toObject = function() {
  return {
    'type': this.name,
    'data': this.canvas.toDataURL()
  }
};

Diceros.RasterLayer.fromObject = function(app, obj) {
  var layer;
  var img;

  layer = new Diceros.RasterLayer(app);
  layer.init();

  img = new Image();
  img.onload = function() {
    layer.ctx.drawImage(img, 0, 0);
  };
  img.src = obj['data'];

  return layer;
};

});
/* vim:set expandtab ts=2 sw=2 tw=80: */
