
goog.provide('Diceros.SizerWindow');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.math.Coordinate');

goog.require('Diceros.Window');

goog.scope(function(){
/**
 * レイヤー制御ウィンドウクラス
 *
 * @param {Diceros.Application} app アプリケーションオブジェクト.
 * @param {number} index
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 *
 * @extends {Diceros.Window}
 * @constructor
 */
Diceros.SizerWindow = function(app, index, opt_domHelper) {
  goog.base(this, app, index, opt_domHelper);

  /** @type {string} */
  this.name = 'SizerWindow';
  /** @type {!Element} */
  this.element;
  /** @type {!Element} */
  this.canvas;
  /** @type {number} */
  this.width = 0;
  /** @type {number} */
  this.height = 0;
  /** @type {number} */
  this.size = 5;
  /** @type {boolean} */
  this.leftDrag = false;
};
goog.inherits(Diceros.SizerWindow, Diceros.Window);

/**
 * CSS クラス名
 * @type {string}
 * @private
 */
Diceros.SizerWindow.CLASS_NAME_ = goog.getCssName('sizerwindow');

/**
 * このコンポーネントが decorate 可能かどうか
 */
Diceros.SizerWindow.prototype.canDecorate = function() {
  return false;
};

/**
 * コンポーネントの初期化処理
 */
Diceros.SizerWindow.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);

  // ルートノード
  goog.dom.classes.add(
    element,
    Diceros.SizerWindow.CLASS_NAME_
  );

  // サイズ表示用
  this.canvas = this.app.makeCanvas(this.width, this.width); // XXX: magic number
  goog.style.setStyle(this.canvas, 'border', 1);
  goog.dom.append(this.element, this.canvas);

  this.setEvent();
};

/**
 * XXXXXXXXXXXXXXX この辺全体的にコード汚い　別のメソッドに分離すべし
 */
Diceros.SizerWindow.prototype.setEvent = function() {
  var that = this;

  // mouse
  goog.events.listen(this.canvas, goog.events.EventType.MOUSEDOWN, onStart);
  goog.events.listen(this.canvas, goog.events.EventType.MOUSEUP, onEnd);
  goog.events.listen(this.canvas, goog.events.EventType.MOUSEMOVE, onMove);
  goog.events.listen(this.canvas, goog.events.EventType.MOUSEOUT, onOut);

  // touch
  // XXX: タッチ時は別の仕組みの方がよいかもしれない
  goog.events.listen(this.canvas, goog.events.EventType.TOUCHSTART, onStart);
  goog.events.listen(this.canvas, goog.events.EventType.TOUCHEND, onEnd);
  goog.events.listen(this.canvas, goog.events.EventType.TOUCHMOVE, onMove);

  function onStart(e){
    that.leftDrag = true;
    that.size = that.pointToSize_(new goog.math.Coordinate(e.offsetX, e.offsetY));

    that.refresh();
  }

  function onEnd(e){
    that.leftDrag = false;
    that.size = that.pointToSize_(new goog.math.Coordinate(e.offsetX, e.offsetY));

    that.refresh();
  }

  function onMove(e){
    if (that.leftDrag) {
      that.size = that.pointToSize_(new goog.math.Coordinate(e.offsetX, e.offsetY));

      that.refresh();
    }
  }

  function onOut(e){
    if (that.leftDrag) {
      that.leftDrag = false;
      that.size = that.pointToSize_(new goog.math.Coordinate(e.offsetX, e.offsetY));

      that.refresh();
    }
  }
};

/**
 * @param {!goog.math.Coordinate} point
 * @private
 */
Diceros.SizerWindow.prototype.pointToSize_ = function(point) {
  var center = new goog.math.Coordinate(this.width / 2, this.height / 2);

  return goog.math.Coordinate.distance(center, point);
};


/**
 * ルートノードの作成
 */
Diceros.SizerWindow.prototype.createDom = function() {
  this.element = goog.dom.createElement('div');

  this.decorateInternal(this.element);

  this.refresh();
};

/**
 * resize
 */
Diceros.SizerWindow.prototype.resize = function(size) {
  this.width = size.width;
  this.height = size.height;

  this.refresh();
};

/**
 *
 */
Diceros.SizerWindow.prototype.refresh = function() {
  var ctx = this.canvas.getContext('2d'),
      center = new goog.math.Coordinate(this.width / 2, this.height / 2),
      size = this.size,
      width = this.width,
      height = this.height;

  this.canvas.width = width;
  this.canvas.height = height;

  ctx.beginPath();
  ctx.clearRect(0, 0, width, height);

  // base
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);
  ctx.moveTo(0, center.y);
  ctx.lineTo(width, center.y);
  ctx.moveTo(center.x, 0);
  ctx.lineTo(center.x, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.moveTo(center.x + size, center.y);
  ctx.arc(center.x, center.y, size, 0, 7);
  ctx.fill();
};


// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
