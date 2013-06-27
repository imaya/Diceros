goog.provide('Diceros.ToolbarItem.HorizontalMirrorButton');

goog.require('Diceros.ToolbarItem.Base');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.dom');
goog.require('goog.ui.ToolbarToggleButton');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @implements {Diceros.ToolbarItem.Base}
 */
Diceros.ToolbarItem.HorizontalMirrorButton = function(app) {
  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {goog.ui.Toolbar} */
  this.toolbar = app.toolbar;
  /** @type {goog.ui.ToolbarToggleButton} */
  this.button;
};

Diceros.ToolbarItem.HorizontalMirrorButton.prototype.decorate = function() {
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {goog.ui.ToolbarToggleButton} */
  var button = this.button = new goog.ui.ToolbarToggleButton("左右反転");

  button.setAutoStates(goog.ui.Component.State.CHECKED, false);
  toolbar.addChild(button, true);
  goog.events.listen(
    button,
    goog.ui.Component.EventType.ACTION,
    this.handleAction_.bind(this)
  );
};

Diceros.ToolbarItem.HorizontalMirrorButton.prototype.refresh = function() {
};

/**
 * @param {goog.events.Event} event
 * @private
 */
Diceros.ToolbarItem.HorizontalMirrorButton.prototype.handleAction_ = function(event) {
  /** @type {Diceros.CanvasWindow} */
  var canvasWindow = this.app.getCurrentCanvasWindow();

  this.button.setChecked(!this.button.isChecked());
  canvasWindow.setHorizontalMirror(this.button.isChecked());

  this.refresh();
};

});