goog.provide('Diceros.Toolbar');

goog.require('Diceros.ToolbarItem.EditModeButton');
goog.require('Diceros.ToolbarItem.PointerModeButton');
goog.require('Diceros.ToolbarItem.CaptureTargetButton');
goog.require('Diceros.ToolbarItem.ColorPickerButton');
goog.require('Diceros.ToolbarItem.StorageButton');
goog.require('Diceros.ToolbarItem.LineOptimizationButton');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @constructor
 * @extends {goog.ui.Toolbar};
 */
Diceros.Toolbar = function(app) {
  goog.base(this);

  /** @type {Diceros.Application} */
  this.app = app;
  /** @type {Array.<Diceros.Toolbar.Base>} */
  this.buttons = [];

  /** @type {Diceros.ToolbarItem.ColorPickerButton} */
  this.colorPicker;
  /** @type {Diceros.ToolbarItem.EditModeButton} */
  this.editMode;
  /** @type {Diceros.ToolbarItem.LineOptimizationButton} */
  this.lineOptimization;
  /** @type {Diceros.ToolbarItem.StorageButton} */
  this.storage;
  /** @type {Diceros.ToolbarItem.CaptureTargetButton} */
  this.captureTarget;
  /** @type {Diceros.ToolbarItem.PointerModeButton} */
  this.pointerMode;
};
goog.inherits(Diceros.Toolbar, goog.ui.Toolbar);

Diceros.Toolbar.prototype.createDom = function() {
  goog.base(this, 'createDom');

  /** @type {Diceros.ToolbarItem.ColorPickerButton} */
  var colorPicker = this.colorPicker = new Diceros.ToolbarItem.ColorPickerButton(this.app);
  colorPicker.decorate();
  colorPicker.refresh();

  // separator
  this.addChild(new goog.ui.ToolbarSeparator(), true);

  /** @type {Diceros.ToolbarItem.EditModeButton} */
  var editMode = this.editMode = new Diceros.ToolbarItem.EditModeButton(this.app);
  editMode.decorate();
  editMode.refresh();

  // separator
  this.addChild(new goog.ui.ToolbarSeparator(), true);

  /** @type {Diceros.ToolbarItem.LineOptimizationButton} */
  var lineOptimization = this.lineOptimization = new Diceros.ToolbarItem.LineOptimizationButton(this.app);
  lineOptimization.decorate();
  lineOptimization.refresh();

  /** @type {Diceros.ToolbarItem.StorageButton} */
  var storageButon = this.storage = new Diceros.ToolbarItem.StorageButton(this.app);
  storageButon.decorate();
  storageButon.refresh();

  // separator
  this.addChild(new goog.ui.ToolbarSeparator(), true);

  /** @type {Diceros.ToolbarItem.CaptureTargetButton} */
  var captureTarget = this.captureTarget = new Diceros.ToolbarItem.CaptureTargetButton(this.app);
  captureTarget.decorate();
  captureTarget.refresh();

  // ignore touch
  //this.app.getCurrentCanvasWindow().setIgnoreTouch(false);
  //this.appendIgnoreTouchButton_(this);

  // separator
  this.addChild(new goog.ui.ToolbarSeparator(), true);

  /** @type {Diceros.ToolbarItem.PointerModeButton} */
  var pointerMode = this.pointerMode = new Diceros.ToolbarItem.PointerModeButton(this.app);
  pointerMode.decorate();
  pointerMode.refresh();

  this.buttons = [
    editMode,
    captureTarget,
    pointerMode
  ];
};

Diceros.Toolbar.prototype.refresh = function() {
  goog.array.forEach(this.buttons, function(button) {
    button.refresh();
  });
};

});