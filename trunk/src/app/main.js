goog.provide('application.Diceros.Main');

goog.require('application.Diceros.Application');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * アプリケーションメインクラス
 * @param {string} targetId アプリケーション用の DIV 要素
 * @param {number} width アプリケーション領域の横幅
 * @param {number} height アプリケーション領域の縦幅
 * @constructor
 */
application.Diceros.Main = function(targetId, width, height) {
  /**
  * @type {Element}
  */
  var canvas = goog.dom.getElement(targetId);

  /**
   * @type {application.Diceros.Application}
   */
  this.diceros = new application.Diceros.Application(),

  // initialize
  goog.style.setStyle(canvas, 'width', width + 'px');
  goog.style.setStyle(canvas, 'height', height + 'px');
  this.diceros.render(canvas);
};

// Drawtool.Main として外から利用できるようにする
goog.exportSymbol('Drawtool.Main', application.Diceros.Main);

/* vim:set expandtab ts=2 sw=2 tw=80: */
