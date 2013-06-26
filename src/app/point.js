goog.provide('Diceros.Point');

goog.scope(function() {
/**
 * 座標やペンの太さなどを表すクラス
 * @param {number} x X座標を表す.
 * @param {number} y Y座標を表す.
 * @param {?number=} opt_width 太さを表す. 太さを持たない場合は null を指定する.
 * @param {boolean=} opt_noPressure 筆圧を利用しない.
 * @constructor
 */
Diceros.Point = function(x, y, opt_width, opt_noPressure) {
  /**
   * クラス名
   * @type {string}
   */
  this.name = 'Point';
  /**
   * X 座標
   * @type {number}
   */
  this.x = x;
  /**
   * Y 座標
   * @type {number}
   */
  this.y = y;

  if (isNaN(x) || isNaN(y)) {
    throw 'NaN error';
  }

  /**
   * 太さ
   * @type {?number}
   */
  this.width = null;
  if (typeof opt_width === 'number') {
    // XXX: 1 -> currentPenWidth / magic number
    this.width = opt_noPressure ? opt_width : (opt_width * this.getPressure());
  }
};

/**
 * @param {goog.events.BrowserEvent} ev browser event.
 * @param {number=} opt_baseWidth base point width.
 * @param {boolean=} opt_noPressure if true, no use pressure.
 * @return {Diceros.Point} new point object.
 */
Diceros.Point.createFromEvent = function(ev, opt_baseWidth, opt_noPressure) {
  /** @type {Diceros.Point} */
  var obj;
  /** @type {number} */
  var x;
  /** @type {number} */
  var y;
  /** @type {Element} */
  ev.target;
  /** @type {goog.math.Coordinate} */
  var offset = goog.style.getPageOffset(ev.target);
  /** @type {Touch} */
  var touch;

  // touch
  /*
  if (ev.type.indexOf('touch') === 0) {
    touch = ev.getBrowserEvent().changedTouches[0];
    x = touch.pageX - offset.x; // XXX
    y = touch.pageY - offset.y; // XXX

  // mouse
  } else {
    x = ev.getBrowserEvent().pageX - offset.x;
    y = ev.getBrowserEvent().pageY - offset.y;
  }
  */
  x = ev.x;
  y = ev.y;

  obj = new Diceros.Point(x, y, opt_baseWidth, opt_noPressure);

  if (!opt_noPressure) {
    obj.width *= obj.getPressure(ev);
  }

  return obj;
};

/**
 * 筆圧を0.0-1.0の範囲で取得する
 * @param {goog.events.BrowserEvent=} opt_event browser event object.
 * @return {number} 筆圧(0.0-1.0).
 */
Diceros.Point.prototype.getPressure = function(opt_event) {
  /** @type {Element} */
  var plugin = this.getWacomPlugin();
  /** @type {Event} */
  var browserEvent;
  /** @type {Touch} */
  var touch;

  // Wacom プラグイン
  if (plugin && plugin['penAPI'] && plugin['penAPI']['isWacom'] &&
    plugin['penAPI']['pointerType'] === 1) {
    return plugin['penAPI']['pressure'];
  }

  // Touch イベント
  if (opt_event !== void 0) {
    browserEvent = opt_event.getBrowserEvent();

    // touch event
    if (opt_event.type.indexOf('touch') === 0) {
      touch = browserEvent.changedTouches[0];

      // force property
      if (typeof touch['webkitForce'] === 'number') {
        return touch['webkitForce'];
      }
      if (typeof touch['force'] === 'number') {
        return touch['force'];
      }
    // Pointer Events
    } else if (browserEvent.type.toLowerCase().indexOf('pointer') !== -1) {
      if (browserEvent['pointerType'] === MSPointerEvent['MSPOINTER_TYPE_PEN']) {
        return browserEvent['pressure'];
      } else {
        return 1;
      }
    }
  }

  // プラグイン未検出
  Diceros.Point.plugin = null;
  return 1;
};

/**
 * ペンタブレットのプラグイン
 * @return {Element} wacom plugin.
 */
Diceros.Point.prototype.getWacomPlugin = function() {
  return document.querySelector('object[type="application/x-wacomtabletplugin"]');
};

// ロード確認
window.addEventListener('DOMContentLoaded', function() {
  var plugin = Diceros.Point.prototype.getWacomPlugin();

  if (plugin && plugin['penAPI']) {
    goog.global.console.log('wacom-plugin: version ' + plugin.version);
  }
}, false);

// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
