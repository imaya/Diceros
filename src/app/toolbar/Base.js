goog.provide('Diceros.ToolbarItem.Base');

goog.scope(function() {

/**
 * @param {Diceros.Application} app
 * @interface
 */
Diceros.ToolbarItem.Base = function(app) {};
Diceros.ToolbarItem.Base.prototype.decorate = goog.abstractMethod;
Diceros.ToolbarItem.Base.prototype.refresh = goog.abstractMethod;

});