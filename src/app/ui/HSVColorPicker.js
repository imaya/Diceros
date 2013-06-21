goog.provide('imaya.ui.HSVColorPicker');

goog.require('goog.ui.Control');

/**
 * @param {Object=} opt_params
 * @constructor
 * @extends {goog.ui.Control}
 */
imaya.ui.HSVColorPicker = function(opt_params) {
  goog.base(this, null);
  opt_params = opt_params || {};
  /** @type {HTMLCanvasElement} */
  this.huePointer;
  /** @type {number} */
  this.size = opt_params['size'] || 320;
  /** @type {number} */
  this.circleWidth = opt_params['hueCircleWidth'] || 30;
  /** @type {number} */
  this.pointerSize = opt_params['pointerSize'] || 30;
  /** @type {number} */
  this.pointerWidth= opt_params['pointerWidth'] || 5;
  /** @type {number} */
  this.hue = 0;
  /** @type {number} */
  this.saturation = typeof opt_params['saturation'] === 'number' ? opt_params['saturation'] : 1;
  /** @type {number} */
  this.value = typeof opt_params['saturation'] === 'number' ? opt_params['saturation'] : 0;
  /** @type {number} */
  this.svWidth;
  /** @type {number} */
  this.svHeight;
  /** @type {number} */
  this.svLeftTopX;
  /** @type {number} */
  this.svLeftTopY;
  /** @type {boolean} */
  this.hueDrag;
  /** @type {boolean} */
  this.svDrag;
};
goog.inherits(
  imaya.ui.HSVColorPicker,
  goog.ui.Control
);

imaya.ui.HSVColorPicker.prototype.createDom = function() {
  goog.base(this, 'createDom');

  goog.style.setStyle(this.getContentElement(), {
    'position': 'relative',
    'width': this.size + "px",
    'height': this.size + "px"
  });

  // hue circle
  this.hueCircle = document.createElement('canvas');
  this.hueCircle.style.position = "absolute";
  this.getContentElement().appendChild(this.hueCircle);

  // sv box
  this.sv = document.createElement('div');
  this.sv.style.position = "absolute";
  this.initSV();
  this.s = document.createElement('canvas');
  this.s.style.position = "absolute";
  this.initS();
  this.v = document.createElement('canvas');
  this.v.style.position = "absolute";
  this.initV();

  this.sv.appendChild(this.s);
  this.sv.appendChild(this.v);
  this.getContentElement().appendChild(this.sv);

  // hue pointer
  this.huePointer =
    /** @type {HTMLCanvasElement} */(document.createElement('canvas'));
  this.huePointer.width = this.huePointer.height = this.pointerSize;
  this.huePointer.style.position = "absolute";
  this.renderHue(this.huePointer);
  this.getContentElement().appendChild(this.huePointer);

  // sv pointer
  this.svPointer = document.createElement('canvas');
  this.svPointer.width = this.svPointer.height = this.pointerSize;
  this.svPointer.style.position = "absolute";
  this.renderSV(this.svPointer);
  this.getContentElement().appendChild(this.svPointer);
};

imaya.ui.HSVColorPicker.prototype.getHSV = function() {
  return [this.hue, this.saturation, this.value];
};

imaya.ui.HSVColorPicker.prototype.getRGB = function() {
  return this.hsvToRgb(this.hue, this.saturation, this.value);
};

imaya.ui.HSVColorPicker.prototype.onChange = function(callback) {
  this.onChangeCallback = callback;
};

imaya.ui.HSVColorPicker.prototype.refreshPointer = function() {
  /** @type {number} */
  var size = this.size;
  /** @type {number} */
  var centerX = size / 2;
  /** @type {number} */
  var centerY = size / 2;
  /** @type {number} */
  var radius = (size - this.circleWidth) / 2;
  /** @type {number} */
  var x = radius * Math.cos(this.hue / 180 * Math.PI) - this.pointerSize / 2;
  /** @type {number} */
  var y = radius * Math.sin(this.hue / 180 * Math.PI) - this.pointerSize / 2;

  this.huePointer.style.left = centerX + x + 'px';
  this.huePointer.style.top  = centerY + y + 'px';

  this.svPointer.style.left = this.svLeftTopX + (1 - this.saturation) * this.svWidth - this.pointerSize / 2 + 'px';
  this.svPointer.style.top = this.svLeftTopX + (1 - this.value) * this.svHeight - this.pointerSize / 2 + 'px';
};

imaya.ui.HSVColorPicker.prototype.enterDocument = function() {
  this.renderHueCircle();
  this.renderSVBox();
  this.refreshPointer();
  this.setEvent();

  if (typeof this.onChangeCallback === 'function') {
    this.onChangeCallback(this);
  }
};

