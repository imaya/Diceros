goog.provide('Diceros.BezierAGG');

goog.require('Diceros.Line');
goog.require('Diceros.LinePath');

goog.scope(function() {

/**
 * ベジェ曲線の作成
 * 制御点の設定は AGG Project の手法を使用する
 * http://www.antigrain.com/research/bezier_interpolation/index.html
 * @extends Diceros.Line
 * @constructor
 * @param {string=} opt_color 線の描画色.
 */
Diceros.BezierAGG = function(opt_color) {
  goog.base(this, opt_color);

  this.name = 'BezierAGG';
  this.curveCtrlPoints = []; // ベジェ曲線用の制御点
  this.subCtrlPoints = []; // 途中計算用の制御点
  this.color = opt_color || '';

  // AGG Project のページに記載されている倍率パラメータ
  // 小さいほど制御点を鋭く通過するようになる
  // XXX: 変更可能にする
  this.smoothness = 0.75;
};
goog.inherits(Diceros.BezierAGG, Diceros.Line);

/**
 * 90度はよく使うので定数化しておく
 * @const
 * @type {number}
 */
Diceros.BezierAGG.MATH_PI_HALF = Math.PI / 2;

/**
 * 制御点の追加
 * @param {Diceros.Point} point 追加する制御点.
 * @return {number} 追加した制御点のindex.
 */
Diceros.BezierAGG.prototype.addControlPoint = function(point) {
  var index = this.ctrlPoints.length;

  this.ctrlPoints.push(point);
  this.curveCtrlPoints[index] = null;
  this.subCtrlPoints[index] = null;

  // 直前の線にも影響するため補助制御点は削除する
  if (index >= 1) {
    this.curveCtrlPoints[index-1] = null;
    this.subCtrlPoints[index-1] = null;
  }
  if (index >= 2) {
    this.curveCtrlPoints[index-2] = null;
    this.subCtrlPoints[index-2] = null;
  }

  return index;
};


/**
 * 制御点の削除
 * @param {number} index 削除する制御点の index.
 */
Diceros.BezierAGG.prototype.removeControlPoint = function(index) {
  var ctrlPoints = this.ctrlPoints;
  var curveCtrlPoints = this.curveCtrlPoints;
  var subCtrlPoints = this.subCtrlPoints;

  ctrlPoints.splice(index, 1);
  curveCtrlPoints.splice(index, 1);
  subCtrlPoints.splice(index, 1);

  // XXX: 未テスト
  if (index >= 2){
    curveCtrlPoints[index - 2] = null;
    subCtrlPoints[index - 2] = null;
  }
  if (index >= 1){
    curveCtrlPoints[index - 1] = null;
    subCtrlPoints[index - 1] = null;
  }
  if (index < subCtrlPoints.length - 1) {
    curveCtrlPoints[index + 1] = null;
    subCtrlPoints[index + 1] = null;
  }
  curveCtrlPoints[index] = null;
  subCtrlPoints[index] = null;
};


/**
 * 制御点の変更
 * @param {number} index 変更する制御点の index.
 * @param {Diceros.Point} point 新しい制御点の位置.
 */
Diceros.BezierAGG.prototype.updateControlPoint = function(index, point) {
  var ctrlPoints = this.ctrlPoints;
  var curveCtrlPoints = this.curveCtrlPoints;
  var subCtrlPoints = this.subCtrlPoints;

  if (index >= 2){
    curveCtrlPoints[index - 2] = null;
    subCtrlPoints[index - 2] = null;
  }
  if (index >= 1){
    curveCtrlPoints[index - 1] = null;
    subCtrlPoints[index - 1] = null;
  }
  if (index < this.subCtrlPoints.length - 1) {
    curveCtrlPoints[index + 1] = null;
    subCtrlPoints[index + 1] = null;
  }
  curveCtrlPoints[index] = null;
  subCtrlPoints[index] = null;

  ctrlPoints.splice(index, 1, point);
};


/**
 * アウトラインのパスを求める.
 * @param {number=} opt_width 幅を固定する場合は指定する.
 * @param {string=} opt_color 色を固定する場合は指定する.
 * @return {Diceros.LinePath} 描画コンテキスト.
 */
Diceros.BezierAGG.prototype.outline = function(opt_width, opt_color) {
  // TODO
  var data = this.ctrlPoints,
    ctrlPoints = this.getCtrlPointsAGG_(data, this.curveCtrlPoints);
  /** @type {number} */
  var width;
  /** @type {number} */
  var x;
  /** @type {number} */
  var y;
  /** @type {number} */
  var minX = Infinity;
  /** @type {number} */
  var maxX = -Infinity;
  /** @type {number} */
  var minY = Infinity;
  /** @type {number} */
  var maxY = -Infinity;
  /** @type {CanvasRenderingContext2D} */
  var ctx = /** @type {CanvasRenderingContext2D} */(new Diceros.LinePath());

  if (data.length < 1) {
    return null;
  }

  ctx.color = opt_color || this.color;

  ctx.beginPath();
  x = data[0].x + 0.5 | 0; y = data[0].y + 0.5 | 0;
  ctx.moveTo(x, y);

  // update area
  if (x < minX) { minX = x; } if (x > maxX) { maxX = x; }
  if (y < minY) { minY = y; } if (y > maxY) { maxY = y; }

  // 描画
  for (var li = 1, ll = data.length; li < ll; li++) {
    var prev = data[li - 1],
        point = data[li],
        cp = ctrlPoints[li - 1];

    width = (opt_width !== void 0) ? opt_width : prev.width + point.width;

    // update area
    x = prev.x + 0.5 | 0; y = prev.y + 0.5 | 0;
    if (x - width < minX) { minX = x - width; } if (x + width > maxX) { maxX = x + width; }
    if (y - width < minY) { minY = y - width; } if (y + width > maxY) { maxY = y + width; }
    x = point.x + 0.5 | 0; y = point.y + 0.5 | 0;
    if (x - width < minX) { minX = x - width; } if (x + width > maxX) { maxX = x + width; }
    if (y - width < minY) { minY = y - width; } if (y + width > maxY) { maxY = y + width; }

    switch (cp.length) {
    case 0:
      ctx.lineTo(point.x + 0.5 | 0, point.y + 0.5 | 0);
      break;
    case 2:
      ctx.bezierCurveTo(
        cp[0].x + 0.5 | 0, cp[0].y + 0.5 | 0,
        cp[1].x + 0.5 | 0, cp[1].y + 0.5 | 0,
        point.x + 0.5 | 0, point.y +0.5 | 0
      );

      // update area
      x = cp[0].x + 0.5 | 0; y = cp[0].y + 0.5 | 0;
      if (x - width < minX) { minX = x - width; } if (x + width > maxX) { maxX = x + width; }
      if (y - width < minY) { minY = y - width; } if (y + width > maxY) { maxY = y + width; }
      x = cp[1].x + 0.5 | 0; y = cp[1].y + 0.5 | 0;
      if (x - width < minX) { minX = x - width; } if (x + width > maxX) { maxX = x + width; }
      if (y - width < minY) { minY = y - width; } if (y + width > maxY) { maxY = y + width; }
      break;
    default:
      throw 'invalid control points';
    }

    if (opt_width === void 0) {
      ctx.lineWidth = prev.width + point.width;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x | 0, point.y | 0);
    }
  }

  if (opt_width !== void 0) {
    ctx.lineWidth = opt_width | 0;
    ctx.stroke();
  }

  ctx.x = minX;
  ctx.y = minY;
  ctx.width = maxX - minX;
  ctx.height = maxY - minY;

  return /** @type {Diceros.LinePath} */(minX === Infinity ? null : ctx);
};


/**
 * 描画
 * @param {string=} opt_color 色を指定する.
 * @return {?Diceros.LinePath}
 */
Diceros.BezierAGG.prototype.path = function(opt_color) {
  var data = this.ctrlPoints,
      ctrlPoints = this.getCtrlPointsAGG_(data, this.curveCtrlPoints),
      bezierLines = [[], []], // 素のベジェ曲線パラメータを入れておく箱
      point, next, cp;
  var minX = Infinity;
  var maxX = -Infinity;
  var minY = Infinity;
  var maxY = -Infinity;
  var x;
  var y;
  var radius;
  var cp1;
  var cp2;
  /** @type {CanvasRenderingContext2D} */
  var ctx = /** @type {CanvasRenderingContext2D} */(new Diceros.LinePath());

  ctx.color = opt_color || this.color;

  // 描画
  ctx.beginPath();

  // 点と直線はそのまま描画する
  if (data.length === 1) {
    point = data[0];

    ctx.moveTo(point.x + point.width, point.y);
    ctx.arc(point.x, point.y, point.width, 0, 7, false);
    ctx.fill();

    ctx.x = point.x - point.width;
    ctx.y = point.y - point.width;
    ctx.width = ctx.height = point.width * 2;

    return /** @type {Diceros.LinePath} */(ctx);
  } else if (data.length === 2) {
    point = data[0];
    next = data[1];

    radius = Math.atan2(next.y - point.y, next.x - point.x);
    while (radius < Math.PI / 2) {
      radius += Math.PI * 2;
    }
    ctx.moveTo(
      point.x + point.width * Math.cos(radius - Math.PI / 2),
      point.y + point.width * Math.sin(radius - Math.PI / 2)
    );
    ctx.arc(point.x, point.y, point.width, radius - Math.PI / 2, radius + Math.PI / 2, true);
    ctx.lineTo(
      next.x + next.width * Math.cos(radius + Math.PI / 2),
      next.y + next.width * Math.sin(radius + Math.PI / 2)
    );
    ctx.arc(next.x, next.y, next.width, radius + Math.PI / 2, radius - Math.PI / 2, true);
    ctx.lineTo(
      point.x + point.width * Math.cos(radius - Math.PI / 2),
      point.y + point.width * Math.sin(radius - Math.PI / 2)
    );

    ctx.fill();

    minX = point.x - point.width;
    (x = next.x - next.width) < minX && (minX = x);
    maxX = point.x + point.width;
    (x = next.x + next.width) > maxX && (maxX = x);
    minY = point.y - point.width;
    (y = next.y - next.width) < minY && (minY = y);
    maxY = point.x + point.width;
    (y = next.y + next.width) > maxY && (maxY = y);
    ctx.x = minX;
    ctx.y = minY;
    ctx.width = maxX - minX;
    ctx.height = maxY - minY;

    return /** @type {Diceros.LinePath} */(ctx);
  }

  /*
  // 始点、終点の描画
  for (var i = 0, l = data.length; i < l; i++) {
    // これは A-B-C という位置関係の時、AB 上に C があるか BC 上に A がある場合に
    // B が欠けてしまう
    // その対処として全ての点を描画することが有効だが、太さが大きすぎた場合、
    // 線の一部に円がはっきりとみえるようになってしまう
    // 将来的にはなんとかする必要があるが、現状は妥協する。
    // ( arcTo を使えば解決できそうな気がするが、今のところ深く考えていない)
    if (i !== 0 && i !== l - 1) {
      continue;
    }
    point = data[i];
    ctx.moveTo(point.x, point.y);
    ctx.arc(point.x, point.y, point.width, 0, 7, false); // 7 > 2 * Math.PI
  }*/

  // 線の計算
  for (var i = 0, l = data.length - 1; i < l; i++) {
    point = data[i],
    next = data[i+1];
    cp = ctrlPoints[i];

    // 同じ座標に 2 点以上ある際に線がおかしくなるのを抑制する
    // XXX: magic number
    if (Math.abs(point.x - next.x) < 0.5 && Math.abs(point.y - next.y) < 0.5) {
      continue;
    }

    switch (cp.length) {
    case 2:
      this.drawBezierSegmentAGG_(
        point, cp[0], cp[1], next, i, bezierLines
      );
      break;
    }
  }

  // まとめて描画
  var prev = null;
  for (var i = 0, il = bezierLines.length; i < il; i++) {
    var lines = bezierLines[i];

    for (var j = 0, jl = lines.length; j < jl; j++) {
      var line = lines[j];

      if (j === 0) {
        var prevPoint, rad;

        // 曲線の最初の点を描画
        if (i === 0) {
          var prevLines = bezierLines[il-1],
              prevLine = prevLines[prevLines.length-1];

          prevPoint = prevLine.end;
          rad = Math.atan2(
            prevPoint.y - line.start.y,
            prevPoint.x - line.start.x
          );
          ctx.moveTo(prevPoint.x, prevPoint.y);
        } else {
          prevPoint = prev.end;
          rad = Math.atan2(
            prevPoint.y - line.start.y,
            prevPoint.x - line.start.x
          );
        }
        x = (prevPoint.x + line.start.x) / 2;
        y = (prevPoint.y + line.start.y) / 2;
        radius = this.pythagorean_(prevPoint, line.start) / 2;

        // update copy area
        if (x - radius < minX) { minX = x - radius; }
        if (x + radius > maxX) { maxX = x + radius; }
        if (y - radius < minY) { minY = y - radius; }
        if (y + radius > maxY) { maxY = y + radius; }

        ctx.arc(x, y, radius, rad, rad + Math.PI, true);
      }

      cp1 = line.cp[0];
      cp2 = line.cp[1];
      x = line.end.x;
      y = line.end.y;

      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, x, y);

      // update copy area
      if (cp1.x < minX) { minX = cp1.x; } if (cp1.x > maxX) { maxX = cp1.x; }
      if (cp1.y < minY) { minY = cp1.y; } if (cp1.y > maxY) { maxY = cp1.y; }
      if (cp2.x < minX) { minX = cp2.x; } if (cp2.x > maxX) { maxX = cp2.x; }
      if (cp2.y < minY) { minY = cp2.y; } if (cp2.y > maxY) { maxY = cp2.y; }
      if (    x < minX) { minX =     x; } if (    x > maxX) { maxX =     x; }
      if (    y < minY) { minY =     y; } if (    y > maxY) { maxY =     y; }

      prev = line;
    }
  }

  ctx.fill();

  ctx.x = minX;
  ctx.y = minY;
  ctx.width = maxX - minX;
  ctx.height = maxY - minY;

  return /** @type {Diceros.LinePath} */(minX === Infinity ? null : ctx);
};


