goog.provide('imaya.ui.ToolbarHSVColorPickerMenuButton');

goog.require('imaya.ui.HSVColorPickerMenuButton');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.ToolbarColorMenuButtonRenderer');
goog.require('goog.ui.registry');



/**
 * A color menu button control for a toolbar.
 *
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption.
 * @param {goog.ui.Menu=} opt_menu Menu to render under the button when clicked;
 *     should contain at least one {@link goog.ui.ColorPalette} if present.
 * @param {goog.ui.ColorMenuButtonRenderer=} opt_renderer Optional
 *     renderer used to render or decorate the button; defaults to
 *     {@link imaya.ui.ToolbarHSVColorPickerMenuButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {imaya.ui.HSVColorPickerMenuButton}
 */
imaya.ui.ToolbarHSVColorPickerMenuButton = function(
  content, opt_menu, opt_renderer, opt_domHelper) {
  goog.base(this, content, opt_menu, opt_renderer ||
    goog.ui.ToolbarColorMenuButtonRenderer.getInstance(), opt_domHelper);
};
goog.inherits(imaya.ui.ToolbarHSVColorPickerMenuButton, imaya.ui.HSVColorPickerMenuButton);


// Registers a decorator factory function for toolbar color menu buttons.
goog.ui.registry.setDecoratorByClassName(
  goog.getCssName('goog-toolbar-color-menu-button'),
  function() {
    return new imaya.ui.ToolbarHSVColorPickerMenuButton(null);
  });