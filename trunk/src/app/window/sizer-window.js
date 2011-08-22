
goog.provide('application.Diceros.SizerWindow');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.math.Coordinate');

goog.require('application.Diceros.Window');

goog.scope(function(){
/**
 * レイヤー制御ウィンドウクラス
 *
 * @param {application.Diceros.Application} app アプリケーションオブジェクト.
 * @param {number} index
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 *
 * @extends {application.Diceros.Window}
 * @constructor
 */
application.Diceros.SizerWindow =
function(app, index, opt_domHelper) {
  goog.base(this, app, index, opt_domHelper);

  this.name = 'SizerWindow';
  this.element = null;
  this.canvas = null;
  this.width = 0;
  this.height = 0;
  this.size = 0;
  this.leftDrag = false;
};
goog.inherits(
  application.Diceros.SizerWindow,
  application.Diceros.Window
);

/**
 * CSS クラス名
 * @type {string}
 * @private
 */
application.Diceros.SizerWindow.CLASS_NAME_ = goog.getCssName('sizerwindow');

/**
 * このコンポーネントが decorate 可能かどうか
 */
application.Diceros.SizerWindow.prototype.canDecorate = function() {
  return false;
};

/**
 * コンポーネントの初期化処理
 */
application.Diceros.SizerWindow.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);

  // ルートノード
  goog.dom.classes.add(
    element,
    application.Diceros.SizerWindow.CLASS_NAME_
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
application.Diceros.SizerWindow.prototype.setEvent = function(element) {
  var self = this;

  // max
  goog.events.listen(this.canvas, goog.events.EventType.MOUSEDOWN, function(e){
    var size = self.size.min;

    self.leftDrag = true;
    self.size = self.pointToSize_(new goog.math.Coordinate(e.offsetX, e.offsetY));

    self.refresh();
  });
  goog.events.listen(this.canvas, goog.events.EventType.MOUSEUP, function(e){
    var size = self.size.min;

    self.leftDrag = false;
    self.size = self.pointToSize_(new goog.math.Coordinate(e.offsetX, e.offsetY));

    self.refresh();
  });
  goog.events.listen(this.canvas, goog.events.EventType.MOUSEMOVE, function(e){
    if (self.leftDrag) {
      self.size = self.pointToSize_(new goog.math.Coordinate(e.offsetX, e.offsetY));

      self.refresh();
    }
  });
  goog.events.listen(this.canvas, goog.events.EventType.MOUSEOUT, function(e){
    if (self.leftDrag) {
      self.leftDrag = false;
      self.size = self.pointToSize_(new goog.math.Coordinate(e.offsetX, e.offsetY));

      self.refresh();
    }
  });
};

/**
 * @param {goog.math.coordinate} point
 * @private
 */
application.Diceros.SizerWindow.prototype.pointToSize_ = function(point) {
  var center = new goog.math.Coordinate(this.width / 2, this.height / 2);

  return goog.math.Coordinate.distance(center, point);
};


/**
 * ルートノードの作成
 */
application.Diceros.SizerWindow.prototype.createDom = function() {
  this.element = goog.dom.createElement('div');

  this.decorateInternal(this.element);

  this.refresh();
};

/**
 * resize
 */
application.Diceros.SizerWindow.prototype.resize = function(size) {
  this.width = size.width;
  this.height = size.height;

  this.refresh();
};

/**
 *
 */
application.Diceros.SizerWindow.prototype.refresh = function() {
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
