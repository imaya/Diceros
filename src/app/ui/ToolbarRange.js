goog.provide('imaya.ui.ToolbarRange');

goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.registry');
goog.require('goog.style');
goog.require('goog.ui.Slider');


/**
 * @param {goog.ui.ButtonRenderer=} opt_renderer Optional renderer used to
 *     render or decorate the button; defaults to
 *     {@link goog.ui.ToolbarButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.ToolbarButton}
 */
imaya.ui.ToolbarRange = function(opt_renderer, opt_domHelper) {
  goog.ui.ToolbarButton.call(this, '', opt_renderer, opt_domHelper);

  /** @type {goog.ui.Slider} */
  this.slider = new goog.ui.Slider();
};
goog.inherits(imaya.ui.ToolbarRange, goog.ui.ToolbarButton);

imaya.ui.ToolbarRange.prototype.createDom = function() {
  goog.base(this, 'createDom');

  this.setEnabled(false);
};

imaya.ui.ToolbarRange.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var element = this.getContentElement();
  var parent = element.parentNode;
  var slider = this.slider;

  slider.decorate(element);
  slider.addEventListener(goog.ui.Component.EventType.CHANGE, function(event) {
    event.target = this;
    this.dispatchEvent(event);
  }.bind(this));
  goog.style.setStyle(element, {
    'width': '100px',
    'height': parent.getBoundingClientRect().height + 'px'
  });

  var bar = goog.dom.createDom('div');
  goog.style.setStyle(bar, {
    position: 'absolute',
    width: '100%',
    top: '9px',
    border: '1px inset white',
    overflow: 'hidden',
    height: '0'
  });
  goog.style.setStyle(element, {
    'padding-left': 0
  });

  element.insertBefore(bar, element.firstChild);

  goog.dom.classes.remove(this.getElement(), goog.getCssName('goog-toolbar-button-disabled'));
};

/**
 * @returns {goog.ui.Slider}
 */
imaya.ui.ToolbarRange.prototype.getSlider = function() {
  return this.slider;
};

/**
 * @returns {number}
 */
imaya.ui.ToolbarRange.prototype.getValue = function() {
  return this.slider.getValue();
};

// Registers a decorator factory function for toolbar buttons.
goog.ui.registry.setDecoratorByClassName(
  goog.ui.ToolbarButtonRenderer.CSS_CLASS,
  function() {
    return new imaya.ui.ToolbarRange(null);
  });