/**
 * ベジェ曲線の一部を描画
 * @param {Diceros.Point} s 始点.
 * @param {Diceros.Point} c1 制御点1.
 * @param {Diceros.Point} c2 制御点2.
 * @param {Diceros.Point} e 終点.
 * @param {number} index 補助制御点のindex.
 * @param {Array.<Object>} bezierLines 描画すべきベジェ曲線を保持しておくパラメータ配列.
 * @private
 */
Diceros.BezierAGG.prototype.drawBezierSegmentAGG_ =
function(s, c1, c2, e, index, bezierLines) {
  var line1, line2, tmp, cps1, cps2, scps, endAngle1, endAngle2;

  // 分割した制御点などを計算する
  // 計算済みの場合はキャッシュを使用する
  scps = (typeof this.subCtrlPoints[index] === 'object') ?
     this.subCtrlPoints[index] : null;

  if (scps === null) {
    tmp = this.getBezierSegmentAGG_(s, c1, c2, e, 0);
    line1 = tmp.line1;
    line2 = tmp.line2;
    endAngle1 = tmp.endAngle1;
    endAngle2 = tmp.endAngle2;
    cps1 = this.getCtrlPointsAGG_(line1, []);
    cps2 = this.getCtrlPointsAGG_(line2, []);

    this.subCtrlPoints[index] = {
      line1: line1,
      line2: line2,
      cps1: cps1,
      cps2: cps2,
      endAngle1: endAngle1,
      endAngle2: endAngle2
    };
  } else {
    line1 = scps.line1;
    line2 = scps.line2;
    cps1 = scps.cps1;
    cps2 = scps.cps2;
  }

  // 描画すべきベジェ曲線を配列に入れていく
  for (var i = 0, l = line1.length - 1; i < l; i++) {
    var point1 = line1[i], point2 = line2[i],
        next1 = line1[i+1], next2 = line2[i+1],
        cp1 = cps1[i], cp2 = cps2[i];

    if (cp1.length === 2) {
      bezierLines[0].push({
        start: point1,
        end: next1,
        cp: cp1
      });
    }

    if (cp2.length === 2) {
      bezierLines[1].unshift({
        start: next2,
        end: point2,
        cp: [cp2[1], cp2[0]]
      });
    }
  }
};


