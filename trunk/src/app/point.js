goog.provide('application.Diceros.Point');

goog.scope(function() {
/**
 * 座標やペンの太さなどを表すクラス
 * @param {number} x X座標を表す.
 * @param {number} y Y座標を表す.
 * @param {?number=} opt_width 太さを表す. 太さを持たない場合は null を指定する.
 * @param {boolean=} opt_noPressure 筆圧を利用しない.
 * @constructor
 */
application.Diceros.Point =
function(x, y, opt_width, opt_noPressure) {
  /**
   * クラス名
   * @type {string}
   */
  this.name = 'Point';
  /**
   * X 座標
   * @type {number}
   */
  this.x = (typeof x === 'undefined') ? 0 : x;
  /**
   * Y 座標
   * @type {number}
   */
  this.y = (typeof y === 'undefined') ? 0 : y;

  if (isNaN(x) || isNaN(y)) {
    throw 'NaN error';
  }

  /**
   * 太さ
   * @type {?number}
   */
  this.width = null;
  if (typeof opt_width === 'number') {
    // XXX: 1 -> currentPenWidth / magic number
    this.width = opt_noPressure ? opt_width : (opt_width * this.getPressure());
  }
};

/**
 * 筆圧を0.0-1.0の範囲で取得する
 * @return {number} 筆圧(0.0-1.0).
 */
application.Diceros.Point.prototype.getPressure = function() {
  /**
   * @type {Element}
   */
  var plugin = this.getPlugin();

  // プラグイン未検出
  if (typeof plugin !== 'object' && typeof plugin !== 'function') {
    application.Diceros.Point.plugin = null;
    return 1;
  }

  // Wacom プラグイン
  if (plugin.isWacom) {
    // 2 = Mouse
    if (plugin.pointerType === 2 || plugin.pointerType === 0) {
      return 1;
    }

    return plugin.pressure;
  }

  return 1;
};

/**
 * ペンタブレットのプラグイン
 * @type {Element}
 * XXX: IE用のプラグイン検出も対応する必要がある
 */
application.Diceros.Point.prototype.getPlugin = function() {
  return document.embeds['wacom-plugin'];
}


// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
