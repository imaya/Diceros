goog.provide('application.Diceros.RasterLayer');

goog.require('application.Diceros.Layer');
goog.require('goog.object');

goog.scope(function() {
/**
 * ラスタレイヤー実装
 * @extends application.Diceros.Layer
 * @constructor
 */
application.Diceros.RasterLayer = function(app) {
  goog.base(this, app);

  /**
   * クラス名
   * @type {string}
   */
  this.name = 'RasterLayer';
};
goog.inherits(
  application.Diceros.RasterLayer,
  application.Diceros.Layer
);

});
/* vim:set expandtab ts=2 sw=2 tw=80: */