/**
 * 点の配列から制御点を計算して取得する
 * @param {Array.<Diceros.Point>} data 点の配列.
 * @param {Array} ctrlPoints 操作対象の制御点配列.
 * @return {Array} 制御点の配列.
 * @private
 */
Diceros.BezierAGG.prototype.getCtrlPointsAGG_ = function(data, ctrlPoints) {
  for (var i = 0, l = data.length; i < l; i++) {
    if (!(ctrlPoints[i] instanceof Array)) {
      ctrlPoints[i] = [];
    }
    this.getCtrlPointAGG_(data, i, ctrlPoints);
  }

  return ctrlPoints;
};


/**
 * 点の配列から指定した点の制御点を計算する
 * @param {Array.<Diceros.Point>} data 点の配列.
 * @param {number} index 対象となる index.
 * @param {Array} ctrlPoints 操作対象の制御点配列.
 * @private
 */
Diceros.BezierAGG.prototype.getCtrlPointAGG_ =
function(data, index, ctrlPoints) {
  var i = index,
      l = data.length,
      l1, // P1 - P2 の長さ
      l2, // P2 - P3 の長さ
      c1, // P1 - P2 の中点
      c2, // P2 - P3 の中点
      ctrl1, ctrl2, // 制御点
      centerLength, centerRad, tmp, rate;

  // 範囲外はスキップ
  if (i < 1 || i >= l - 1) {
    return;
  }

  // 中点を求める

  // 三平方の定理で P1-P2, P2-P3 の長さを求める
  l1 = this.pythagorean_(data[i-1], data[i]);
  l2 = this.pythagorean_(data[i], data[i+1]);

  // P1-P2 の中点と P2-P3 の中点を結ぶ線の長さを求める
  c1 = this.getCenterPoint_(data[i-1], data[i]);
  c2 = this.getCenterPoint_(data[i], data[i+1]);

  // P1-P2 中点 - P2-P3 中点 を結ぶ線の長さと角度を求める
  centerLength = this.pythagorean_(c1, c2);
  centerRad = Math.atan2(c2.y - c1.y, c2.x - c1.x);

  // 制御点の計算
  // XXX: この辺は三角関数を使わなくても調整できるカモ。
  tmp = (l1 + l2 === 0) ? 0 : centerLength / (l1 + l2);
  rate = this.getRate_(centerRad);
  ctrl1 = new Diceros.Point(
    data[i].x - (rate.x * tmp * l1) * this.smoothness,
    data[i].y - (rate.y * tmp * l1) * this.smoothness,
    null
  );
  ctrl2 = new Diceros.Point(
    data[i].x + (rate.x * tmp * l2) * this.smoothness,
    data[i].y + (rate.y * tmp * l2) * this.smoothness,
    null
  );

  // 最初の場合と最後の場合は2次ベジェ曲線を3次ベジェ曲線に変換する
  if (i === 1 && i === l - 2) {
    ctrlPoints[i-1] = this.convertBezier_(data[i-1], ctrl1, data[i]);
    ctrlPoints[i] = this.convertBezier_(data[i], ctrl2, data[i+1]);
  } else if (i === 1) {
    ctrlPoints[i-1] = this.convertBezier_(data[i-1], ctrl1, data[i]);
    ctrlPoints[i][0] = ctrl2;
  } else if (i === l - 2) {
    ctrlPoints[i-1][1] = ctrl1;
    ctrlPoints[i] = this.convertBezier_(data[i], ctrl2, data[i+1]);
  } else {
    ctrlPoints[i-1][1] = ctrl1;
    ctrlPoints[i][0] = ctrl2;
  }

  return;
};


