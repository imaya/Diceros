goog.provide('application.Diceros.Window');

goog.require('goog.object');
goog.require('goog.ui.Component');

goog.scope(function(){
/**
 * アプリケーションウィンドウ基本クラス
 *
 * @param {application.Diceros.application} app
 * @param {number} index
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
application.Diceros.Window =
function(app, index, opt_domHelper) {
  goog.base(this, this.opt_domHelper);

  /**
   * クラス名
   * @type {string}
   */
  this.name = 'Window';
  /**
   * アプリケーションオブジェクト
   * @type {application.Diceros.Application}
   */
  this.app = app;
  /**
   * 自分のウィンドウリストの index
   * @type {number}
   */
  this.index = null;
};
goog.inherits(
  application.Diceros.Window,
  goog.ui.Component
);

/**
 * イベントの設定を行う
 */
application.Diceros.Window.prototype.setEvent = goog.abstructMethod;


// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
