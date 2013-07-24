goog.provide('imaya.ui.GoogleDriveSaveDialog');

goog.require('imaya.ui.GooglePickerAPI');
goog.require('imaya.ui.Prompt');
goog.require('goog.ui.Resizable');
goog.require('goog.ui.ac');
goog.require('goog.date.DateTime');
goog.require('goog.ui.TableSorter');
goog.require('goog.object');


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
  goog.base(this, promptTitle, 'loading...', callback, opt_defaultValue, opt_class, opt_useIframeForIE, opt_domHelper);

  /** @type {goog.ui.Resizable} */
  this.resizable;
  /** @type {HTMLTableRowElement} */
  this.currentSelected;
  /** @type {Array.<Object>} */
  this.items;
  /** @type {Object} */
  this.filenameToId = {};
};
goog.inherits(imaya.ui.GoogleDriveSaveDialog, imaya.ui.Prompt);

imaya.ui.GoogleDriveSaveDialog.prototype.getFilenameToIdTable = function() {
  return this.filenameToId;
};


imaya.ui.GoogleDriveSaveDialog.prototype.createDom = function() {
  goog.base(this, 'createDom');

  this.resizable =  new goog.ui.Resizable(
    this.getElement(),
    {
      handles: goog.ui.Resizable.Position.BOTTOM_RIGHT,
      minWidth: 600,
      minHeight: 400
    }
  );

  goog.style.setStyle(this.getContentElement(), {'padding': 0});

  this.addChild(this.resizable);
};

imaya.ui.GoogleDriveSaveDialog.prototype.enterDocument = function() {
  /** @type {imaya.ui.GoogleDriveSaveDialog} */
  var dialog = this;
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
      size: new goog.math.Size(600, 400)
    });
    dialog.reposition();
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
    goog.style.setStyle(buttons[i], {
      'margin-left': '0.25em',
      'margin-right': '0.25em'
    });
    box = goog.style.getMarginBox(buttons[i]);
    buttonsWidth += goog.style.getBorderBoxSize(buttons[i]).width + box.left + box.right;
  }
  buttonsSize.width = newContentSize.width;
  goog.style.setBorderBoxSize(button, buttonsSize);

  // dialog input
  inputSize.width = goog.style.getContentBoxSize(button).width - buttonsWidth - 10;
  inputSize.height = 25;
  goog.style.setStyle(input, {
    'float': 'left',
    'font-size': '13px'
  });
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

imaya.ui.GoogleDriveSaveDialog.prototype.createFileIdList = function(items) {
  /** @type {Object} */
  var table = this.filenameToId;

  items.forEach(function(item) {
    if (!item['originalFilename'] || item['originalFilename'] in table) {
      return;
    }

    table[item['originalFilename']] = item['id'];
  });
};