/**
 * 中点を求める
 * @param {Diceros.Point} p1 点1.
 * @param {Diceros.Point} p2 点2.
 * @return {Diceros.Point} p1 と p2 の中点.
 * @private
 */
Diceros.BezierAGG.prototype.getCenterPoint_ = function(p1, p2) {
  return new Diceros.Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, null);
};


/**
 * 角度から X, Y の倍率を求める
 * @param {number} rad 角度.
 * @return {Diceros.Point} x, y それぞれの倍率.
 * @private
 */
Diceros.BezierAGG.prototype.getRate_ = function(rad) {
  return new Diceros.Point(Math.cos(rad), Math.sin(rad), null);
};


/**
 * ベジェ曲線を分割する際の中継点を計算
 * @param {Diceros.Point} s 始点.
 * @param {Diceros.Point} c1 制御点1.
 * @param {Diceros.Point} c2 制御点2.
 * @param {Diceros.Point} e 終点.
 * @param {number} depth 再帰の深さ.
 * @param {Array=} opt_l1 再帰で使用する変数.
 * @param {Array=} opt_l2 再帰で使用する変数.
 * @return {Object} 中継点アウトラインの制御点配列.
 * @private
 */
Diceros.BezierAGG.prototype.getBezierSegmentAGG_ =
function(s, c1, c2, e, depth, opt_l1, opt_l2) {
  var sRad = Math.atan2(c1.y - s.y, c1.x - s.x), // 始点から制御点1への角度
      eRad = Math.atan2(e.y - c2.y, e.x - c2.x), // 制御点2から終点への角度
      tRad, // tに対応するベジェ曲線上の点の接線の角度
      tSC1, // 始点-制御点1上の点(1)
      tC1C2, // 制御点1-制御点2上の点(2)
      tC2E, // 制御点2-終点上の点(3)
      tSC1C1C2, // (1)-(2)上の点
      tC1C2C2E, // (2)-(3)上の点
      r, // tに対応するベジェ曲線上の点
      t, // ベジェ曲線のパラメータ
      width, // 線の太さ
      tS1, tS2, tE1, tE2, // 太さを考慮した分割した各点
      line1 = (opt_l1 || []), line2 = (opt_l2 || []),
      l1pos = line1.length, l2pos = line2.length,
      left, right; // 左右に分割した際の補助制御点

  if (!depth) {
    depth = 0;
  }

  // XXX: magic number
  if (depth > 8) {
    return {line1: line1, line2: line2};
  }

  // 初回だったら終点を加える
  if (depth === 0) {
    line1[l1pos++] = new Diceros.Point(
        s.x + Math.cos(sRad + Diceros.BezierAGG.MATH_PI_HALF) * s.width,
        s.y + Math.sin(sRad + Diceros.BezierAGG.MATH_PI_HALF) * s.width,
        null
    );
    line2[l2pos++] = new Diceros.Point(
        s.x + Math.cos(sRad - Diceros.BezierAGG.MATH_PI_HALF) * s.width,
        s.y + Math.sin(sRad - Diceros.BezierAGG.MATH_PI_HALF) * s.width,
        null
    );
  }

  // 初回か、閾値よりも急な角度だったら半分に分割
  // XXX: magic number
  if (depth === 0 || Math.abs(eRad - sRad) > Math.PI * 5 / 180) {

    t = 0.5; // XXX: 中心固定で良い？

    width = s.width + (e.width - s.width) * t;
    tSC1 = this.getBezierPoint_(s, c1, t);
    tC1C2 = this.getBezierPoint_(c1, c2, t);
    tC2E = this.getBezierPoint_(c2, e, t);
    tSC1C1C2 = this.getBezierPoint_(tSC1, tC1C2, t);
    tC1C2C2E = this.getBezierPoint_(tC1C2, tC2E, t);
    tRad = Math.atan2(tC1C2C2E.y - tSC1C1C2.y, tC1C2C2E.x - tSC1C1C2.x);
    r = this.getBezierPoint_(tSC1C1C2, tC1C2C2E, t, width);

    left = this.getBezierSegmentAGG_(s, tSC1, tSC1C1C2, r, depth + 1, line1, line2);
    //Array.prototype.push.apply(line1, left.line1);
    //Array.prototype.push.apply(line2, left.line2);
    l1pos = line1.length;
    l2pos = line2.length;

    line1[l1pos++] = new Diceros.Point(
        r.x + Math.cos(tRad + Diceros.BezierAGG.MATH_PI_HALF) * r.width,
        r.y + Math.sin(tRad + Diceros.BezierAGG.MATH_PI_HALF) * r.width,
        null
    );
    line2[l2pos++] = new Diceros.Point(
        r.x + Math.cos(tRad - Diceros.BezierAGG.MATH_PI_HALF) * r.width,
        r.y + Math.sin(tRad - Diceros.BezierAGG.MATH_PI_HALF) * r.width,
        null
    );

    right = this.getBezierSegmentAGG_(r, tC1C2C2E, tC2E, e, depth + 1, line1, line2);
    l1pos = line1.length;
    l2pos = line2.length;
  }

  // 初回だったら終点を加える
  if (depth === 0) {
    line1[l1pos++] = new Diceros.Point(
        e.x + Math.cos(eRad + Diceros.BezierAGG.MATH_PI_HALF) * e.width,
        e.y + Math.sin(eRad + Diceros.BezierAGG.MATH_PI_HALF) * e.width,
        null
    );
    line2[l2pos++] = new Diceros.Point(
        e.x + Math.cos(eRad - Diceros.BezierAGG.MATH_PI_HALF) * e.width,
        e.y + Math.sin(eRad - Diceros.BezierAGG.MATH_PI_HALF) * e.width,
        null
    );
  }

  return {
    line1: line1,
    line2: line2,
    endAngle1: eRad + Diceros.BezierAGG.MATH_PI_HALF,
    endAngle2: eRad - Diceros.BezierAGG.MATH_PI_HALF
  };
};

