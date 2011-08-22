goog.provide('application.Diceros.Main');

goog.require('application.Diceros.Application');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * �A�v���P�[�V�������C���N���X
 * @param {string} targetId �A�v���P�[�V�����p�� DIV �v�f
 * @param {Object=} opt_config �A�v���P�[�V�����ݒ�
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

// Diceros.Main �Ƃ��ĊO���痘�p�ł���悤�ɂ���
goog.exportSymbol('Diceros.Main', application.Diceros.Main);

/* vim:set expandtab ts=2 sw=2 tw=80: */
