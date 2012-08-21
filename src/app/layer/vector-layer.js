goog.provide('Diceros.VectorLayer');

goog.require('Diceros.BezierAGG');
goog.require('Diceros.Layer');
goog.require('Diceros.Point');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.object');
goog.require('goog.style');


goog.scope(function() {

/**
 * ベクタレイヤー実装
 * @extends Diceros.Layer
 * @constructor
 */
Diceros.VectorLayer = function(app) {
  goog.base(this, app);
  //Diceros.Layer.call(this, app);

  /**
   * クラス名
   * @type {string}
   */
  this.name = 'VectorLayer';
  /**
   * 現在(ctrlなどで変化している時も含めて)の編集モード
   * @type {Diceros.VectorLayer.Mode}
   */
  this.mode = Diceros.VectorLayer.Mode.DEFAULT;
  /**
   * 現在(モードとして選択されている)の編集モード
   * @type {Diceros.VectorLayer.Mode}
   */
  this.baseMode = this.mode;
  /**
   * 全ての線
   * @type {Array.<Diceros.Line>}
   */
  this.lines = [];
  /**
   * 現在の編集中の線の index
   * @type {number}
   */
  this.currentLine = null;
  /**
   * 現在編集中の制御点
   * @type {Object}
   * XXX: 制御点クラスを作るか既存の Point クラスを使うか？
   */
  this.currentCtrlPoint = null;
  /**
   * 描画状況のバッファリスト
   * @type {Array.<Object>}
   */
  this.imageBuffers = [];
  /**
   * 各線の ImageData
   * @type {Array.<Object>}
   */
  this.lineBuffers = [];
  /**
   * 編集している線よりも前の線を記憶しておくバッファ
   * @type {Object}
   */
  this.frontBuffer = null;
  /**
   * 編集している線よりも後ろの線を記憶しておくバッファ
   * @type {Object}
   */
  this.backBuffer = null;
  /**
   * 最後にback/frontバッファを更新した際のバッファ
   */
  this.lastBuffer = null;
};
goog.inherits(
  Diceros.VectorLayer,
  Diceros.Layer
);

/**
 * 編集モード
 * @enum {number}
 */
Diceros.VectorLayer.Mode = {
  DEFAULT: 0,  // デフォルトモード (描画)
  EDIT: 1,  // 編集モード(制御点の移動)
  ADD: 2,  // TODO: 追加モード（制御点の追加）
  DELETE: 3  // TODO: 削除モード（制御点の削除）
};

/**
 * イベントハンドラ
 * @param {Event} event Eventオブジェクト.
 */
Diceros.VectorLayer.prototype.event = function(event) {
  var canvas = this.canvas,
      ctx = this.ctx,
      offset = goog.style.getPageOffset(event.target),
      x = event.event_.pageX - offset.x,
      y = event.event_.pageY - offset.y;

  if (canvas === null || ctx === null) {
    throw 'canvas not initialized';
  }

  //
  // 事前共通処理
  //


  //
  // XXX: まずmodeによる分岐を行った方がよいか？
  //
  switch (event.type) {
    case goog.events.EventType.KEYDOWN:
      break;
    case goog.events.EventType.KEYUP:
      break;
    case goog.events.EventType.MOUSEMOVE:
      this.x = x;
      this.y = y;

      // ドラッグ中
      if (this.app.getCurrentCanvasWindow().drag) {
        switch (this.mode) {
          // 線を描く
          case Diceros.VectorLayer.Mode.DEFAULT:
            this.sampling();
            this.refreshCurrentLineOutline();
            break;
          // 編集モードで点の移動中だったら線を描き直す
          case Diceros.VectorLayer.Mode.EDIT:
            if (this.currentCtrlPoint !== null) {
              var ctrlPoint = this.currentCtrlPoint;
              var currentLine = this.lines[this.currentLine];
              var width =
                (currentLine.getCtrlPoints())[ctrlPoint.pointIndex].width;

              currentLine.updateControlPoint(
                ctrlPoint.pointIndex,
                new Diceros.Point(x, y, width, true)
              );

              this.refreshCurrentLine();
            }
            break;
        }
        // 通常
      } else {
        this.updateCursor(x, y);
      }

      break;
    case goog.events.EventType.MOUSEDOWN:
      switch (this.mode) {
        case Diceros.VectorLayer.Mode.DEFAULT:
          var line, point, beforeLine; // XXX
          // 線のセットアップ
          this.save();

          line = new Diceros.BezierAGG();
          point = new Diceros.Point(x, y, this.getCurrentPenSize()); // XXX

          this.currentLine = this.lines.length;
          this.lines.push(line);
          line.addControlPoint(point);

          this.refreshBufferNewLine();
          this.refreshCurrentLineOutline();
          break;
        case Diceros.VectorLayer.Mode.EDIT:
          // 点の編集中だったら
          if (this.currentCtrlPoint !== null) {
            var ctrlPoint = this.currentCtrlPoint,
                line = this.lines[ctrlPoint.lineIndex],
                width = (line.getCtrlPoints())[ctrlPoint.pointIndex].width;

            this.currentLine = ctrlPoint.lineIndex;

            line.updateControlPoint(
                ctrlPoint.pointIndex,
                new Diceros.Point(x, y, width, true)
            );

            this.refreshBuffer(this.currentLine);
            this.refreshCurrentLine();
          }
          break;
      }

      break;
    case goog.events.EventType.MOUSEUP:
      switch (this.mode) {
        // 標準モード
        case Diceros.VectorLayer.Mode.DEFAULT:
          // NOP
          break;
        // 編集モード
        case Diceros.VectorLayer.Mode.EDIT:
          // 点の編集中だったらカーソル位置で現在の線を描き直す
          if (this.currentCtrlPoint !== null) {
            var ctrlPoint = this.currentCtrlPoint;
            var currentLine = this.lines[this.currentLine];
            var width =
              (currentLine.getCtrlPoints())[ctrlPoint.pointIndex].width;

            currentLine.updateControlPoint(
              ctrlPoint.pointIndex,
              new Diceros.Point(x, y, width, true)
            );

            this.refreshCurrentLine();
            this.pop(); // 保存バッファの切り捨て

            this.currentLine = null;
          }
          break;
      }

      break;
    case goog.events.MouseWheelHandler.EventType.MOUSEWHEEL:
      switch (this.mode) {
        // 標準モード
        case Diceros.VectorLayer.Mode.DEFAULT:
          break;
        // 編集モード
        case Diceros.VectorLayer.Mode.EDIT:
          if (this.currentCtrlPoint !== null) {
            var ctrlPoint = this.currentCtrlPoint;
            var currentLine = this.lines[ctrlPoint.lineIndex];
            var basePoint = (currentLine.getCtrlPoints())[ctrlPoint.pointIndex];
            var width = basePoint.width;
            var prevLine = this.currentLine;

            this.currentLine = ctrlPoint.lineIndex;

            // XXX: magic number
            if (event.deltaY < 0) {
              width += 1;
            }
            if (event.deltaY > 0) {
              width -= 1;
              if (width < 0.1) {
                width = 0.1;
              }
            }

            currentLine.updateControlPoint(
              ctrlPoint.pointIndex,
              new Diceros.Point(
                basePoint.x, basePoint.y, width, true
              )
            );

            this.refreshBuffer(this.currentLine);
            this.refreshCurrentLine();

            this.currentLine = prevLine;
          }
          break;
      }

      break;
    default:
      // NOP
  }

  //
  // 事後共通処理
  //
  // Ctrl を押している時は強制編集モード
  if (event.altKey) {
    this.mode = Diceros.VectorLayer.Mode.EDIT;
    this.drawCtrlPoint();
  } else {
    // Ctrlを押していないとき、ドラッグ中でなければ元のモードにもどる
    if (!this.app.getCurrentCanvasWindow().drag) {
      this.mode = this.baseMode;
      this.clearCtrlPoint();
    }
  }
};


/**
 * サンプリングを行う
 */
Diceros.VectorLayer.prototype.sampling = function() {
  var currentLine = this.lines[this.currentLine],
      point =
        new Diceros.Point(this.x, this.y, this.getCurrentPenSize()); // XXX

  currentLine.addControlPoint(point);
};


/**
 * カーソルの更新
 * @param {number} x 更新後の X 座標.
 * @param {number} y 更新後の Y 座標.
 */
Diceros.VectorLayer.prototype.updateCursor =
function(x, y) {
  var ctrlPoint = null, cssTarget;

  if (typeof this.app.currentCanvasWindow === 'number') {
    cssTarget = this.app.windows[this.app.currentCanvasWindow].element;
  } else {
    cssTarget = this.canvas;
  }

  switch (this.mode) {
    case Diceros.VectorLayer.Mode.DEFAULT:
      goog.style.setStyle(cssTarget, 'cursor', 'default');
      break;
    case Diceros.VectorLayer.Mode.EDIT:
      ctrlPoint = this.checkCtrlPoint(x, y);

      if (ctrlPoint !== null) {
        goog.style.setStyle(cssTarget, 'cursor', 'move');
      } else {
        goog.style.setStyle(cssTarget, 'cursor', 'default');
      }
      break;
      // XXX: 他のモードは未実装
  }

  this.currentCtrlPoint = ctrlPoint;
};


/**
 * 現在の線のみ描画し直す
 */
Diceros.VectorLayer.prototype.refreshCurrentLine =
function() {
  this.restore();
  this.save();
  this.draw(this.currentLine);
};


/**
 * 現在の線のみアウトラインで描画し直す
 */
Diceros.VectorLayer.prototype.refreshCurrentLineOutline =
function() {
  this.outline = true;
  this.refreshCurrentLine();
  this.outline = false;
};


/**
 * 現在の描画キャッシュをバックバッファにする
 * このメソッドは新規に線を引く際に、各線をマージしなおすのではなく、
 * 既存のバッファを合成することで高速化するための実装
 */
Diceros.VectorLayer.prototype.refreshBufferNewLine =
function() {
  // back と front の更新
  this.backBuffer =
    this.ctx.getImageData(0, 0, this.app.width, this.app.height);
  this.frontBuffer = null;
};

/**
 * 前後の描画キャッシュを更新
 * @param {number} index 編集中の線の index.
 */
Diceros.VectorLayer.prototype.refreshBuffer =
function(index) {
  var tempctx = this.app.windows[this.app.currentCanvasWindow].tempctx,
      i, l,
      buffer =
        this.app.makeCanvas(this.app.width, this.app.height).getContext('2d');

  // back
  //buffer.clearRect(0, 0, this.app.width, this.app.height);
  for (i = 0, l = this.lines.length; i < index; i++) {
    tempctx.putImageData(this.lineBuffers[i], 0, 0);
    buffer.drawImage(tempctx.canvas, 0, 0);
  }
  this.backBuffer = buffer.getImageData(0, 0, this.app.width, this.app.height);

  // front
  buffer.clearRect(0, 0, this.app.width, this.app.height);
  for (i = index + 1, l = this.lines.length; i < l; i++) {
    tempctx.putImageData(this.lineBuffers[i], 0, 0);
    buffer.drawImage(tempctx.canvas, 0, 0);
  }
  this.frontBuffer = buffer.getImageData(0, 0, this.app.width, this.app.height);
};

/**
 * 描画
 * @param {?number} drawIndex 描画する線の index. null の場合は全て描画し直す.
 */
Diceros.VectorLayer.prototype.draw =
function(drawIndex) {
  var canvas = this.canvas,
      ctx = this.ctx,
      tempctx = this.app.windows[this.app.currentCanvasWindow].tempctx;

  if (canvas === null || ctx === null) {
    throw 'canvas not initialized';
  }

  // 特定の線のみの描画では ImageData を作り直す
  if (typeof drawIndex === 'number') {
    this.drawLineImpl_(tempctx, drawIndex);
  }

  // 各々の ImageData を重ねる
  // [前レイヤー] [編集レイヤー] [後レイヤー] に分け、
  // 3回の drawImage で処理する.
  // putImageData() は置き換えなのでクリアしないでよい。
  ctx.clearRect(0, 0, this.app.width, this.app.height);
  if (this.backBuffer) {
    tempctx.putImageData(this.backBuffer, 0, 0);
    ctx.drawImage(tempctx.canvas, 0, 0);
  }
  tempctx.putImageData(this.lineBuffers[drawIndex], 0, 0);
  ctx.drawImage(tempctx.canvas, 0, 0);
  if (this.frontBuffer) {
    tempctx.putImageData(this.frontBuffer, 0, 0);
    ctx.drawImage(tempctx.canvas, 0, 0);
  }

  // 制御点の描画
  switch (this.mode) {
    case Diceros.VectorLayer.Mode.EDIT:
      this.drawCtrlPoint(drawIndex);
      break;
  }
};


/**
 * 線描画実装
 * @param {2DContext} ctx 描画先のコンテキスト.
 * @param {number} lineIndex 線の index.
 * @private
 */
Diceros.VectorLayer.prototype.drawLineImpl_ =
function(ctx, lineIndex) {
  var line = this.lines[lineIndex];

  // 一時 context をクリア
  ctx.clearRect(0, 0, this.app.width, this.app.height);

  // 曲線の描画
  line.draw(ctx);

  this.lineBuffers[lineIndex] =
    ctx.getImageData(0, 0, this.app.width, this.app.height);
};


/**
 * 制御点の描画
 * @param {number=} opt_drawIndex 描画する線.省略時は全ての線の制御点を描画.
 */
Diceros.VectorLayer.prototype.drawCtrlPoint =
function(opt_drawIndex) {
  var ctx = this.app.windows[this.app.currentCanvasWindow].overlay.ctx;

  // XXX: クリアではなくオーバーレイ自体を表示/非表示でも良いかも知れない
  ctx.clearRect(0, 0, this.app.width, this.app.height);

  // 線の骨組み描画
  ctx.strokeStyle = 'rgb(196,196,255)'; // XXX: magic number

  // 全ての線を描画するか,特定の線のみ描画するか
  if (typeof opt_drawIndex === 'number') {
    this.lines[opt_drawIndex].drawOutline(ctx, 1);
    this.drawCtrlPointImpl_(ctx, opt_drawIndex);
  } else {
    if (this.currentCtrlPoint) {
      // XXX: magic number
      this.lines[this.currentCtrlPoint.lineIndex].drawOutline(ctx, 2);
    }
    for (var i = 0, l = this.lines.length; i < l; i++) {
      this.drawCtrlPointImpl_(ctx, i);
    }
  }
};


/**
 * 制御点の描画実装
 * @param {Object} ctx 描画コンテキスト.
 * @param {number} lineIndex 描画する線の index.
 */
Diceros.VectorLayer.prototype.drawCtrlPointImpl_ =
function(ctx, lineIndex) {
  var line = this.lines[lineIndex],
      ctrlPoints = line.getCtrlPoints(),
      width = 3, // XXX: magic number
      drawPoint;

  // 制御点の描画
  ctx.beginPath();
  ctx.strokeStyle = 'rgb(0,0,255)'; // XXX: magic number
  ctx.fillStyle = 'rgb(255,255,255)'; // XXX: magic number
  for (var i = 0, l = ctrlPoints.length; i < l; i++) {
    drawPoint = ctrlPoints[i];

    ctx.moveTo(drawPoint.x + width, drawPoint.y);
    ctx.arc(drawPoint.x, drawPoint.y, width, 0, 7, false);
  }
  ctx.fill();
  ctx.stroke();
};


/**
 * 制御点の表示を消す
 */
Diceros.VectorLayer.prototype.clearCtrlPoint =
function() {
  var ctx = this.app.windows[this.app.currentCanvasWindow].overlay.ctx,
      drawFunc;

  // XXX: クリアではなくオーバーレイ自体を表示/非表示でも良いかも知れない
  ctx.clearRect(0, 0, this.app.width, this.app.height);
};


/**
 * 描画状況の保存
 */
Diceros.VectorLayer.prototype.save = function() {
/*
  this.imageBuffers.push({
    image: this.ctx.getImageData(0, 0, this.app.width, this.app.height)
    // XXX ctx.save() で保存されるのもここで管理する？
  });
*/
};


/**
 * 描画状況の復元
 */
Diceros.VectorLayer.prototype.restore = function() {
/*
  var buffer;

  if (this.imageBuffers.length < 1) {
    return;
  }

  buffer = this.imageBuffers.pop();
  if (typeof buffer === 'object') {
    this.ctx.putImageData(buffer.image, 0, 0);
  }
*/
};


/**
 * 描画状況の保存を１つ捨てる
 */
Diceros.VectorLayer.prototype.pop = function() {
  this.imageBuffers.pop();
};


/**
 * 制御点のアタリ判定
 * @param {number} x 判定する制御点の X 座標.
 * @param {number} y 判定する制御点の Y 座標.
 * @return {?Object} 線と制御点の index を含む Object か null.
 */
Diceros.VectorLayer.prototype.checkCtrlPoint =
function(x, y) {
  var ctx = this.ctx;

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
        5, // XXX: 半径が5固定を設定可能にする
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


/**
 * 現在のペンサイズを取得する
 * @return {number} 現在のペンサイズ
 */
Diceros.VectorLayer.prototype.getCurrentPenSize = function() {
  return this.app.getCurrentSizerWindow().size;
};


// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