/**
 * @param {number} param optimize parameter.
 */
Diceros.BezierAGG.prototype.optimize = function(param) {
  var ctrlPoints = this.ctrlPoints;
  var curvePoints = this.curveCtrlPoints;
  var i;
  var optimizeValue;
  var prev = ctrlPoints.length;

  if (param === 0) {
    return;
  }

  for (i = 0; i < ctrlPoints.length - 2;) {
    optimizeValue = this.checkline(
      ctrlPoints[i], ctrlPoints[i+1], ctrlPoints[i+2],
      curvePoints[i][0], curvePoints[i][1],
      curvePoints[i+1][0], curvePoints[i+1][1],
      param
    );
    if (optimizeValue.removal) {
      ctrlPoints.splice(i + 1, 1);
      curvePoints.splice(i + 1, 1);
      curvePoints[i][0] = optimizeValue.newCtrlPoint1;
      curvePoints[i][1] = optimizeValue.newCtrlPoint2;
    } else {
      i++;
    }
  }

  if (ctrlPoints.length < prev) {
    this.subCtrlPoints = [];
  }
};

/**
 * @param {number} dist 補正パラメータ.
 * @param {Diceros.Point} p0 ベジェ曲線上の点1.
 * @param {Diceros.Point} p1 ベジェ曲線上の点2.
 * @param {Diceros.Point} p2 ベジェ曲線上の点3.
 * @return {!{removal: boolean}} 削除可能ならば removal は true となる.
 * curveCtrlPoints... 制御点
 * ctrlPoints... ベジェ曲線上の点
 */
