goog.provide('Diceros.Main');

goog.require('Diceros.Application');
goog.require('goog.dom');
goog.require('goog.style');

goog.scope(function() {

/**
 * アプリケーションメインクラス
 * @constructor
 * @param {string} targetId アプリケーション用の DIV 要素
 * @param {Object=} opt_config アプリケーション設定
 */
Diceros.Main = function(targetId, opt_config) {
  if (!opt_config) {
    opt_config = {};
  }

  /** @type {HTMLElement} */
  this.target = goog.dom.getElement(targetId);
  /** @type {Diceros.Application} */
  this.diceros = new Diceros.Application(opt_config);
};

/**
 * 初期化
 */
Diceros.Main.prototype.init = function() {
  var target = this.target;

  goog.style.setStyle(target, 'width',  (opt_config.width  || 1024) + 'px');
  goog.style.setStyle(target, 'height', (opt_config.height ||  768) + 'px');
  this.diceros.render(target);
};

// Diceros.Main として外から利用できるようにする
goog.exportSymbol('Diceros.Main', Diceros.Main);

// end of scope
});

/* vim:set expandtab ts=2 sw=2 tw=80: */
