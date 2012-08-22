goog.provide('Diceros.Line');

goog.scope(function() {

/**
 * 線描画抽象クラス
 * @constructor
 */
Diceros.Line = function() {
  /**
   * クラス名
   * @type {string}
   */
  this.name = 'Line';

  /**
   * 制御点の配列
   * @type {Array}
   * XXX: 何の配列か書く
   */
  this.ctrlPoints = [];
}


/**
 * 制御点の追加
 * @param {Diceros.Point} point 追加する制御点.
 * @return {number} 追加した制御点のindex.
 */
Diceros.Line.prototype.addControlPoint =
goog.abstractMethod;


/**
 * 制御点の削除
 * @param {number} index 削除する制御点の index.
 */
Diceros.Line.prototype.removeConrtrolPoint =
goog.abstractMethod;


/**
 * 制御点の変更
 * @param {number} index 変更する制御点の index.
 * @param {Diceros.Point} point 新しい制御点の位置.
 */
Diceros.Line.prototype.updateControlPoint =
goog.nullFunction;


/**
 * 描画
 * @param {Object} context 描画するコンテキスト.
 * XXX: context の型が不明なのでとりあえず省略とする.
 */
Diceros.Line.prototype.draw = goog.abstractMethod;


/**
 * 概ねの描画
 * @param {CanvasRenderingContext2D} context 描画するコンテキスト.
 * @param {number=} opt_width 太さ.
 * XXX: context の型が不明なのでとりあえず省略とする.
 */
Diceros.Line.prototype.drawOutline = goog.abstractMethod;


/**
 * 制御点の取得
 * @return {Array} 制御点の配列を返す.
 */
Diceros.Line.prototype.getCtrlPoints = function() {
  return this.ctrlPoints;
}


// end of scope
});

/* vim:set expandtab ts=2 sw=2 tw=80: */
