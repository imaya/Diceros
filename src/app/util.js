goog.provide('Diceros.util');

goog.require('goog.array');

Diceros.util.addClass = function(elm, className) {
  var classes = elm.className.split(/\s+/);

  classes.push(className);
  goog.array.removeDuplicates(classes);

  elm.className = classes.join(' ');
};

Diceros.util.prepend = function(elm, node) {
  elm.insertBefore(node, elm.firstChild);
};

/**
 * @param {Element} elm 対象要素.
 * @param {string} label データラベル.
 * @param {*=} opt_data 埋め込むデータ. 省略時はデータ取得となる.
 * @return {*} 埋め込まれたデータ.
 */
Diceros.util.data = function(elm, label, opt_data) {
  elm.application_data = elm.application_data || {};

  if (opt_data === void 0) {
    return elm.application_data[label];
  }

  return (elm.application_data[label] = opt_data);
}

Diceros.util.scrollBarWidth = function() { 
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