imaya.ui.HSVColorPicker.prototype.setEvent = function() {
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;
  /** @type {Array.<string>} */
  var captureEvents = [
    "mousedown",
    "mousemove",
    "mouseup",
    "touchstart",
    "touchmove",
    "touchend"
  ];

  for (i = 0, il = captureEvents.length; i < il; ++i) {
    this.getContentElement().addEventListener(captureEvents[i], this.eventHandler.bind(this), false);
  }
};

imaya.ui.HSVColorPicker.prototype.eventHandler = function(ev) {
  /** @type {Element} */
  var element = this.getContentElement();
  /** @type {ClientRect} */
  var containerRect = element.getBoundingClientRect();
  /** @type {number} */
  var x = (ev.type.toLowerCase().indexOf('touch') === -1 ?
    ev.clientX : ev.changedTouches[0].clientX) - containerRect.left;
  /** @type {number} */
  var y = (ev.type.toLowerCase().indexOf('touch') === -1 ?
    ev.clientY : ev.changedTouches[0].clientY) - containerRect.top;
  /** @type {CanvasRenderingContext2D} */
  var ctx =
    /** @type {CanvasRenderingContext2D} */(this.hueCircle.getContext('2d'));

  ev.preventDefault();

  switch (ev.type) {
    case 'touchstart':
    /* FALLTHROUGH */
    case 'mousedown':
      // hue ?
      ctx.beginPath();
      this.createHueCirclePath(ctx);
      if (ctx.isPointInPath(x, y)) {
        this.hueDrag = true;
        this.setHue(this.calcHue_(x, y));
        this.refreshPointer();
        if (typeof this.onChangeCallback === 'function') {
          this.onChangeCallback(this);
        }
      }

      // sv ?
      ctx.beginPath();
      ctx.rect(
        this.svLeftTopX,
        this.svLeftTopY,
        this.svWidth,
        this.svHeight
      );
      if (ctx.isPointInPath(x, y)) {
        this.svDrag = true;
        this.setSaturation(this.calcSaturation_(x));
        this.setValue(this.calcValue_(y));
        this.refreshPointer();
        if (typeof this.onChangeCallback === 'function') {
          this.onChangeCallback(this);
        }
      }

      break;
    case 'touchmove':
    /* FALLTHROUGH */
    case 'mousemove':
      if (this.hueDrag) {
        this.setHue(this.calcHue_(x, y));
        this.refreshPointer();
        if (typeof this.onChangeCallback === 'function') {
          this.onChangeCallback(this);
        }
      }

      if (this.svDrag) {
        this.setSaturation(this.calcSaturation_(x));
        this.setValue(this.calcValue_(y));
        this.refreshPointer();
        if (typeof this.onChangeCallback === 'function') {
          this.onChangeCallback(this);
        }
      }
      break;
    case 'touchend':
    /* FALLTHROUGH */
    case 'mouseup':
      if (this.hueDrag) {
        this.hueDrag = false;
        this.setHue(this.calcHue_(x, y));
        this.refreshPointer();
        if (typeof this.onChangeCallback === 'function') {
          this.onChangeCallback(this);
        }
      }

      if (this.svDrag) {
        this.svDrag = false;
        this.setSaturation(this.calcSaturation_(x));
        this.setValue(this.calcValue_(y));
        this.refreshPointer();
        if (typeof this.onChangeCallback === 'function') {
          this.onChangeCallback(this);
        }
      }
      break;
  }
};

imaya.ui.HSVColorPicker.prototype.calcHue_ = function(x, y) {
  /** @type {number} */
  var size = this.size;
  /** @type {number} */
  var centerX = size / 2;
  /** @type {number} */
  var centerY = size / 2;
  /** @type {number} */
  var angle = this.radToAngle_(Math.atan2(y - centerY, x - centerX));

  return angle < 0 ? angle + 360 : angle;
};

imaya.ui.HSVColorPicker.prototype.setHue = function(hue) {
  this.hue = hue;
  this.renderSVBox();
};

imaya.ui.HSVColorPicker.prototype.calcSaturation_ = function(x) {
  /** @type {number} */
  var saturation = 1 - (x - this.svLeftTopX) / this.svWidth;

  return saturation < 0 ? 0 :
    saturation > 1 ? 1 :
      saturation;
};

imaya.ui.HSVColorPicker.prototype.setSaturation = function(saturation) {
  this.saturation = saturation;
};

imaya.ui.HSVColorPicker.prototype.calcValue_ = function(y) {
  /** @type {number} */
  var value = 1 - (y - this.svLeftTopX) / this.svWidth;

  return value < 0 ? 0 :
    value > 1 ? 1 :
    value;
};

imaya.ui.HSVColorPicker.prototype.setValue = function(value) {
  this.value = value;
};

