goog.provide('Diceros.ToolbarItem.PointerModeButton');

goog.require('Diceros.ToolbarItem.Base');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.dom');
goog.require('goog.ui.SelectionModel');
goog.require('goog.ui.ToolbarToggleButton');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @implements {Diceros.ToolbarItem.Base}
 */
Diceros.ToolbarItem.PointerModeButton = function(app) {
  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {goog.ui.Toolbar} */
  this.toolbar = app.toolbar;
  /** @type {goog.ui.SelectionModel} */
  this.selectionModel;
  /** @type {Array} */
  this.buttons;
};

Diceros.ToolbarItem.PointerModeButton.prototype.decorate = function() {
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {goog.ui.SelectionModel} */
  var selectionModel = this.selectionModel = new goog.ui.SelectionModel();

  this.buttons = [
    {
      value: Diceros.CanvasWindow.PointerMode.Draw,
      class: goog.getCssName('icon-pen'),
      button: void 0
    },
    {
      value: Diceros.CanvasWindow.PointerMode.Move,
      class: goog.getCssName('icon-hand'),
      button: void 0
    },
    {
      value: Diceros.CanvasWindow.PointerMode.Fill,
      class: goog.getCssName('icon-fill'),
      button: void 0
    }
  ];

  selectionModel.setSelectionHandler(function(button, select) {
    button && button.setChecked(select);
  });

  goog.array.forEach(
    this.buttons,
    function(obj) {
      /** @type {!HTMLElement} */
      var value =
        /** @type {!HTMLElement} */
        (goog.dom.createDom('span'));
      /** @type {goog.ui.ToolbarToggleButton} */
      var button = obj.button =
        new goog.ui.ToolbarToggleButton(obj.value);

      goog.dom.classes.add(value, obj.class);

      button.setContent(value);
      button.setValue(obj.value);
      button.setAutoStates(goog.ui.Component.State.CHECKED, false);
      selectionModel.addItem(button);
      toolbar.addChild(button, true);
      goog.events.listen(
        button,
        goog.ui.Component.EventType.ACTION,
        this.handleAction_.bind(this)
      );
    },
    this
  );
};

Diceros.ToolbarItem.PointerModeButton.prototype.refresh = function() {
  /** @type {Diceros.CanvasWindow} */
  var canvasWindow = this.app.getCurrentCanvasWindow();

  goog.array.forEach(this.buttons, function(obj) {
    obj.button.setChecked(obj.value === canvasWindow.pointerMode);
  });
};

/**
 * @param {goog.events.Event} event
 * @private
 */
Diceros.ToolbarItem.PointerModeButton.prototype.handleAction_ = function(event) {
  /** @type {Diceros.Window} */
  var canvasWindow = this.app.getCurrentCanvasWindow();

  this.selectionModel.setSelectedItem(/** @type {?Object} */(event.target));
  canvasWindow.setPointerMode(event.target.getValue());
  this.refresh();
};

});