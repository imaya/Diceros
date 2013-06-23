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
 * @extends {Diceros.ToolbarItem.Base}
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
        new goog.ui.ToolbarToggleButton(caption);

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

  this.appendIgnoreTouchButton_();
};

Diceros.ToolbarItem.CaptureTargetButton.prototype.appendIgnoreTouchButton_ = function() {
  /** @type {Diceros.Application} */
  var app = this.app;
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {goog.ui.ToolbarToggleButton} */
  var button = new goog.ui.ToolbarToggleButton('Ignore Touch (PointerEvents)');

  // event handler
  goog.events.listen(button, goog.ui.Component.EventType.ACTION, function(event) {
    /** @type {boolean} */
    var disable = event.target.isChecked();

    app.getCurrentCanvasWindow().setIgnoreTouch(disable);
  });

  toolbar.addChild(button, true);
};

Diceros.ToolbarItem.CaptureTargetButton.prototype.refresh = function() {
  /** @type {Diceros.CanvasWindow} */
  var canvasWindow = this.app.getCurrentCanvasWindow();

  goog.object.forEach(this.buttons, function(value, key) {
    value.button.setChecked(value.value === canvasWindow.getCaptureEventType());
  });
};

/**
 * @param {goog.events.BrowserEvent} event
 * @private
 */
Diceros.ToolbarItem.CaptureTargetButton.prototype.handleAction_ = function(event) {
  var canvasWindow = this.app.getCurrentCanvasWindow();

  this.selectionModel.setSelectedItem(event.target);
  canvasWindow.setCaptureEventType(event.target.getValue());
  this.refresh();
};


});