imaya.ui.HSVColorPicker.prototype.renderHue =
imaya.ui.HSVColorPicker.prototype.renderSV =
    function(canvas) {
      /** @type {CanvasRenderingContext2D} */
      var ctx = canvas.getContext('2d');
      /** @type {number} */
      var size = this.pointerSize;
      /** @type {number} */
      var centerX = size / 2;
      /** @type {number} */
      var centerY = size / 2;
      /** @type {number} */
      var radius = size / 2 - 3 | 0;
      /** @type {number} */
      var circleWidth = this.pointerWidth;

      ctx.beginPath();

      ctx.fillstyle = "black";
      ctx.shadowColor = "white";
      ctx.shadowBlur = 2;

      ctx.moveTo(centerX + radius, centerY);
      ctx.arc(centerX, centerY, radius, 7, 0, true);
      ctx.moveTo(centerX + radius - circleWidth, centerY);
      ctx.arc(centerX, centerY, radius - circleWidth, 0, 7, false);

      ctx.fill();
      //ctx.stroke();
    };

imaya.ui.HSVColorPicker.prototype.createHueCirclePath = function(ctx) {
  var size = this.size;
  var centerX = size / 2;
  var centerY = size / 2;
  var radius = size / 2;
  var circleWidth = this.circleWidth;

  ctx.moveTo(centerX + radius, centerY);
  ctx.arc(centerX, centerY, radius, 7, 0, true);
  ctx.moveTo(centerX + radius - circleWidth, centerY);
  ctx.arc(centerX, centerY, radius - circleWidth, 0, 7, false);
};

