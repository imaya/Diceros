goog.provide('imaya.ui.GoogleDriveSaveDialog');

goog.require('imaya.ui.GooglePickerAPI');
goog.require('goog.ui.Prompt');
goog.require('goog.ui.Resizable');


goog.scope(function() {
  /**
   * @param {string} promptTitle
   * @param {function(string)} callback
   * @param {string=} opt_defaultValue
   * @param {string=} opt_class
   * @param {boolean=} opt_useIframeForIE
   * @param {goog.dom.DomHelper=} opt_domHelper
   * @constructor
   * @extends {goog.ui.Prompt}
   */
imaya.ui.GoogleDriveSaveDialog = function(promptTitle, callback, opt_defaultValue, opt_class, opt_useIframeForIE, opt_domHelper)  {
  goog.base(this, promptTitle, 'input filename', callback, opt_defaultValue, opt_class, opt_useIframeForIE, opt_domHelper);

};
goog.inherits(imaya.ui.GoogleDriveSaveDialog, goog.ui.Prompt);

imaya.ui.GoogleDriveSaveDialog.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var element = this.getElement();
  var resizable = this.resizable =  new goog.ui.Resizable(
    element,
    {
      minWidth: 300,
      minHeight: 200
    }
  );

  // size
  var content = this.getContentElement();
  goog.style.setBorderBoxSize(
    content,
    new goog.math.Size(300, 200)
  );

  var tmpSize = goog.style.getSize(element);



  goog.events.listen(resizable,
    goog.ui.Resizable.EventType.RESIZE,
    function(e) {
      var content = this.getContentElement();
      var oldContentSize = goog.style.getBorderBoxSize(content);
      var dialogSize = e.size;
      var newContentSize = new goog.math.Size(
        oldContentSize.width + (dialogSize.width - tmpSize.width),
        oldContentSize.height + (dialogSize.height - tmpSize.height)
      );
      goog.style.setBorderBoxSize(content, newContentSize);

      tmpSize = dialogSize;
    }
  );

  this.loadList();
};

imaya.ui.GoogleDriveSaveDialog.prototype.loadList = function() {
  gapi.client.load('drive', 'v2', function() {
    var request = gapi.client.drive.files.list();

    request.execute(function(obj, jsonText) {
      if (!obj || obj.error) {
        return;
      }
    });

  });
};


});

