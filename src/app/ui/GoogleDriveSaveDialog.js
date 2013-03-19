goog.provide('imaya.ui.GoogleDriveSaveDialog');

goog.require('imaya.ui.GooglePickerAPI');
goog.require('imaya.ui.Prompt');
goog.require('goog.ui.Resizable');
goog.require('goog.ui.ac');


goog.scope(function() {
  /**
   * @param {string} promptTitle
   * @param {function(string)} callback
   * @param {string=} opt_defaultValue
   * @param {string=} opt_class
   * @param {boolean=} opt_useIframeForIE
   * @param {goog.dom.DomHelper=} opt_domHelper
   * @constructor
   * @extends {imaya.ui.Prompt}
   */
imaya.ui.GoogleDriveSaveDialog = function(promptTitle, callback, opt_defaultValue, opt_class, opt_useIframeForIE, opt_domHelper)  {
  goog.base(this, promptTitle, 'input filename', callback, opt_defaultValue, opt_class, opt_useIframeForIE, opt_domHelper);

  /** @type {goog.ui.Resizable} */
  this.resizable;
};
goog.inherits(imaya.ui.GoogleDriveSaveDialog, imaya.ui.Prompt);

imaya.ui.GoogleDriveSaveDialog.prototype.createDom = function() {
  goog.base(this, 'createDom');

  this.resizable =  new goog.ui.Resizable(
    this.getElement(),
    {
      handles: goog.ui.Resizable.Position.BOTTOM_RIGHT,
      minWidth: 300,
      minHeight: 200
    }
  );

  this.addChild(this.resizable);
};

imaya.ui.GoogleDriveSaveDialog.prototype.enterDocument = function() {
  /** @type {goog.ui.Resizable} */
  var resizable = this.resizable;

  goog.base(this, 'enterDocument');

  // resize event handler
  goog.events.listen(resizable, goog.ui.Resizable.EventType.RESIZE,
    this.onResize, false, this);

  // fire resize event on initialize
  setTimeout(function() {
    resizable.handlerOffsetSize_ = new goog.math.Size(21, 20);
    resizable.dispatchEvent({
      type: goog.ui.Resizable.EventType.RESIZE,
      size: new goog.math.Size(300, 200)
    });
  }, 0);

  // load filelist on create elements
  this.loadList();
};

imaya.ui.GoogleDriveSaveDialog.prototype.onResize = function(e) {
  /** @type {Element} */
  var button = this.getButtonElement();
  /** @type {Element} */
  var title = this.getTitleElement();
  /** @type {Element} */
  var input = this.getInputElement();
  /** @type {Element} */
  var content = this.getContentElement();
  /** @type {Element} */
  var dialog = this.getContentElement();
  /** @type {goog.math.Size} */
  var dialogSize = e.size;
  /** @type {goog.math.Size} */
  var buttonSize = goog.style.getBorderBoxSize(button);
  /** @type {goog.math.Size} */
  var titleSize = goog.style.getBorderBoxSize(title);
  /** @type {goog.math.Size} */
  var resizableSize = this.resizable.handlerOffsetSize_;
  /** @type {goog.math.Size} */
  var newContentSize = new goog.math.Size(
    dialogSize.width - resizableSize.width,
    (dialogSize.height - titleSize.height - buttonSize.height - resizableSize.height)
  );
  /** @type {goog.math.Size} */
  var buttonsSize = goog.style.getBorderBoxSize(button);
  /** @type {goog.math.Size} */
  var inputSize = goog.style.getBorderBoxSize(input);
  /** @type {number} */
  var buttonsWidth = 0;
  /** @type {!goog.math.Box} */
  var box;
  /** @type {NodeList} */
  var buttons = button.getElementsByTagName('button');
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  // dialog
  goog.style.setBorderBoxSize(dialog, dialogSize);

  // dialog content
  goog.style.setBorderBoxSize(content, newContentSize);

  for (i = 0, il = buttons.length; i < il; ++i) {
    box = goog.style.getMarginBox(buttons[i]);
    buttonsWidth += goog.style.getBorderBoxSize(buttons[i]).width + box.left + box.right;
  }
  buttonsSize.width = newContentSize.width;
  goog.style.setBorderBoxSize(button, buttonsSize);

  // dialog input
  inputSize.width = goog.style.getContentBoxSize(button).width - buttonsWidth - 1;
  goog.style.setBorderBoxSize(input, inputSize);
};

imaya.ui.GoogleDriveSaveDialog.prototype.dispose = function() {
  goog.base(this, 'dispose');

  goog.events.unlisten(this.resizable, goog.ui.Resizable.EventType.RESIZE,
    this.onResize, false, this);

  this.resizable.dispose();
};


imaya.ui.GoogleDriveSaveDialog.prototype.loadList = function() {
  var that = this;

  gapi.client.load('drive', 'v2', function() {
    /** @type {{execute: Function}} */
    var request = gapi.client.drive.files.list();

    request.execute(function() {
      that.handleResponse.apply(that, arguments);
    });
  });
};

imaya.ui.GoogleDriveSaveDialog.prototype.handleResponse = function(obj, jsonText) {
  /** @type {goog.events.EventTarget} */
  var renderer;
  /** @type {Element} */
  var input = this.getInputElement();
  var table;
  var thead;
  var tbody;

  if (!obj || obj.error) {
    return;
  }

  // table
  table = goog.dom.createElement('table');
  thead = goog.dom.createElement('thead');
  tbody = goog.dom.createElement('tbody');

  //goog.dom.append(table, goog.dom)

  // get filenames
  var items = obj['items'];
  var filenames = [];
  for (var i = 0, il = items.length; i < il; ++i) {
    if (items[i]['originalFilename']) {
      filenames.push(items[i]['originalFilename']);
    }
  }

  // auto complete
  this.autoComplete = goog.ui.ac.createSimpleAutoComplete(filenames, input, false);
  renderer = this.autoComplete.getRenderer();
  renderer.redraw();

  // dispose されていなければ描画
  if (this.getElement() !== null) {
    goog.style.setStyle(
      renderer.getElement(),
      'z-index',
      goog.style.getComputedStyle(this.getElement(), 'z-index')
    );
  }
};


});

