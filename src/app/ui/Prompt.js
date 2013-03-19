goog.provide('imaya.ui.Prompt');

goog.require('goog.ui.Prompt');

/**
 * @inheritDoc
 * @constructor
 * @extends {goog.ui.Prompt}
 */
imaya.ui.Prompt = function(promptTitle, promptText, callback, opt_defaultValue,
                          opt_class, opt_useIframeForIE, opt_domHelper) {
  goog.base(this, promptTitle, promptText, callback, opt_defaultValue, opt_class, opt_useIframeForIE, opt_domHelper);
};
goog.inherits(imaya.ui.Prompt, goog.ui.Prompt);


/**
 * Create the initial DOM representation for the prompt.
 * @override
 */
imaya.ui.Prompt.prototype.createDom = function() {
  // goog.ui.Prompt ではなく goog.ui.Prompt のスーパークラスの createDom を呼ぶ
  goog.ui.Prompt.superClass_.createDom.call(this);

  var cls = this.getClass();

  // add input box to the content
  var attrs = {
    'className': goog.getCssName(cls, 'userInput'),
    'value': this.defaultValue_};
  if (this.rows_ == 1) {
    // If rows == 1 then use an input element.
    this.userInputEl_ = /** @type {HTMLInputElement} */
      (this.getDomHelper().createDom('input', attrs));
    this.userInputEl_.type = 'text';
    if (this.cols_) {
      this.userInputEl_.size = this.cols_;
    }
  } else {
    // If rows > 1 then use a textarea.
    this.userInputEl_ = /** @type {HTMLInputElement} */
      (this.getDomHelper().createDom('textarea', attrs));
    this.userInputEl_.rows = this.rows_;
    if (this.cols_) {
      this.userInputEl_.cols = this.cols_;
    }
  }

  this.userInputEl_.id = this.inputElementId_;

  this.getButtonElement().insertBefore(this.userInputEl_, this.getButtonElement().firstChild);

  if (this.rows_ > 1) {
    // Set default button to null so <enter> will work properly in the textarea
    this.getButtonSet().setDefault(null);
  }
};

imaya.ui.Prompt.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  /*
  //goog.style.setStyle(this.getElement(), 'box-sizing', 'border-box');
  goog.style.setBorderBoxSize(this.getElement(), goog.style.getBorderBox(this.getElement()));
  //goog.style.setStyle(this.getButtonElement(), 'box-sizing', 'border-box');
  goog.style.setBorderBoxSize(this.getButtonElement(), goog.style.getBorderBox(this.getButtonElement()));
  goog.style.setBorderBoxSize(this.getInputElement(), goog.style.getBorderBox(this.getInputElement()));
  */
};
