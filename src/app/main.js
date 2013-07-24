goog.provide('Diceros.Main');

goog.require('Diceros.Application');
goog.require('goog.dom');
goog.require('goog.style');

goog.scope(function() {

/**
 * アプリケーションメインクラス
 * @constructor
 * @param {!Element} target アプリケーション用の DIV 要素
 * @param {Object=} opt_config アプリケーション設定
 */
Diceros.Main = function(target, opt_config) {
  if (!opt_config) {
    opt_config = {};
  }

  /** @type {!Element} */
  this.target = target;
  /** @type {Diceros.Application} */
  this.diceros = new Diceros.Application(opt_config);
  /** @type {Object} */
  this.config = opt_config;
};

/**
 * 初期化
 */
Diceros.Main.prototype.init = function() {
  var target = this.target;
  var config = this.config;

  goog.style.setStyle(target, 'width',  (config.width  || 1024) + 'px');
  goog.style.setStyle(target, 'height', (config.height ||  768) + 'px');

  this.diceros.render(target);
};

Diceros.Main.prototype.resize = function(width, height) {
  this.diceros.resizeScreen(new goog.math.Size(width, height));
};

// Diceros.Main として外から利用できるようにする
goog.exportSymbol('Diceros.Main', Diceros.Main);
goog.exportSymbol('Diceros.Main.prototype.init', Diceros.Main.prototype.init);
goog.exportSymbol('Diceros.Main.prototype.resize', Diceros.Main.prototype.resize);

// end of scope
});

/* vim:set expandtab ts=2 sw=2 tw=80: */
