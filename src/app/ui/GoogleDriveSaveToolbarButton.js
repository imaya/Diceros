goog.provide('imaya.ui.GoogleDriveSaveToolbarButton');

goog.require('imaya.ui.GoogleDriveSaveButton');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.ToolbarButtonRenderer');
goog.require('goog.ui.registry');



/**
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption.
 * @param {goog.ui.ButtonRenderer=} opt_renderer Optional renderer used to
 *     render or decorate the button; defaults to
 *     {@link goog.ui.ToolbarButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {imaya.ui.GoogleDriveSaveButton}
 */
imaya.ui.GoogleDriveSaveToolbarButton = function(content, opt_renderer, opt_domHelper) {
  goog.base(this, content, opt_renderer ||
    goog.ui.ToolbarButtonRenderer.getInstance(), opt_domHelper);
};
goog.inherits(imaya.ui.GoogleDriveSaveToolbarButton, imaya.ui.GoogleDriveSaveButton);


// Registers a decorator factory function for toolbar buttons.
goog.ui.registry.setDecoratorByClassName(
  goog.ui.ToolbarButtonRenderer.CSS_CLASS,
  function() {
    return new imaya.ui.GoogleDriveSaveToolbarButton(null);
  });
