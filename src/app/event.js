goog.provide('Diceros.Event');

goog.scope(function() {

Diceros.Event = function(opt_event, opt_target) {
  goog.base(this, opt_event, opt_target);
  /** @type {number} */
  this.x;
  /** @type {number} */
  this.y;
};
goog.inherits(Diceros.Event, goog.events.BrowserEvent);

});