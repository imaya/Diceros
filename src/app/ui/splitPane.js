goog.provide('imaya.ui.SplitPane');

goog.require('goog.ui.SplitPane');

goog.scope(function() {

/**
 * @param {goog.ui.Component} firstComponent Left or Top component.
 * @param {goog.ui.Component} secondComponent Right or Bottom component.
 * @param {goog.ui.SplitPane.Orientation} orientation SplitPane orientation.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @extends {goog.ui.SplitPane}
 * @constructor
 */
imaya.ui.SplitPane =
  function(firstComponent, secondComponent, orientation, opt_domHelper) {
  goog.base(this, firstComponent, secondComponent, orientation, opt_domHelper);

  /** @type {boolean} */
  this.snapFirst = true;
  /** @type {number} */
  this.snapTime = 200;
};
goog.inherits(imaya.ui.SplitPane, goog.ui.SplitPane);

/** @enum {string} */
imaya.ui.SplitPane.EventType = goog.ui.SplitPane.EventType;

/** @enum {string} */
imaya.ui.SplitPane.Orientation = goog.ui.SplitPane.Orientation;


/**
 * @param {goog.events.Event} e The event.
 * @override
 * @private
 */
imaya.ui.SplitPane.prototype.handleDragStart_ = function(e) {
  goog.base(this, 'handleDragStart_', e);

  /** @type {number} */
  this.dragStartTime_ = Date.now ? Date.now() : +new Date();
};

/**
 * @param {goog.events.Event} e The event.
 * @override
 * @private
 */
imaya.ui.SplitPane.prototype.handleDragEnd_ = function(e) {
  goog.base(this, 'handleDragEnd_', e);

  /** @type {number} */
  this.dragEndTime_ = Date.now ? Date.now() : +new Date();

  if (this.dragEndTime_ - this.dragStartTime_ < this.snapTime) {
    this.snapIt_();
  }
};

/**
 * snap する方向を設定する.
 * @param {boolean} secondToFirst second component から first component の向きか.
 */
imaya.ui.SplitPane.prototype.setSnapDirection = function(secondToFirst) {
  this.snapFirst = secondToFirst;
};

/**
 * ドラッグ開始から snap するまでの猶予時間を設定.
 * @param {number} time
 */
imaya.ui.SplitPane.prototype.setSnapTime = function(time) {
  this.snapTime = time;
};

/**
 * snap する.
 */
imaya.ui.SplitPane.prototype.snap = function() {
  this.snapIt_();
};

/**
 * Snap the container to the left or top on a Double-click.
 * @private
 */
imaya.ui.SplitPane.prototype.snapIt_ = function() {
  var splitpaneSize = goog.style.getBorderBoxSize(this.getElement());
  var handlePos = goog.style.getRelativePosition(this.splitpaneHandle_,
    this.firstComponentContainer_);
  var firstBorderBoxSize =
    goog.style.getBorderBoxSize(this.firstComponentContainer_);
  var firstContentBoxSize =
    goog.style.getContentBoxSize(this.firstComponentContainer_);

  var isVertical = this.isVertical();

  // Where do we snap the handle (what size to make the component) and what
  // is the current handle position.
  var snapSize;
  var handlePosition;
  if (isVertical) {
    snapSize = firstBorderBoxSize.height - firstContentBoxSize.height;
    if (!this.snapFirst) {
      snapSize = splitpaneSize.height - this.handleSize_ - snapSize;
    }
    handlePosition = handlePos.y;
  } else {
    snapSize = firstBorderBoxSize.width - firstContentBoxSize.width;
    if (!this.snapFirst) {
      snapSize = splitpaneSize.width - this.handleSize_ - snapSize;
    }
    handlePosition = handlePos.x;
  }

  if (Math.abs(snapSize - handlePosition) < 5) {
    // This means we're 'unsnapping', set it back to where it was.
    this.setFirstComponentSize(this.savedSnapSize_);
  } else {
    // This means we're 'snapping', set the size to snapSize, and hide the
    // first component.
    if (isVertical) {
      this.savedSnapSize_ = goog.style.getBorderBoxSize(
        this.firstComponentContainer_).height;
    } else {
      this.savedSnapSize_ = goog.style.getBorderBoxSize(
        this.firstComponentContainer_).width;
    }
    this.setFirstComponentSize(snapSize);
  }
};

});