Diceros.BezierAGG.prototype.checkRemoval =
function(dist, p0, p1, p2, cp00, cp01, cp10, cp11) {
  /** @type {number} */
  var edge0 = this.pythagorean_(p1, cp01);
  /** @type {number} */
  var edge1 = this.pythagorean_(p1, cp10);
  /** @type {number} */
  var t = edge0 === 0 ? 0 : edge0 / (edge0 + edge1);
  /** @type {Diceros.Point} */
  var cp02;
  /** @type {Diceros.Point} */
  var cp12;
  /** @type {Diceros.Point} */
  var p3;
  /** @type {Diceros.Point} */
  var p4;
  /** @type {Diceros.Point} */
  var p5;
  /** @type {Diceros.Point} */
  var p6;
  /** @type {boolean} */
  var removal;

  // invalid parameter
  if (t === 0 || t === 1) {
    return {removal: false};
  }

  cp02 = new Diceros.Point(
    p0.x + (cp00.x - p0.x) / t,
    p0.y + (cp00.y - p0.y) / t,
    null
  );
  cp12 = new Diceros.Point(
    p2.x + (cp11.x - p2.x) / (1 / t),
    p2.y + (cp11.y - p2.y) / (1 / t),
    null
  );

  p3 = this.getBezierPoint_(cp02, cp12, t);
  p4 = this.getBezierPoint_(cp00, p3, t);
  p5 = this.getBezierPoint_(p3, cp11, t);
  p6 = this.getBezierPoint_(p4, p5, t);

  // TODO: width も t:1-s に収まっているか調べる
  removal =
    this.pythagorean_(p6, p1) < dist &&
    this.pythagorean_(p4, cp01) < dist &&
    this.pythagorean_(p5, cp10) < dist;

  return {
    removal: removal,
    newCtrlPoint1: cp02,
    newCtrlPoint2: cp12
  };
};

