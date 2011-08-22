goog.provide('application.Diceros.util');

goog.require('goog.array');

application.Diceros.util.addClass = function(elm, className) {
  var classes = elm.className.split(/\s+/);

  classes.push(className);
  goog.array.removeDuplicates(classes);

  elm.className = classes.join(' ');
};

application.Diceros.util.prepend = function(elm, node) {
  elm.insertBefore(node, elm.firstChild);
};

application.Diceros.util.data = function(elm, label, data) {
  elm.application_data = elm.application_data || {};

  if (typeof data === 'undefined') {
    return elm.application_data[label];
  }

  return (elm.application_data[label] = data);
}

application.Diceros.util.scrollBarWidth = function() { 
  var body = document.body,
      width,
      defaultOverflow = body.style.overflow;

  body.style.overflow = 'hidden';
  width = body.clientWidth;

  body.style.overflow = 'scroll';
  width -= body.clientWidth;

  if (!width) {
    width = body.offsetWidth - body.clientWidth;
  }
  body.style.overflow = defaultOverflow;

  return width;
};

/* vim:set expandtab ts=2 sw=2 tw=80: */
