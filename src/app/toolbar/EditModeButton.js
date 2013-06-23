goog.provide('Diceros.ToolbarItem.EditModeButton');

goog.require('Diceros.ToolbarItem.Base');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @extends {Diceros.ToolbarItem.Base}
 */
Diceros.ToolbarItem.EditModeButton = function(app) {
  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {goog.ui.Toolbar} */
  this.toolbar = app.toolbar;
  /** @type {goog.ui.SelectionModel} */
  this.selectionModel;
  /** @type {Object} */
  this.buttons;
};

Diceros.ToolbarItem.EditModeButton.prototype.decorate = function() {
  /** @type {goog.ui.Toolbar} */
  var toolbar = this.toolbar;
  /** @type {Diceros.Application} */
  var app = this.app;
  /** @type {goog.ui.SelectionModel} */
  var selectionModel = this.selectionModel = new goog.ui.SelectionModel();

  this.buttons = {
    '描画': {
      value: Diceros.VectorLayer.Mode.DEFAULT,
      button: void 0
    },
    '編集': {
      value: Diceros.VectorLayer.Mode.EDIT,
      button: void 0
    },
    '削除': {
      value: Diceros.VectorLayer.Mode.DELETE,
      button: void 0
    },
    '太さ変更': {
      value: Diceros.VectorLayer.Mode.WIDTH_UPDATE,
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
};

Diceros.ToolbarItem.EditModeButton.prototype.refresh = function() {
  /** @type {goog.ui.ToolbarToggleButton} */
  var button;
  /** @type {Diceros.CanvasWindow} */
  var canvasWindow = this.app.getCurrentCanvasWindow();
  /** @type {Diceros.Layer} */
  var currentLayer = canvasWindow.getCurrentLayer();
  /** @type {boolean} */
  var isVector = currentLayer instanceof Diceros.VectorLayer;

  // mode buttons
  goog.object.forEach(
    this.buttons,
    function(obj, caption) {
      button = obj.button;

      if (isVector) {
        button.setEnabled(true);
        button.setChecked(
          currentLayer.mode === button.getValue()
        );
      } else {
        button.setEnabled(false);
      }
    }
  );
};

Diceros.ToolbarItem.EditModeButton.prototype.handleAction_ = function(event) {
  /** @type {Diceros.CanvasWindow} */
  var canvasWindow = this.app.getCurrentCanvasWindow();
  /** @type {Diceros.Layer} */
  var currentLayer = canvasWindow.getCurrentLayer();

  this.selectionModel.setSelectedItem(event.target);

  if (currentLayer instanceof Diceros.VectorLayer) {
    currentLayer.baseMode = currentLayer.mode = event.target.getValue();
    currentLayer.switchMode(currentLayer.mode);
  }

  this.refresh();
};

});