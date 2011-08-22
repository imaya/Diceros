goog.provide('application.Diceros.Main');

goog.require('application.Diceros.Application');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * �A�v���P�[�V�������C���N���X
 * @param {string} targetId �A�v���P�[�V�����p�� DIV �v�f
 * @param {number} width �A�v���P�[�V�����̈�̉���
 * @param {number} height �A�v���P�[�V�����̈�̏c��
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

// Drawtool.Main �Ƃ��ĊO���痘�p�ł���悤�ɂ���
goog.exportSymbol('Drawtool.Main', application.Diceros.Main);

/* vim:set expandtab ts=2 sw=2 tw=80: */
