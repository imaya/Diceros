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

  /**
   * クラス名
   * @type {string}
   */
  this.name = 'RasterLayer';
};
goog.inherits(
  Diceros.RasterLayer,
  Diceros.Layer
);

});
/* vim:set expandtab ts=2 sw=2 tw=80: */
