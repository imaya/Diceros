goog.provide('Diceros.LinePath');

goog.scope(function() {

/**
 * @constructor
 */
Diceros.LinePath = function() {
  /** @type {Array.<number>} */
  this.sequence = [];
  /** @type {number} */
  this.pos = 0;
  /** @type {number} */
  this.x;
  /** @type {number} */
  this.y;
  /** @type {number} */
  this.width;
  /** @type {number} */
  this.height;
  /** @type {string} */
  this.color;
};

/**
 * @param {CanvasRenderingContext2D} ctx target context
 */
Diceros.LinePath.prototype.draw = function(ctx) {
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;
  /** @type {Array.<number>} */
  var sequence = this.sequence;
  /** @type {number} */
  var id;
  /** @type {number} */
  var length;
  /** @type {Array.<number>} */
  var args;
  /** @type {string} */
  var name;

  ctx.save();

  if (this.color) {
    ctx.strokeStyle = ctx.fillStyle = this.color;
  }

  for (i = 0, il = this.pos; i < il;) {
    id = sequence[i++];
    length = sequence[i++];
    args = sequence.slice(i, i += length);

    // method call
    if (id < 0x80) {
      name = Diceros.LinePath.ReverseMethodTable[id];
      ctx[name].apply(ctx, args);
    // property set
    } else {
      name = Diceros.LinePath.ReversePropertyTable[id & 0x7f];
      ctx[name] = args[0];
    }
  }

  ctx.restore();
};

/**
 * @type {Object.<string, number>}
 */
Diceros.LinePath.MethodTable = { // 0x00-0x7f
  // path 0x00-0x0f
  beginPath: 0x00,
  // line 0x10-0x1f
  lineTo: 0x10,
  bezierCurveTo: 0x11,
  arc: 0x12,
  arcTo: 0x13,
  // move 0x20-0x2f
  moveTo: 0x20,
  // draw 0x70-0x7f
  stroke: 0x70,
  fill: 0x71
};

/**
 * @type {Array.<string>}
 */
Diceros.LinePath.ReverseMethodTable = (function(table) {
  /** @type {Array.<string>} */
  var reverseTable = new Array(128); // 0x00-0x7f
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;
  /** @type {Array.<string>} */
  var keys = Object.keys(table);
  /** @type {string} */
  var key;
  /** @type {number} */
  var value;

  // initialize
  for (i = 0; i < 128; ++i) {
    reverseTable[i] = 0;
  }

  // create reverse table, prototype functions
  for (i = 0, il = keys.length; i < il; ++i) {
    key = keys[i];
    value = table[key];
    reverseTable[value] = key;

    Diceros.LinePath.prototype[key] = (function(methodName, methodId) {
      return function() {
        /** @type {number} */
        var pos = this.pos;
        /** @type {number} */
        var i;
        /** @type {number} */
        var il;

        // type
        this.sequence[pos++] = methodId;
        // length
        this.sequence[pos++] = arguments.length;
        // arguments
        for (i = 0, il = arguments.length; i < il; ++i) {
          this.sequence[pos++] = arguments[i];
        }

        this.pos = pos;
      };
    })(key, value);
  }

  return reverseTable;
})(Diceros.LinePath.MethodTable);

/**
 * @type {Object.<string, number>}
 */
Diceros.LinePath.PropertyTable = { // 0x80-0xff
  // line 0x80-0x8f
  lineWidth: 0x80
};

/**
 * @type {Array.<number>}
 */
Diceros.LinePath.ReversePropertyTable = (function(table) {
  /** @type {Array.<string>} */
  var reverseTable = new Array(128); // 0x80-0xff
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;
  /** @type {Array.<string>} */
  var keys = Object.keys(table);
  /** @type {string} */
  var key;
  /** @type {number} */
  var value;

  // initialize
  for (i = 0; i < 128; ++i) {
    reverseTable[i] = 0;
  }

  // create reverse table, prototype properties
  for (i = 0, il = keys.length; i < il; ++i) {
    key = keys[i];
    value = table[key] & 0x7f;
    reverseTable[value] = key;

    Object.defineProperty(Diceros.LinePath.prototype, key, {
      set: (function(methodName, methodId) {
        return function() {
          /** @type {number} */
          var pos = this.pos;
          /** @type {number} */
          var i;
          /** @type {number} */
          var il;

          // type
          this.sequence[pos++] = methodId;
          // length
          this.sequence[pos++] = arguments.length;
          // arguments
          for (i = 0, il = arguments.length; i < il; ++i) {
            this.sequence[pos++] = arguments[i];
          }

          this.pos = pos;
        };
      })(key, value | 0x80)
    });
  }

  return reverseTable;
})(Diceros.LinePath.PropertyTable);

// end of scope
});