goog.provide('Diceros.LinePath');

goog.scope(function() {

/**
 * @constructor
 * // 継承していないが、CanvasRenderingContext2D のメソッドを受けるために偽装する
 * @extends {CanvasRenderingContext2D}
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

Diceros.LinePath.prototype.copy = function() {
  var newObject = new Diceros.LinePath();
  var keys = Object.keys(this);
  var key;
  var i;
  var il;

  for (i = 0, il = keys.length; i < il; ++i) {
    key = keys[i];
    newObject[key] = (this[key] instanceof Array) ? this[key].slice() : this[key];
  }

  return newObject;
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

Diceros.LinePath.prototype.createRedrawFunction = function() {
  var funcstr = ["ctx.save();"];
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

  if (this.color) {
    funcstr.push("ctx.strokeStyle = ctx.fillStyle = this.color;");
  }

  for (i = 0, il = this.pos; i < il;) {
    id = sequence[i++];
    length = sequence[i++];
    args = sequence.slice(i, i += length);

    // method call
    if (id < 0x80) {
      name = Diceros.LinePath.ReverseMethodTable[id];
      funcstr.push("ctx." + name + "(" + args.join(",") + ");");
      // property set
    } else {
      name = Diceros.LinePath.ReversePropertyTable[id & 0x7f];
      funcstr.push("ctx." + name + "=" + args[0] + ";");
    }
  }

  funcstr.push("ctx.restore();");

  this.redraw = new Function("ctx", funcstr.join("\n"));
};

Diceros.LinePath.prototype.drawToSVGPath = function(path) {
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
  /** @type {Array} */
  var d = [];

  path.removeAttribute('stroke');
  path.removeAttribute('fill');
  path.removeAttribute('stroke-width');

  for (i = 0, il = this.pos; i < il;) {
    id = sequence[i++];
    length = sequence[i++];
    args = sequence.slice(i, i += length);

    // method call
    if (id < 0x80) {
      switch (Diceros.LinePath.ReverseMethodTable[id]) {
        // path 0x00-0x0f
        case 'beginPath':
          break;
        // line 0x10-0x1f
        case 'lineTo':
          d.push('L', args.join(' '));
          break;
        case 'bezierCurveTo':
          d.push('C', args.join(' '));
          break;
        case 'arc':
          d.push.apply(d, this.calcCanvasArcToSVGPath.apply(this, args.concat(d.length === 0)));
          break;
        case 'arcTo':
          // TODO: not implemented
          break;
        // move 0x20-0x2f
        case 'moveTo':
          d.push('M', args.join(','));
          break;
        // draw 0x70-0x7f
        case 'stroke':
          path.setAttribute('stroke', this.color);
          break;
        case 'fill':
          path.setAttribute('fill', this.color);
          break;
      }
      // property set
    } else {
      switch (Diceros.LinePath.ReversePropertyTable[id & 0x7f]) {
        case 'lineWidth':
          path.setAttribute('stroke-width', args[0]);
          break;
      }
    }
  }

  path.setAttribute('d', d.join(' '));
};

/**
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {number} startAngle
 * @param {number} endAngle
 * @param {boolean} clockwise
 * @param {boolean=} opt_isFirstPath
 * @returns {Array}
 */
Diceros.LinePath.prototype.calcCanvasArcToSVGPath = function(x, y, radius, startAngle, endAngle, clockwise, opt_isFirstPath) {
  var deltaAngle = Math.abs(startAngle - endAngle);
  var startX;
  var startY;
  var endX = x + Math.cos(endAngle) * radius;
  var endY = y + Math.sin(endAngle) * radius;
  var rot;
  var sweep;
  var isLong;
  var result = [];

  // アングルが同じ場合は描画するものがない
  if (startAngle === endAngle) {
    return result;
  }

  // 円の場合は半分ずつ描画する
  if (deltaAngle >= 2 * Math.PI) {
    result.push.apply(this, this.calcCanvasArcToSVGPath(x, y, radius, startAngle, startAngle + Math.PI, clockwise));
    result.push.apply(this, this.calcCanvasArcToSVGPath(x, y, radius, startAngle + Math.PI, startAngle + 2 * Math.PI, clockwise));
    result.push('M', endX, endY);

    return result;
  }

  // パスの先頭だった場合はその場所まで移動し、そうでない場合は前のパスからの直線
  startX = x + Math.cos(startAngle) * radius;
  startY = y + Math.sin(startAngle) * radius;
  result.push(opt_isFirstPath ? 'M' : 'L', startX, startY);

  // パスの描画
  rot = deltaAngle * 180 / Math.PI; // sign, abs?
  sweep = clockwise ? 0 : 1;
  isLong = ((rot >= 180) === !!clockwise) ? 0 : 1;
  result.push('A', radius, radius, rot, isLong, sweep, endX, endY);

  return result;
};

/**
 * @type {!Object.<string, number>}
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
Diceros.LinePath.ReverseMethodTable = (
/**
 * @param {!Object.<string, number>} table
 * @return {Array.<string>}
 */
function(table) {
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
 * @type {!Object.<string, number>}
 */
Diceros.LinePath.PropertyTable = { // 0x80-0xff
  // line 0x80-0x8f
  lineWidth: 0x80
};

/**
 * @type {Array.<string>}
 */
Diceros.LinePath.ReversePropertyTable = (
/**
 * @param {!Object.<string, number>} table
 * @return {Array.<string>}
 */
function(table) {
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