imaya.ui.HSVColorPicker.prototype.renderHueCircle = function() {
  /** @type {HTMLCanvasElement} */
  var canvas = this.hueCircle;
  /** @type {CanvasRenderingContext2D} */
  var ctx =
    /** @type {CanvasRenderingContext2D} */(canvas.getContext('2d'));
  /** @type {number} */
  var size = this.size;
  /** @type {number} */
  var width = canvas.width = size;
  /** @type {number} */
  var height = canvas.height = size;
  /** @type {number} */
  var centerX = width / 2;
  /** @type {number} */
  var centerY = height / 2;
  /** @type {ImageData} */
  var imageData;
  /** @type {Uint8ClampedArray} */
  var pixelArray;
  /** @type {number} */
  var x;
  /** @type {number} */
  var y;
  /** @type {number} */
  var i;

  ctx.save();
  ctx.fillStyle = "black";
  ctx.beginPath();
  this.createHueCirclePath(ctx);
  ctx.fill();
  ctx.restore();

  imageData = ctx.getImageData(0, 0, width, height);
  pixelArray = imageData.data;

  for (y = 0; y < height; ++y) {
    for (x = 0; x < width; ++x) {
      if (pixelArray[(x + y * width) * 4 + 3] === 0) {
        continue;
      }

      var rad = Math.atan2(y - centerY, x - centerX);
      var rgb = this.hsvToRgb(this.radToAngle_(rad), 1, 1);

      for (i = 0; i < 3; ++i) {
        pixelArray[(x + y * width) * 4 + i] = rgb[i];
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};


imaya.ui.HSVColorPicker.prototype.initSV = function() {
  /** @type {HTMLDivElement} */
  var sv = this.sv;
  /** @type {number} */
  var size = this.size;
  /** @type {number} */
  var circleWidth = this.circleWidth;
  /** @type {number} */
  var centerX = size / 2;
  /** @type {number} */
  var centerY = size / 2;
  /** @type {number} */
  var radius = size / 2;
  /** @type {number} */
  var svDeltaX = Math.cos(1/4 * Math.PI) * (radius - circleWidth);
  /** @type {number} */
  var svDeltaY = Math.sin(1/4 * Math.PI) * (radius - circleWidth);
  /** @type {number} */
  var svWidth  = this.svWidth = svDeltaX * 2 | 0;
  /** @type {number} */
  var svHeight = this.svHeight = svDeltaY * 2 | 0;
  /** @type {number} */
  var svLeftTopX = this.svLeftTopX = centerX - svDeltaX | 0;
  /** @type {number} */
  var svLeftTopY = this.svLeftTopY = centerY - svDeltaY | 0;

  sv.style.width = svWidth + 'px';
  sv.style.height = svHeight + 'px';
  sv.style.left = svLeftTopX + 'px';
  sv.style.top = svLeftTopY + 'px';
};

imaya.ui.HSVColorPicker.prototype.initV = function() {
  /** @type {number} */
  var svWidth  = this.svWidth;
  /** @type {number} */
  var svHeight = this.svHeight;
  /** @type {CanvasRenderingContext2D} */
  var ctx = this.v.getContext('2d');
  /** @type {CanvasGradient} */
  var gradient = ctx.createLinearGradient(0, 0, 0, this.svHeight);

  this.v.width = svWidth;
  this.v.height =  svHeight;
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, svWidth, svHeight);
};

imaya.ui.HSVColorPicker.prototype.initS = function() {
  /** @type {number} */
  var svWidth  = this.svWidth;
  /** @type {number} */
  var svHeight = this.svHeight;
  /** @type {CanvasRenderingContext2D} */
  var ctx = this.s.getContext('2d');
  /** @type {CanvasGradient} */
  var gradient = ctx.createLinearGradient(0,0,svWidth, 0);

  this.s.width = svWidth;
  this.s.height =  svHeight;
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, svWidth, svHeight);
};

imaya.ui.HSVColorPicker.prototype.renderSVBox = function() {
  this.sv.style.background = "hsl("+ this.hue +", 100%, 50%)";
};

imaya.ui.HSVColorPicker.prototype.renderSVBox2 = function() {
  /** @type {HTMLCanvasElement} */
  var canvas = this.sv;
  /** @type {CanvasRenderingContext2D} */
  var ctx =
    /** @type {CanvasRenderingContext2D} */(canvas.getContext('2d'));
  /** @type {number} */
  var size = this.size;
  /** @type {number} */
  var circleWidth = this.circleWidth;
  /** @type {number} */
  var hue = this.hue;
  /** @type {number} */
  var centerX = size / 2;
  /** @type {number} */
  var centerY = size / 2;
  /** @type {number} */
  var radius = size / 2;
  /** @type {number} */
  var svDeltaX = Math.cos(1/4 * Math.PI) * (radius - circleWidth);
  /** @type {number} */
  var svDeltaY = Math.sin(1/4 * Math.PI) * (radius - circleWidth);
  /** @type {number} */
  var svWidth  = this.svWidth = svDeltaX * 2 | 0;
  /** @type {number} */
  var svHeight = this.svHeight = svDeltaY * 2 | 0;
  /** @type {number} */
  var svLeftTopX = this.svLeftTopX = centerX - svDeltaX | 0;
  /** @type {number} */
  var svLeftTopY = this.svLeftTopY = centerY - svDeltaY | 0;
  /** @type {ImageData} */
  var imageData;
  /** @type {Uint8ClampedArray} */
  var pixelArray;
  /** @type {number} */
  var x;
  /** @type {number} */
  var y;
  /** @type {number} */
  var i;
  /** @type {Array.<number>} */
  var rgb;
  /** @type {number} */
  var index;

  canvas.width = svWidth;
  canvas.height = svHeight;
  canvas.style.top = svLeftTopX + 'px';
  canvas.style.left = svLeftTopY + 'px';

  imageData = ctx.getImageData(0, 0, svWidth, svHeight);
  pixelArray = imageData.data;

  for (y = 0; y < svHeight; ++y) {
    for (x = 0; x < svWidth; ++x) {
      rgb = this.hsvToRgb(
        hue,
        1 - x / (svWidth - 1),
        1 - y / (svHeight - 1)
      );
      index = (x + y * svWidth) * 4;
      for (i = 0; i < 3; ++i) {
        pixelArray[index + i] = rgb[i];
      }
      pixelArray[index + 3] = 255;
    }
    index = (x + y * svWidth) * 4;
  }

  ctx.putImageData(imageData, 0, 0);
};

/**
 * @param {number} rad
 * @returns {number}
 * @private
 */
imaya.ui.HSVColorPicker.prototype.radToAngle_ = function(rad) {
  return rad / Math.PI * 180;
};

/**
 * @param {number} hue
 * @param {number} saturation
 * @param {number} value
 * @returns {Array.<number>}
 */
imaya.ui.HSVColorPicker.prototype.hsvToRgb = function(hue, saturation, value) {
  /** @type {number} */
  var hi;
  /** @type {number} */
  var f;
  /** @type {number} */
  var p;
  /** @type {number} */
  var q;
  /** @type {number} */
  var t;

  while (hue < 0) {
    hue += 360;
  }
  hue = hue % 360;

  saturation = saturation < 0 ? 0
             : saturation > 1 ? 1
             : saturation;

  value = value < 0 ? 0
        : value > 1 ? 1
        : value;

  value *= 255;
  hi = (hue / 60 | 0) % 6;
  f = hue / 60 - hi;
  p = value * (1 -           saturation) | 0;
  q = value * (1 -      f  * saturation) | 0;
  t = value * (1 - (1 - f) * saturation) | 0;
  value |= 0;

  switch (hi) {
    case 0:
      return [value, t, p];
    case 1:
      return [q, value, p];
    case 2:
      return [p, value, t];
    case 3:
      return [p, q, value];
    case 4:
      return [t, p, value];
    case 5:
      return [value, p, q];
  }

  throw new Error('invalid hue');
};