/**
 * p1-p2, p3-p4 の交点を返す.
 * @param {Diceros.Point} p0 点1.
 * @param {Diceros.Point} p1 点2.
 * @param {Diceros.Point} p2 点3.
 * @param {Diceros.Point} p3 点4.
 * @return {Diceros.Point} 交点.
 */
Diceros.BezierAGG.prototype.calcCrossPoint = function(p0, p1, p2, p3) {
  /** @type {number} */
  var s1 = ((p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x)) / 2;
  /** @type {number} */
  var s2 = ((p3.x - p2.x) * (p2.y - p1.y) - (p3.y - p2.y) * (p2.x - p1.x)) / 2;

  return new Diceros.Point(
    p0.x + (p1.x - p0.x) * s1 / (s1 + s2),
    p0.y + (p1.y - p0.y) * s1 / (s1 + s2),
    null
  );
};

/**
 * 2点を結ぶ線分を t:1-t で分けた点を返す
 * @param {Diceros.Point} s 始点.
 * @param {Diceros.Point} e 終点.
 * @param {number} t ベジェ曲線のパラメータ t.
 * @param {number=} opt_width 点の太さ.
 * @return {Diceros.Point} s, e を t:1-t で分割した点.
 * @private
 */
Diceros.BezierAGG.prototype.getBezierPoint_ = function(s, e, t, opt_width) {
  return new Diceros.Point(
    s.x + (e.x - s.x) * t,
    s.y + (e.y - s.y) * t,
    (typeof opt_width === 'number') ? opt_width : null,
    true
  );
};


/**
 * 2次ベジェ曲線を3次ベジェ曲線に変換する
 * @param {Diceros.Point} s 始点.
 * @param {Diceros.Point} c1 制御点.
 * @param {Diceros.Point} e 終点.
 * @return {Array} 3次ベジェ曲線の2つの制御点を配列で返す.
 * @private
 */
Diceros.BezierAGG.prototype.convertBezier_ = function(s, c1, e) {
  return [
    new Diceros.Point(
      (s.x + c1.x * 2) / 3,
      (s.y + c1.y * 2) / 3,
      null
    ),
    new Diceros.Point(
      (e.x + c1.x * 2) / 3,
      (e.y + c1.y * 2) / 3,
      null
    )
  ];
};


/**
 * 三平方の定理で2点を両端とする線分の長さを計算する
 * @param {Diceros.Point} p1 始点.
 * @param {Diceros.Point} p2 終点.
 * @return {number} p1, p2 を両端とする線分の長さ.
 * @private
 */
Diceros.BezierAGG.prototype.pythagorean_ = function(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2)
  );
};

/**
 * @type {HTMLCanvasElement}
 */
Diceros.BezierAGG.BufferCanvas =
  /** @type {HTMLCanvasElement} */(document.createElement('canvas'));

/**
 * p1 が p0, p1 の曲線上にあり、省略可能かどうか判別する.
 * @param {Diceros.Point} p0 始点.
 * @param {Diceros.Point} p1 中継点.
 * @param {Diceros.Point} p2 終点.
 * @param {Diceros.Point} cp00 始点-中継点間の制御点1.
 * @param {Diceros.Point} cp01 始点-中継点間の制御点2.
 * @param {Diceros.Point} cp10 中継点-終点間の制御点1.
 * @param {Diceros.Point} cp11 中継点-終点間の制御点1.
 * @param {number} width 判別時のベジェ曲線の閾値.
 * @return {Object} 省略可能ならば removal プロパティに true がはいり、
 *     newControlPoint1, newControlPoint2 プロパティに新しい制御点がはいる.
 */
