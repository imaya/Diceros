goog.provide('Diceros.ToolbarItem.CaptureTargetButton');

goog.require('Diceros.ToolbarItem.Base');
goog.require('goog.object');
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
Diceros.ToolbarItem.CaptureTargetButton = function(app) {
  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {goog.ui.Toolbar} */
  this.toolbar = app.toolbar;
  /** @type {goog.ui.SelectionModel} */
  this.selectionModel;
  /** @type {Object}*/
  this.buttons;
};

Diceros.ToolbarItem.CaptureTargetButton.prototype.decorate = function() {
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {goog.ui.SelectionModel} */
  var selectionModel = this.selectionModel = new goog.ui.SelectionModel();
  /** @type {goog.ui.Menu} */
  var menu = new goog.ui.Menu();
  var menuButton = new goog.ui.MenuButton('入力方法', menu);

  this.buttons = {
    'Mouse': {
      value: Diceros.CanvasWindow.CaptureEventType.MOUSE,
      button: void 0
    },
    'Touch': {
      value: Diceros.CanvasWindow.CaptureEventType.TOUCH,
      button: void 0
    },
    'Pen(PointerEvents)': {
      value: Diceros.CanvasWindow.CaptureEventType.POINTER,
      button: void 0
    }
  };

  selectionModel.setSelectionHandler(function(button, select) {
    button && button.setChecked(select);
  });

  goog.object.forEach(
    this.buttons,
    function(obj, caption) {
      var button = obj.button =
        new goog.ui.MenuItem(caption);

      button.setCheckable(true);
      button.setValue(obj.value);
      button.setAutoStates(goog.ui.Component.State.CHECKED, false);
      selectionModel.addItem(button);
      menu.addChild(button, true);

      goog.events.listen(
        button,
        goog.ui.Component.EventType.ACTION,
        this.handleAction_.bind(this)
      );
    },
    this
  );

  menu.addChild(new goog.ui.MenuSeparator(), true);

  this.appendIgnoreTouchButton_(menu);

  toolbar.addChild(menuButton, true);
};

Diceros.ToolbarItem.CaptureTargetButton.prototype.appendIgnoreTouchButton_ = function(menu) {
  /** @type {Diceros.Application} */
  var app = this.app;
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {goog.ui.MenuItem} */
  var button = new goog.ui.MenuItem('Ignore Touch (PointerEvents)');

  button.setCheckable(true);

  // event handler
  goog.events.listen(button, goog.ui.Component.EventType.ACTION, function(event) {
    /** @type {boolean} */
    var disable = event.target.isChecked();

    app.getCurrentCanvasWindow().setIgnoreTouch(disable);
  });

  menu.addChild(button, true);
};

Diceros.ToolbarItem.CaptureTargetButton.prototype.refresh = function() {
  /** @type {Diceros.CanvasWindow} */
  var canvasWindow = this.app.getCurrentCanvasWindow();

  goog.object.forEach(this.buttons, function(value, key) {
    value.button.setChecked(value.value === canvasWindow.getCaptureEventType());
  });
};

/**
 * @param {goog.events.Event} event
 * @private
 */
Diceros.ToolbarItem.CaptureTargetButton.prototype.handleAction_ = function(event) {
  var canvasWindow = this.app.getCurrentCanvasWindow();

  this.selectionModel.setSelectedItem(/** @type {?Object} */(event.target));
  canvasWindow.setCaptureEventType(event.target.getValue());
  this.refresh();
};


});