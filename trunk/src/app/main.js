goog.provide('application.Diceros.Main');

goog.require('application.Diceros.Application');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * アプリケーションメインクラス
 * @param {string} targetId アプリケーション用の DIV 要素
 * @param {Object=} opt_config アプリケーション設定
 * @constructor
 */
application.Diceros.Main = function(targetId, opt_config) {
  /**
  * @type {Element}
  */
  var element = goog.dom.getElement(targetId);

  if (typeof opt_config !== 'object') {
    opt_config = {};
  };

  /**
   * @type {application.Diceros.Application}
   */
  this.diceros = new application.Diceros.Application(opt_config);

  // initialize
  goog.style.setStyle(element, 'width', (opt_config.width || 1024) + 'px');
  goog.style.setStyle(element, 'height', (opt_config.height || 768) + 'px');
  this.diceros.render(element);
};

// Diceros.Main として外から利用できるようにする
goog.exportSymbol('Diceros.Main', application.Diceros.Main);

/* vim:set expandtab ts=2 sw=2 tw=80: */