Diceros.BezierAGG.prototype.checkline = function(p0, p1, p2, cp00, cp01, cp10, cp11, width) {
  /** @type {CanvasRenderingContext2D} */
  var ctx =
    /** @type {CanvasRenderingContext2D} */
    (Diceros.BezierAGG.BufferCanvas.getContext('2d'));
  /** @type {number} */
  var edge0 = this.pythagorean_(p1, cp01);
  /** @type {number} */
  var edge1 = this.pythagorean_(p1, cp10);
  /** @type {number} */
  var t = edge0 === 0 ? 0 : edge0 / (edge0 + edge1);
  /** @type {Diceros.Point} */
  var cp02;
  /** @type {Diceros.Point} */
  var cp12;
  /** @type {Array.<Diceros.Point>} */
  var splitPoint = [
    this.splitBezier(p0, p1, cp00, cp01, 0.125),
    this.splitBezier(p0, p1, cp00, cp01, 0.25),
    this.splitBezier(p0, p1, cp00, cp01, 0.375),
    this.splitBezier(p0, p1, cp00, cp01, 0.50),
    this.splitBezier(p0, p1, cp00, cp01, 0.625),
    this.splitBezier(p0, p1, cp00, cp01, 0.75),
    this.splitBezier(p0, p1, cp00, cp01, 0.875),
    this.splitBezier(p1, p2, cp10, cp11, 0.125),
    this.splitBezier(p1, p2, cp10, cp11, 0.25),
    this.splitBezier(p1, p2, cp10, cp11, 0.375),
    this.splitBezier(p1, p2, cp10, cp11, 0.50),
    this.splitBezier(p1, p2, cp10, cp11, 0.625),
    this.splitBezier(p1, p2, cp10, cp11, 0.75),
    this.splitBezier(p1, p2, cp10, cp11, 0.875)
  ];
  /** @type {boolean} */
  var removal;
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;
  /** @type {number} */
  var radius;

  // invalid parameter
  if (t === 0 || t === 1) {
    return {removal: false};
  }

  cp02 = new Diceros.Point(
    p0.x + (cp00.x - p0.x) / t,
    p0.y + (cp00.y - p0.y) / t,
    null
  );
  cp12 = new Diceros.Point(
    p2.x + (cp11.x - p2.x) / (1 / t),
    p2.y + (cp11.y - p2.y) / (1 / t),
    null
  );

  // TODO
  var minX, minY, maxX, maxY;

  minX = Math.min(p0.x, p1.x, p2.x, cp00.x, cp01.x, cp02.x, cp10.x, cp11.x, cp12.x) - width;
  minY = Math.min(p0.y, p1.y, p2.y, cp00.y, cp01.y, cp02.y, cp10.y, cp11.y, cp12.y) - width;
  maxX = Math.max(p0.x, p1.x, p2.x, cp00.x, cp01.x, cp02.x, cp10.x, cp11.x, cp12.x) + width;
  maxY = Math.max(p0.y, p1.y, p2.y, cp00.y, cp01.y, cp02.y, cp10.y, cp11.y, cp12.y) + width;

  radius = Math.atan2(cp02.y - p0.y, cp02.x - p0.x);
  while (radius < Math.PI / 2) {
    radius += Math.PI * 2;
  }
  ctx.beginPath();
  ctx.moveTo(
    p0.x + width * Math.cos(radius - Math.PI / 2),
    p0.y + width * Math.sin(radius - Math.PI / 2)
  );
  ctx.arc(p0.x, p0.y, width, radius - Math.PI / 2, radius + Math.PI / 2, true);
  radius = Math.atan2(p2.y - cp12.y, p2.x - cp12.x);
  ctx.lineTo(
    p2.x + width * Math.cos(radius + Math.PI / 2),
    p2.y + width * Math.sin(radius + Math.PI / 2)
  );
  ctx.arc(p2.x, p2.y, width, radius + Math.PI / 2, radius - Math.PI / 2, true);
  ctx.closePath();

  for (removal = true, i = 0, il = splitPoint.length; i < il; ++i) {
    if (!ctx.isPointInPath(splitPoint[i].x, splitPoint[i].y)) {
      removal = false;
      break;
    }
  }
  if (removal) {
    return {
      removal: true,
      newCtrlPoint1: cp02,
      newCtrlPoint2: cp12
    };
  } else {
    return {
      removal: false
    };
  }
};

/**
 * ベジェ曲線を分割する点を返す.
 * @param {Diceros.Point} p0 start point.
 * @param {Diceros.Point} p1 end point.
 * @param {Diceros.Point} cp0 control point 1.
 * @param {Diceros.Point} cp1 control point 2.
 * @param {number} t bezier parameter.
 * @return {Diceros.Point} ベジェ曲線を t:1-t に分割する点
 */
Diceros.BezierAGG.prototype.splitBezier = function (p0, p1, cp0, cp1, t) {
  /** @type {Diceros.Point} */
  var cp00 = this.getBezierPoint_(p0, cp0, t);
  /** @type {Diceros.Point} */
  var cp01 = this.getBezierPoint_(cp0, cp1, t);
  /** @type {Diceros.Point} */
  var cp11 = this.getBezierPoint_(cp1, p1, t);
  /** @type {Diceros.Point} */
  var cp0001 = this.getBezierPoint_(cp00, cp01, t);
  /** @type {Diceros.Point} */
  var cp0111 = this.getBezierPoint_(cp01, cp11, t);

  return this.getBezierPoint_(cp0001, cp0111, t);
};

Diceros.BezierAGG.prototype.toObject = function() {
  return {
    'type': this.name,
    'color': this.color,
    'ctrlPoints': this.ctrlPoints
  }
};

Diceros.BezierAGG.fromObject = function(obj) {
  var line = new Diceros.BezierAGG(obj['color']);

  line.ctrlPoints = obj['ctrlPoints'];

  return line;
};


// end of scope
});

/* vim:set expandtab ts=2 sw=2 tw=80: */
