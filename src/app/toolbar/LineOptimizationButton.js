goog.provide('Diceros.ToolbarItem.LineOptimizationButton');

goog.require('goog.dom');
goog.require('goog.ui.Menu');
goog.require('goog.ui.Option');
goog.require('goog.ui.ToolbarSelect');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @implements {Diceros.ToolbarItem.Base}
 */
Diceros.ToolbarItem.LineOptimizationButton = function(app) {
  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {goog.ui.Toolbar} */
  this.toolbar = app.toolbar;
};

Diceros.ToolbarItem.LineOptimizationButton.prototype.decorate = function() {
  /** @type {Diceros.Application} */
  var app = this.app;
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {goog.ui.Menu} */
  var optimizationMenu = new goog.ui.Menu();
  /** @type {number} */
  var i;

  for (i = 0; i <= 10; ++i) {
    optimizationMenu.addChild(new goog.ui.Option(""+i), true);
  }

  var selector = new goog.ui.ToolbarSelect('線の補正', optimizationMenu);

  selector.setTooltip('線の補正');
  toolbar.addChild(selector, true);
  toolbar.lineOptimization = selector;

  goog.events.listen(selector, goog.ui.Component.EventType.ACTION, function(event) {
    app.lineOptimization = event.target.getValue();
  });

  goog.dom.classes.add(selector.getElement(), goog.getCssName('goog-toolbar-select'));
};

Diceros.ToolbarItem.LineOptimizationButton.prototype.refresh = function() {

};

});