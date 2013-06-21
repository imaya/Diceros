goog.provide('imaya.ui.HSVColorPickerMenuButton');

goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButton');
goog.require('imaya.ui.HSVColorPicker');



/**
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption.
 * @param {goog.ui.Menu=} opt_menu Menu to render under the button when clicked;
 *     should contain at least one {@link goog.ui.ColorPalette} if present.
 * @param {goog.ui.MenuButtonRenderer=} opt_renderer Button renderer;
 *     defaults to {@link goog.ui.ColorMenuButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.MenuButton}
 */
imaya.ui.HSVColorPickerMenuButton =
function(content, opt_menu, opt_renderer, opt_domHelper) {
  goog.base(this, content, opt_menu, opt_renderer || goog.ui.ColorMenuButtonRenderer.getInstance(), opt_domHelper);
};
goog.inherits(imaya.ui.HSVColorPickerMenuButton, goog.ui.MenuButton);

/**
 * Factory method that creates and returns a new {@link goog.ui.Menu} instance
 * containing default color palettes.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @return {goog.ui.Menu} Color menu.
 */
imaya.ui.HSVColorPickerMenuButton.newColorMenu = function(opt_domHelper) {
  var menu = new goog.ui.Menu(opt_domHelper);
  var picker = new imaya.ui.HSVColorPicker();

  menu.addChild(picker, true);

  return menu;
};


/**
 * Returns the currently selected color (null if none).
 * @return {?string} The selected color.
 */
imaya.ui.HSVColorPickerMenuButton.prototype.getSelectedColor = function() {
  return /** @type {string} */ (this.getValue());
};


/**
 * Sets the selected color, or clears the selected color if the argument is
 * null or not any of the available color choices.
 * @param {?string} color New color.
 */
imaya.ui.HSVColorPickerMenuButton.prototype.setSelectedColor = function(color) {
  this.setValue(color);
};

imaya.ui.HSVColorPickerMenuButton.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.setValue('black');
};

/**
 * Handles {@link goog.ui.Component.EventType.ACTION} events dispatched by
 * the menu item clicked by the user.  Updates the button, calls the superclass
 * implementation to hide the menu, stops the propagation of the event, and
 * dispatches an ACTION event on behalf of the button itself.  Overrides
 * {@link goog.ui.MenuButton#handleMenuAction}.
 * @param {goog.events.Event} e Action event to handle.
 * @override
 */
imaya.ui.HSVColorPickerMenuButton.prototype.handleMenuAction = function(e) {
  if (typeof e.target.getSelectedColor == 'function') {
    // User clicked something that looks like a color palette.
    this.setValue(e.target.getSelectedColor());
  } else if (e.target.getValue() == goog.ui.ColorMenuButton.NO_COLOR) {
    // User clicked the special "no color" menu item.
    this.setValue(null);
  }
  goog.ui.ColorMenuButton.superClass_.handleMenuAction.call(this, e);
  e.stopPropagation();
  this.dispatchEvent(goog.ui.Component.EventType.ACTION);
};


/**
 * Opens or closes the menu.  Overrides {@link goog.ui.MenuButton#setOpen} by
 * generating a default color menu on the fly if needed.
 * @param {boolean} open Whether to open or close the menu.
 * @param {goog.events.Event=} opt_e Mousedown event that caused the menu to
 *     be opened.
 * @override
 */
imaya.ui.HSVColorPickerMenuButton.prototype.setOpen = function(open, opt_e) {
  var menubutton = this;
  var menu;
  var picker;

  if (open && this.getItemCount() == 0) {
    menu = imaya.ui.HSVColorPickerMenuButton.newColorMenu(this.getDomHelper());
    this.setMenu(menu);
    picker = menu.getChildAt(0);
    picker.onChange(function(picker) {
      menubutton.setValue('rgb(' + picker.getRGB().join(',') + ')');
    });
    this.setValue(/** @type {?string} */ (this.getValue()));
  }
  imaya.ui.HSVColorPickerMenuButton.superClass_.setOpen.call(this, open, opt_e);
};


// Register a decorator factory function for goog.ui.ColorMenuButtons.
goog.ui.registry.setDecoratorByClassName(
  goog.ui.ColorMenuButtonRenderer.CSS_CLASS,
  function() {
    return new imaya.ui.HSVColorPickerMenuButton(null);
  });