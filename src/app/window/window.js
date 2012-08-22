goog.provide('Diceros.Window');

goog.require('goog.object');
goog.require('goog.ui.Component');

goog.scope(function(){
/**
 * アプリケーションウィンドウ基本クラス
 *
 * @param {Diceros.Application} app
 * @param {number} index
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
Diceros.Window = function(app, index, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * クラス名
   * @type {string}
   */
  this.name = 'Window';
  /**
   * アプリケーションオブジェクト
   * @type {Diceros.Application}
   */
  this.app = app;
  /**
   * 自分のウィンドウリストの index
   * @type {number}
   */
  this.index;
};
goog.inherits(Diceros.Window, goog.ui.Component);

/**
 * イベントの設定を行う
 */
Diceros.Window.prototype.setEvent = goog.abstractMethod;


// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
