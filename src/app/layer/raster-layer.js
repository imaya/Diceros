goog.provide('Diceros.RasterLayer');

goog.require('Diceros.Layer');
goog.require('goog.object');

goog.scope(function() {
/**
 * ラスタレイヤー実装
 * @extends Diceros.Layer
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
};
goog.inherits(
  Diceros.RasterLayer,
  Diceros.Layer
);

/**
 * イベントハンドラ
 * @param {goog.events.BrowserEvent} event Eventオブジェクト.
 */
Diceros.RasterLayer.prototype.event = function(event) {
  var canvas = this.canvas,
      ctx = this.ctx,
      offset, x, y;

  /** @type {Element} */
  event.target;

  offset = goog.style.getPageOffset(event.target);
  x = event.event_.pageX - offset.x,
  y = event.event_.pageY - offset.y;

  if (canvas === null || ctx === null) {
    throw 'canvas not initialized';
  }

  //
  // 事前共通処理
  //

  switch (event.type) {
    case goog.events.EventType.KEYDOWN:
      break;
    case goog.events.EventType.KEYUP:
      break;
    case goog.events.EventType.TOUCHMOVE: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEMOVE:
      // ドラッグ中
      if (this.app.getCurrentCanvasWindow().drag) {
        this.sampling(event);
        this.refreshCurrentLineOutline();
      }

      break;
    case goog.events.EventType.TOUCHSTART: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEDOWN:
      var line, point, beforeLine; // XXX
      // 線のセットアップ
      line = this.currentLine = new Diceros.BezierAGG(this.app.toolbar.colorButton.getSelectedColor());
      point = Diceros.Point.createFromEvent(event, this.getCurrentPenSize()); // XXX

      line.addControlPoint(point);

      this.refreshCurrentLineOutline();

      break;
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

/**
 * アウトラインの描画
 */
Diceros.RasterLayer.prototype.refreshCurrentLineOutline = function() {
  var ctx = this.app.windows[this.app.currentCanvasWindow].overlay.ctx;
  var outline = this.outline;

  // clear previous outline
  if (outline) {
    ctx.clearRect(outline.x - 2, outline.y - 2, outline.width + 4, outline.height + 4);
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

  if (outline) {
    ctx.clearRect(outline.x, outline.y, outline.width, outline.height);

    // optimization
    if (typeof line.optimize === 'function') {
      line.optimize(this.app.toolbar.lineOptimization.getValue() | 0);
    }

    path = line.path();
    if (path) {
      path.draw(this.ctx);
    }
  }
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


});
/* vim:set expandtab ts=2 sw=2 tw=80: */
