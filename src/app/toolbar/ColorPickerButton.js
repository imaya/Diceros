goog.provide('Diceros.ToolbarItem.ColorPickerButton');

goog.require('Diceros.ToolbarItem.Base');
goog.require('imaya.ui.ToolbarHSVColorPickerMenuButton');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @extends {Diceros.ToolbarItem.Base}
 */
Diceros.ToolbarItem.ColorPickerButton = function(app) {
  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {goog.ui.Toolbar} */
  this.toolbar = app.toolbar;
};

Diceros.ToolbarItem.ColorPickerButton.prototype.decorate = function() {
  /** @type {imaya.ui.ToolbarHSVColorPickerMenuButton} */
  var colorButton = this.button = new imaya.ui.ToolbarHSVColorPickerMenuButton('Color');

  colorButton.setSelectedColor(0, 0, 0);
  goog.events.listen(colorButton, goog.ui.Component.EventType.CHANGE, function(event) {
    this.app.color = event.target.getValue();
  }.bind(this));
  this.app.color = colorButton.getSelectedColor();

  this.toolbar.addChild(colorButton, true);
};

Diceros.ToolbarItem.ColorPickerButton.prototype.refresh = function(){
};

});