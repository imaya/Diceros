goog.provide('Diceros.ToolbarItem.RadianRange');

goog.require('Diceros.ToolbarItem.Base');
goog.require('goog.events');
goog.require('goog.dom');
goog.require('imaya.ui.ToolbarRange');

goog.scope(function() {

  /**
   * @param {Diceros.Application} app
   * @constructor
   * @implements {Diceros.ToolbarItem.Base}
   */
  Diceros.ToolbarItem.RadianRange = function(app) {
    /** @type {Diceros.Application} */
    this.app = app;
    /** @type {goog.ui.Toolbar} */
    this.toolbar = app.toolbar;
    /** @type {imaya.ui.ToolbarRange} */
    this.button;
  };

  Diceros.ToolbarItem.RadianRange.prototype.decorate = function() {
    /** @type {goog.ui.Toolbar} */
    var toolbar = this.toolbar;
    /** @type {imaya.ui.ToolbarRange} */
    var button = this.button = new imaya.ui.ToolbarRange();
    /** @type {goog.ui.Slider} */
    var slider = button.getSlider();

    toolbar.addChild(button, true);

    slider.setMaximum(Math.PI * 2 * 1000);
    slider.setMoveToPointEnabled(true);

    goog.events.listen(
      button,
      goog.ui.Component.EventType.CHANGE,
      this.handleChange_.bind(this)
    );
  };

  Diceros.ToolbarItem.RadianRange.prototype.refresh = function() {
  };

  /**
   * @param {goog.events.Event} event
   * @private
   */
  Diceros.ToolbarItem.RadianRange.prototype.handleChange_ = function(event) {
    /** @type {Diceros.CanvasWindow} */
    var canvasWindow = this.app.getCurrentCanvasWindow();
    /** @type {number} */
    var value = event.target.getValue() / 1000;

    canvasWindow.setRadian(value);

    this.refresh();
  };

});