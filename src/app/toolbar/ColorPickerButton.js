goog.provide('Diceros.ToolbarItem.ColorPickerButton');

goog.require('Diceros.ToolbarItem.Base');
goog.require('imaya.ui.ToolbarHSVColorPickerMenuButton');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @implements {Diceros.ToolbarItem.Base}
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
    this.refreshSelectedColor();
  }.bind(this));
  this.refreshSelectedColor();

  this.toolbar.addChild(colorButton, true);
};

Diceros.ToolbarItem.ColorPickerButton.prototype.refresh = function(){
};

Diceros.ToolbarItem.ColorPickerButton.prototype.refreshSelectedColor = function(){
  /** @type {imaya.ui.ToolbarHSVColorPickerMenuButton} */
  var colorButton = this.button;
  /** @type {Array.<number>} */
  var rgb = colorButton.getSelectedColorRGB();

  this.app.color = colorButton.getSelectedColor();
  this.app.rgb = (
    (rgb[0] << 24) | (rgb[1] << 16) | (rgb[2] << 8) | 255
  ) >>> 0;
};

});