goog.provide('application.Diceros.Line');

goog.scope(function() {

/**
 * 線描画抽象クラス
 * @constructor
 */
application.Diceros.Line = function() {
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
 * @param {application.Diceros.Point} point 追加する制御点.
 * @return {number} 追加した制御点のindex.
 */
application.Diceros.Line.prototype.addControlPoint =
goog.abstractMethod;


/**
 * 制御点の削除
 * @param {number} index 削除する制御点の index.
 */
application.Diceros.Line.prototype.removeConrtrolPoint =
goog.abstractMethod;


/**
 * 制御点の変更
 * @param {number} index 変更する制御点の index.
 * @param {application.Diceros.Point} point 新しい制御点の位置.
 */
application.Diceros.Line.prototype.updateControlPoint =
goog.nullFunction;


/**
 * 描画
 * @param {Object} context 描画するコンテキスト.
 * XXX: context の型が不明なのでとりあえず省略とする.
 */
application.Diceros.Line.prototype.draw = goog.abstractMethod;


/**
 * 概ねの描画
 * @param {Object} context 描画するコンテキスト.
 * XXX: context の型が不明なのでとりあえず省略とする.
 */
application.Diceros.Line.prototype.drawOutline = goog.abstractMethod;


/**
 * 制御点の取得
 * @return {Array} 制御点の配列を返す.
 */
application.Diceros.Line.prototype.getCtrlPoints = function() {
  return this.ctrlPoints;
}


// end of scope
});

/* vim:set expandtab ts=2 sw=2 tw=80: */
