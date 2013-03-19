goog.provide('Diceros.SVGLayer');

goog.require('Diceros.VectorLayer');

goog.scope(function() {

/**
 * SVG レイヤー実装
 * @extends {Diceros.VectorLayer}
 * @constructor
 */
Diceros.SVGLayer = function(app) {
  goog.base(this, app);
  /**
   * クラス名
   * @type {string}
   */
  this.name = 'SVGLayer';
  // TODO
  this.svgPaths = [];
};
goog.inherits(
  Diceros.SVGLayer,
  Diceros.VectorLayer
);

Diceros.SVGLayer.SVGNS = "http://www.w3.org/2000/svg";

Diceros.SVGLayer.prototype.init = function() {
  this.canvas = this.ctx = document.createElementNS(Diceros.SVGLayer.SVGNS, 'svg');

  this.canvas.setAttribute("width", this.app.width);
  this.canvas.setAttribute("height", this.app.height);

  goog.style.setStyle(this.canvas, 'position', 'absolute');
};

Diceros.SVGLayer.prototype.getOverlayContext = function() {
  return this.app.windows[this.app.currentCanvasWindow].overlay.ctx;
};

/**
 * 新しい線をオーバーレイから本バッファに描画する
 */
Diceros.SVGLayer.prototype.drawNewline = function() {
  /** @type {number} */
  var lineIndex = this.currentLine;
  /** @type {Diceros.Line} */
  var line = this.lines[lineIndex];
  /** @type {Diceros.LinePath} */
  var path = this.outlinePath;
  /** @type {CanvasRenderingContext2D} */
  var overlay = this.getOverlayContext();

  // optimization
  if (typeof line.optimize === 'function') {
    line.optimize(this.app.toolbar.lineOptimization.getValue() | 0);
  }

  // clear outline
  if (path) {
    overlay.clearRect(path.x - 2, path.y - 2, path.width + 4, path.height + 4);
    this.outlinePath = null;
  }

  // draw new line
  path = this.paths[lineIndex] = line.path();
  if (path) {
    this.svgPaths[lineIndex] = document.createElementNS(Diceros.SVGLayer.SVGNS, "path");
    path.drawToSVGPath(this.svgPaths[lineIndex]);
    this.canvas.appendChild(this.svgPaths[lineIndex]);
  }
};

/**
 * 線を選択したときに前後のバッファを作成する
 */
Diceros.SVGLayer.prototype.selectLine = function() {
};

/**
 * 現在の線を前後のバッファとあわせて描画しなおす
 */
Diceros.SVGLayer.prototype.refreshCurrentLine = function() {
  var lineIndex = this.currentLine;
  /** @type {Diceros.Line} */
  var line = this.lines[this.currentLine];

  // draw new line
  var path = this.paths[this.currentLine] = line.path();
  if (path) {
    this.svgPaths[lineIndex].removeAttributeNS(Diceros.SVGLayer.SVGNS, 'd');
    path.drawToSVGPath(this.svgPaths[lineIndex]);
  }
};


/**
 * 制御点の表示を消す
 */
Diceros.SVGLayer.prototype.clearCtrlPoint =
function() {
  var ctx = this.getOverlayContext();

  ctx.clearRect(0, 0, this.app.width, this.app.height);
};


/**
 * 制御点のアタリ判定
 * @param {number} x 判定する制御点の X 座標.
 * @param {number} y 判定する制御点の Y 座標.
 * @param {number=} opt_width 判定する制御点の大きさ.
 * @return {?Object} 線と制御点の index を含む Object か null.
 */
Diceros.SVGLayer.prototype.checkCtrlPoint = function(x, y, opt_width) {
  var ctx = this.getOverlayContext();

  if (typeof opt_width !== 'number') {
    opt_width = 5;
  }

  // 新しい制御点から判定するため index は後ろからたどる
  for (var i = 0, il = this.lines.length; i < il; i++) {
    var lineIndex = il - i - 1,
        line = this.lines[lineIndex].getCtrlPoints();

    for (var j = 0, jl = line.length; j < jl; j++) {
      var pointIndex = jl - j - 1,
          point = line[pointIndex];

      ctx.beginPath();
      ctx.arc(
        point.x | 0,
        point.y | 0,
        opt_width,
        0,
        Math.PI * 2,
        false
      );

      if (!ctx.isPointInPath(x, y)) {
        continue;
      }

      return {
        lineIndex: lineIndex,
        pointIndex: pointIndex
      };
    }
  }

  return null;
};

Diceros.SVGLayer.fromObject = function(app, obj) {
  var layer;
  var lines;
  var paths;
  var svgPaths;
  var data = obj['data'];
  var path;
  var i;
  var il;

  layer = new Diceros.SVGLayer(app);
  layer.lines = lines = new Array(data.length);
  layer.paths = paths = new Array(data.length);
  layer.svgPaths = svgPaths = new Array(data.length);

  layer.init();

  for (i = 0, il = data.length; i < il; ++i) {
    switch (data[i]['type']) {
      case 'BezierAGG':
        lines[i] = Diceros.BezierAGG.fromObject(data[i]);
        path = paths[i] = lines[i].path();
        svgPaths[i] = document.createElementNS(Diceros.SVGLayer.SVGNS, "path");
        path.drawToSVGPath(svgPaths[i]);
        layer.canvas.appendChild(svgPaths[i]);
        break;
      default:
        throw new Error('unknown line type');
    }
  }

  return layer;
};

// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