imaya.ui.GoogleDriveSaveDialog.prototype.createItemTable = function(items) {
  /** @type {imaya.ui.GoogleDriveSaveDialog} */
  var dialog = this;
  /** @type {HTMLTableElement} */
  var table;
  /** @type {HTMLTableSectionElement} */
  var thead;
  /** @type {HTMLTableSectionElement} */
  var tbody;
  /** @type {HTMLTableRowElement} */
  var tr;
  /** @type {goog.ui.TableSorter} */
  var sorter;

  table = /** @type {HTMLTableElement} */(goog.dom.createElement('table'));
  thead = /** @type {HTMLTableSectionElement} */(goog.dom.createElement('thead'));
  tbody = /** @type {HTMLTableSectionElement} */(goog.dom.createElement('tbody'));
  tr = /** @type {HTMLTableRowElement} */(goog.dom.createElement('tr'));

  goog.style.setStyles(tr, '<th>filename</th><th>last modified</th>');
  goog.dom.classes.add(thead, goog.getCssName('googl-drive-save-dialog-header'));
  goog.style.setStyle(table, 'width', '100%');

  items.forEach(function(item){
    var padding = imaya.ui.GoogleDriveSaveDialog.StringPadding;
    var tr = goog.dom.createElement('tr');
    var td;
    var date = goog.date.DateTime.fromRfc822String(item['modifiedDate']);

    if (!item['originalFilename']) {
      return;
    }

    goog.dom.classes.add(tr, goog.getCssName('google-drive-save-dialog-row'));

    td = goog.dom.createElement('td');
    td.textContent = item['originalFilename'];
    goog.dom.classes.add(
      td,
      goog.getCssName('google-drive-save-dialog-column'),
      goog.getCssName('google-drive-save-dialog-filename')
    );
    tr.appendChild(td);
    goog.events.listen(tr, goog.events.EventType.CLICK, function() {
      if (dialog.currentSelected) {
        goog.dom.classes.remove(
          dialog.currentSelected,
          goog.getCssName('google-drive-save-dialog-selected')
        );
      }
      dialog.getInputElement().value = item['originalFilename'];
      goog.dom.classes.add(
        dialog.currentSelected = this,
        goog.getCssName('google-drive-save-dialog-selected')
      );
    });

    td = goog.dom.createElement('td');
    td.textContent = [
      padding(date.getFullYear(), '0', 4),
      padding(date.getMonth()+1,  '0', 2),
      padding(date.getDate(),     '0', 2)
    ].join('/') + ' ' + [
      padding(date.getHours(),   '0', 2),
      padding(date.getMinutes(), '0', 2),
      padding(date.getSeconds(), '0', 2)
    ].join(':');
    tr.appendChild(td);

    tbody.appendChild(tr);
  });

  thead.appendChild(tr);
  table.appendChild(thead);
  table.appendChild(tbody);

  // sorter
  sorter = new goog.ui.TableSorter();
  sorter.decorate(table);
  sorter.setSortFunction(0, goog.ui.TableSorter.alphaSort);
  sorter.setSortFunction(1, goog.ui.TableSorter.createReverseSort(goog.ui.TableSorter.alphaSort));

  return table;
};

/**
 * @param {number} number
 * @param {string} paddingChar
 * @param {number} paddingLength
 * @returns {string}
 */
imaya.ui.GoogleDriveSaveDialog.StringPadding = function(number, paddingChar, paddingLength) {
  /** @type {string} */
  var str = '';
  /** @type {number} */
  var i;

  for (i = 0; i < paddingLength; ++i) {
    str += paddingChar;
  }
  str += number;

  return str.substr(-paddingLength, paddingLength);
};

imaya.ui.GoogleDriveSaveDialog.prototype.handleResponse = function(obj, jsonText) {
  /** @type {goog.events.EventTarget} */
  var renderer;
  /** @type {Element} */
  var input = this.getInputElement();
  /** @type {HTMLDivElement} */
  var div = /** @type {HTMLDivElement} */(goog.dom.createElement('div'));
  /** @type {Array.<Object>} */
  var items;

  if (!obj || obj.error) {
    return;
  }

  items = this.items = /** @type {Array.<Object>} */(obj['items']);

  // create file-id list
  this.createFileIdList(items);

  // create table container
  this.clearContent();
  div.appendChild(this.createItemTable(items));
  goog.style.setStyle(div, {
    'overflow': 'auto',
    'width': '100%',
    'height': '100%'
  });
  this.getContentElement().appendChild(div);

  // auto complete
  this.autoComplete =
    goog.ui.ac.createSimpleAutoComplete(this.getFilenames(items), input, false);
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

/**
 * @param {Array.<Object>} items
 * @return {Array.<string>}
 */
imaya.ui.GoogleDriveSaveDialog.prototype.getFilenames = function(items) {
  /** @type {Object} */
  var filenames = {};
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  for (i = 0, il = items.length; i < il; ++i) {
    if (items[i]['originalFilename']) {
      filenames[items[i]['originalFilename']] = true;
    }
  }

  return goog.object.getKeys(filenames);
};

imaya.ui.GoogleDriveSaveDialog.prototype.clearContent = function() {
  /** @type {HTMLElement} */
  var content = /** @type {HTMLElement} */(this.getContentElement());

  while (content.childNodes.length) {
    content.removeChild(content.firstChild);
  }
};


});

