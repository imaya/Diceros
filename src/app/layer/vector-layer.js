goog.provide('Diceros.VectorLayer');

goog.require('Diceros.BezierAGG');
goog.require('Diceros.Layer');
goog.require('Diceros.Point');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.object');
goog.require('goog.style');


goog.scope(function() {

/**
 * ベクタレイヤー実装
 * @extends Diceros.Layer
 * @constructor
 */
Diceros.VectorLayer = function(app) {
  goog.base(this, app);
  //Diceros.Layer.call(this, app);

  /**
   * クラス名
   * @type {string}
   */
  this.name = 'VectorLayer';
  /**
   * 現在(ctrlなどで変化している時も含めて)の編集モード
   * @type {Diceros.VectorLayer.Mode}
   */
  this.mode = Diceros.VectorLayer.Mode.DEFAULT;
  /**
   * 現在(モードとして選択されている)の編集モード
   * @type {Diceros.VectorLayer.Mode}
   */
  this.baseMode = this.mode;
  /**
   * 全ての線
   * @type {Array.<Diceros.Line>}
   */
  this.lines = [];
  /**
   * 全てのパス
   * @type {Array.<Diceros.LinePath>}
   */
  this.paths = [];
  /**
   * 現在の編集中の線の index
   * @type {number}
   */
  this.currentLine;
  /**
   * 現在編集中の制御点
   * @type {Object}
   * XXX: 制御点クラスを作るか既存の Point クラスを使うか？
   */
  this.currentCtrlPoint = null;
  /**
   * 編集している線よりも前の線を記憶しておくバッファ
   * @type {CanvasRenderingContext2D}
   */
  this.frontBuffer;
  /**
   * 編集している線よりも後ろの線を記憶しておくバッファ
   * @type {CanvasRenderingContext2D}
   */
  this.backBuffer;
  /**
   * 描画アウトライン用の一時パス.
   * @type {Diceros.LinePath}
   */
  this.overlayPath;
  /**
   * 描画アウトライン用の一時パス.
   * @type {Diceros.LinePath}
   */
  this.tempPath;
  /**
   * @type {Element}
   */
  this.ctrlPointLayer;
  /**
   * @type {Array.<number>}
   */
  this.freeList = [];
  /**
   * @type {Object}
   */
  this.beforeEdit;
};
goog.inherits(
  Diceros.VectorLayer,
  Diceros.Layer
);

Diceros.VectorLayer.prototype.init = function() {
  goog.base(this, 'init');

  this.frontBuffer =
  /** @type {CanvasRenderingContext2D} */
    (this.app.makeCanvas(this.app.width, this.app.height).getContext('2d'));

  this.backBuffer =
  /** @type {CanvasRenderingContext2D} */
    (this.app.makeCanvas(this.app.width, this.app.height).getContext('2d'));
};

Diceros.VectorLayer.prototype.getOverlayContext = function() {
  return this.app.windows[this.app.currentCanvasWindow].overlay.ctx;
};

Diceros.VectorLayer.prototype.getTempContext = function() {
  return this.app.windows[this.app.currentCanvasWindow].temp.ctx;
};

/**
 * 編集モード
 * @enum {number}
 */
Diceros.VectorLayer.Mode = {
  DEFAULT: 0,  // デフォルトモード (描画)
  EDIT: 1,  // 編集モード(制御点の移動)
  ADD: 2,  // TODO: 追加モード（制御点の追加）
  DELETE: 3,  // 線の太さ変更モード
  WIDTH_UPDATE: 4
};

/**
 * イベントハンドラ
 * @param {goog.events.BrowserEvent} event Eventオブジェクト.
 */
Diceros.VectorLayer.prototype.event = function(event) {
  var canvas = this.canvas,
      ctx = this.ctx;
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  if (canvas === null || ctx === null) {
    throw 'canvas not initialized';
  }

  //
  // 事前共通処理
  //

  switch (this.mode) {
    case Diceros.VectorLayer.Mode.DEFAULT:
      this.handleEventDefault(event);
      break;
    case Diceros.VectorLayer.Mode.EDIT:
      this.handleEventEdit(event);
      break;
    case Diceros.VectorLayer.Mode.DELETE:
      this.handleEventDelete(event);
      break;
    case Diceros.VectorLayer.Mode.WIDTH_UPDATE:
      this.handleEventWidth(event);
      break;
    default:
      // NOP
  }

  //
  // 事後共通処理
  //
  // Ctrl を押している時は強制編集モード
  if (event.altKey) {
    this.mode = Diceros.VectorLayer.Mode.EDIT;
  } else {
    // Ctrlを押していないとき、ドラッグ中でなければ元のモードにもどる
    if (!this.app.getCurrentCanvasWindow().drag) {
      if (this.mode !== this.baseMode) {
        this.switchMode(this.baseMode);
      }
    }
  }

  if (this.mode === Diceros.VectorLayer.Mode.EDIT) {
    this.drawCtrlPoint();
  }
  if (this.mode === Diceros.VectorLayer.Mode.DELETE) {
    this.drawCtrlPoint();
  }
  if (this.mode === Diceros.VectorLayer.Mode.WIDTH_UPDATE) {
    this.drawCtrlPoint();
  }

  // free
  this.freeList = this.freeList.sort(function(a, b) { return a < b ? 1 : a > b ? - 1 : 0; });
  for (i = 0, il = this.freeList.length; i < il; ++i) {
    this.lines.splice(this.freeList[i], 1);
    this.paths.splice(this.freeList[i], 1);
  }
  this.freeList = [];
  if (this.lines.length === 0) {
    this.currentCtrlPoint = null;
  }
};

// reset
Diceros.VectorLayer.prototype.switchMode = function(mode) {
  this.baseMode = this.mode = mode;
  this.clearCtrlPoint();

  switch (this.mode) {
    case Diceros.VectorLayer.Mode.DELETE: /* FALLTHROUGH */
    case Diceros.VectorLayer.Mode.EDIT: /* FALLTHROUGH */
    case Diceros.VectorLayer.Mode.WIDTH_UPDATE:
      this.drawCtrlPoint();
      break;
  }
};

/**
 * @param {goog.events.BrowserEvent} event browser event.
 */
Diceros.VectorLayer.prototype.handleEventDefault = function(event) {
  /** @type {Diceros.Line} */
  var line;
  /** @type {Diceros.Point} */
  var point;

  switch (event.type) {
    // START
    case goog.events.EventType.MSPOINTERDOWN: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHSTART: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEDOWN:
      // 線のセットアップ
      line = new Diceros.BezierAGG(this.app.color);
      point = Diceros.Point.createFromEvent(event, this.getCurrentPenSize()); // XXX

      // 最初の点を追加し、線リストに追加
      line.addControlPoint(point);
      this.currentLine = this.lines.length;
      this.lines[this.currentLine] = line;

      this.drawOutline();
      break;
    // MOVE
    case goog.events.EventType.MSPOINTERMOVE: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHMOVE: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEMOVE:
      // ドラッグ中なら線を描く
      if (this.app.getCurrentCanvasWindow().drag) {
        this.sampling(event);
        this.drawOutline();
        // 通常
      } else {
        this.updateCursor(event);
      }
      break;
    // END
    case goog.events.EventType.MSPOINTERUP: /* FALLTHROUGH */
    case goog.events.EventType.TOUCHEND: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEUP:
      // TODO sampling?
      this.drawNewline();
      this.optimizeRedrawCurrentLine();
      break;
    // WHEEL
    case goog.events.MouseWheelHandler.EventType.MOUSEWHEEL:
      break;
    // KEY DOWN
    case goog.events.EventType.KEYDOWN:
      break;
    // KEY UP
    case goog.events.EventType.KEYUP:
      break;
  }
};

/**
 * @param {goog.events.BrowserEvent} event browser event.
 */
Diceros.VectorLayer.prototype.handleEventEdit = function(event) {
  var ctrlPoint = this.currentCtrlPoint;
  var currentLine = this.lines[this.currentLine];
  var line;
  var width;
  var basePoint;

  switch (event.type) {
    // START
    case goog.events.EventType.MSPOINTERDOWN:
    case goog.events.EventType.TOUCHSTART:
      this.updateCursor(event);
      ctrlPoint = this.currentCtrlPoint;
      currentLine = this.lines[this.currentLine];
      /* FALLTHROUGH */
    case goog.events.EventType.MOUSEDOWN:
      // 制御点が選択可能な位置ならば、その制御点を更新する
      if (ctrlPoint) {
        line = this.lines[ctrlPoint.lineIndex];
        width = (line.getCtrlPoints())[ctrlPoint.pointIndex].width;

        this.beforeEdit = line.copy();

        this.currentLine = ctrlPoint.lineIndex;

        // 制御点の更新
        line.updateControlPoint(
          ctrlPoint.pointIndex,
          Diceros.Point.createFromEvent(event, width, true)
        );

        // 線の選択
        this.selectLine();
      }
      break;
    // MOVE
    case 'MSPointerHover': //TODO: closure library の event type にないためやむを得ず /* FALLTHROUGH */
    case goog.events.EventType.MSPOINTERMOVE:
    case goog.events.EventType.TOUCHMOVE: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEMOVE:
      // ドラッグ中
      if (this.app.getCurrentCanvasWindow().drag) {
        if (ctrlPoint) {
          width = (currentLine.getCtrlPoints())[ctrlPoint.pointIndex].width;

          currentLine.updateControlPoint(
            ctrlPoint.pointIndex,
            Diceros.Point.createFromEvent(event, width, true)
          );

          this.refreshCurrentLine();
        }
      // 通常
      } else {
        this.updateCursor(event);
      }
      break;
    // END
    case goog.events.EventType.TOUCHEND:
      event.getBrowserEvent().touches[0] = event.getBrowserEvent().changedTouches[0];
      /* FALLTHROUGH */
    case goog.events.EventType.MSPOINTERUP: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEUP:
      // 点の編集中だったらカーソル位置で現在の線を描き直す
      if (this.currentCtrlPoint !== null) {
        width =
          (currentLine.getCtrlPoints())[ctrlPoint.pointIndex].width;

        currentLine.updateControlPoint(
          ctrlPoint.pointIndex,
          Diceros.Point.createFromEvent(event, width, true)
        );

        this.refreshCurrentLineEnd();
        this.optimizeRedrawCurrentLine();
        this.currentCtrlPoint = null;
        this.beforeEdit = null;
      }
      break;
    // WHEEL
    case goog.events.MouseWheelHandler.EventType.MOUSEWHEEL:
      if (ctrlPoint) {
        this.beforeEdit = this.lines[ctrlPoint.lineIndex].copy();

        // update current line
        this.currentLine = ctrlPoint.lineIndex;
        currentLine = this.lines[this.currentLine];

        basePoint = (currentLine.getCtrlPoints())[ctrlPoint.pointIndex];
        width = basePoint.width;

        /** @type {number} */
        event.deltaY;

        // XXX: magic number
        if (event.deltaY < 0) {
          width += 1;
        }
        if (event.deltaY > 0) {
          width = (width - 1 < 0.1) ? 0.1 : width - 1;
        }

        currentLine.updateControlPoint(
          ctrlPoint.pointIndex,
          new Diceros.Point(
            basePoint.x, basePoint.y, width, true
          )
        );

        this.selectLine();
        this.refreshCurrentLineEnd();
      }
      break;
  }
};

/**
 * @param {goog.events.BrowserEvent} event browser event.
 */
Diceros.VectorLayer.prototype.handleEventDelete = function(event) {
  var ctrlPoint = this.currentCtrlPoint;
  var currentLine = this.lines[this.currentLine];
  var line;
  var width;

  switch (event.type) {
    // START
    case goog.events.EventType.MSPOINTERDOWN:
    case goog.events.EventType.TOUCHSTART:
      this.updateCursor(event);
      ctrlPoint = this.currentCtrlPoint;
      currentLine = this.lines[this.currentLine];
      /* FALLTHROUGH */
    case goog.events.EventType.MOUSEDOWN:
      // 制御点が選択可能な位置ならば、その制御点を更新する
      if (ctrlPoint) {
        line = this.lines[ctrlPoint.lineIndex];
        width = (line.getCtrlPoints())[ctrlPoint.pointIndex].width;

        this.beforeEdit = line.copy();

        this.currentLine = ctrlPoint.lineIndex;

        // 制御点の更新
        line.removeControlPoint(
          ctrlPoint.pointIndex,
          Diceros.Point.createFromEvent(event, width, true)
        );

        /*
        if (line.getCtrlPoints().length === 0) {
          this.freeList.push(this.currentLine);
        }
        */

        // 線の選択
        this.selectLine();
        this.refreshCurrentLineEnd();
      }
      break;
    // MOVE
    case 'MSPointerHover': //TODO: closure library の event type にないためやむを得ず /* FALLTHROUGH */
    case goog.events.EventType.MSPOINTERMOVE:
    case goog.events.EventType.TOUCHMOVE: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEMOVE:
      this.updateCursor(event);
      break;
    case goog.events.EventType.MSPOINTERUP:
    case goog.events.EventType.TOUCHEND: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEUP:
      this.currentCtrlPoint = null;
      break;
  }
};

/**
 * @param {goog.events.BrowserEvent} event browser event.
 */
Diceros.VectorLayer.prototype.handleEventWidth = function(event) {
  var ctrlPoint = this.currentCtrlPoint;
  var currentLine = this.lines[this.currentLine];
  var line;
  var width;

  switch (event.type) {
    // START
    case goog.events.EventType.MSPOINTERDOWN:
    case goog.events.EventType.TOUCHSTART:
      this.updateCursor(event);
      ctrlPoint = this.currentCtrlPoint;
      currentLine = this.lines[this.currentLine];
    /* FALLTHROUGH */
    case goog.events.EventType.MOUSEDOWN:
      // 制御点が選択可能な位置ならば、その制御点を更新する
      if (ctrlPoint) {
        line = this.lines[ctrlPoint.lineIndex];
        width = (line.getCtrlPoints())[ctrlPoint.pointIndex].width;

        this.beforeEdit = line.copy();

        this.currentLine = ctrlPoint.lineIndex;

        // 線の選択
        this.selectLine();
      }
      break;
    // MOVE
    case 'MSPointerHover': //TODO: closure library の event type にないためやむを得ず /* FALLTHROUGH */
    case goog.events.EventType.MSPOINTERMOVE:
    case goog.events.EventType.TOUCHMOVE: /* FALLTHROUGH */
    case goog.events.EventType.MOUSEMOVE:
      // ドラッグ中
      if (this.app.getCurrentCanvasWindow().drag) {
        if (ctrlPoint) {
          var point = (currentLine.getCtrlPoints())[ctrlPoint.pointIndex];
          var base =  Diceros.Point.createFromEvent(event, 0, false);
          var distance = Math.sqrt(Math.pow(base.x - point.x, 2) + Math.pow(base.y - point.y, 2));

          point.width = distance / 5;

          currentLine.updateControlPoint(
            ctrlPoint.pointIndex,
            point
          );

          this.refreshCurrentLine();
        }
        // 通常
      } else {
        this.updateCursor(event);
      }
      break;
    // END
    case goog.events.EventType.TOUCHEND: /* FALLTHROUGH */
      event.getBrowserEvent().touches[0] = event.getBrowserEvent().changedTouches[0];
    case goog.events.EventType.MSPOINTERUP:
    case goog.events.EventType.MOUSEUP:
      // 点の編集中だったらカーソル位置で現在の線を描き直す
      if (this.currentCtrlPoint !== null) {
        this.refreshCurrentLineEnd();
        this.currentCtrlPoint = null;
      }
      break;
  }
};

/**
 * サンプリングを行う
 * @param {goog.events.BrowserEvent} event Eventオブジェクト.
 */
Diceros.VectorLayer.prototype.sampling = function(event) {
  /** @type {Diceros.Line} */
  var currentLine = this.lines[this.currentLine];
  /** @type {Diceros.Point} */
  var point = Diceros.Point.createFromEvent(event, this.getCurrentPenSize());

  currentLine.addControlPoint(point);
};

Diceros.VectorLayer.prototype.clearOutline = function() {
  /** @type {number} */
  var lineIndex = this.currentLine;
  /** @type {Diceros.Line} */
  var line = this.lines[lineIndex];
  /** @type {CanvasRenderingContext2D} */
  var overlay = this.getOverlayContext();
  /** @type {CanvasRenderingContext2D} */
  var temp = this.getTempContext();
  /** @type {Diceros.LinePath} */
  var path;

  // clear outline
  path = this.tempPath;
  if (path) {
    temp.clearRect(path.x, path.y, path.width, path.height);
    this.tempPath = null;
  }

  path = line.outline();
  if (path) {
    overlay.clearRect(path.x, path.y, path.width, path.height);
    this.overlayPath = null;
  }
};

/**
 * 新しい線をオーバーレイから本バッファに描画する
 */
Diceros.VectorLayer.prototype.drawNewline = function() {
  /** @type {number} */
  var lineIndex = this.currentLine;
  /** @type {Diceros.Line} */
  var line = this.lines[lineIndex];
  /** @type {Diceros.LinePath} */
  var path;
  var before;
  var after;

  // optimization
  if (typeof line.optimize === 'function') {
    line.optimize(this.app.lineOptimization);
  }

  this.clearOutline();

  path = this.paths[lineIndex] = line.path();

  // save state before drawing
  before = document.createElement('canvas');
  before.width = path.width;
  before.height = path.height;
  before.getContext('2d').putImageData(
    this.ctx.getImageData(path.x, path.y, path.width, path.height),
    0,
    0
  );

  // draw new line
  if (path) {
    path.draw(this.ctx);
  }

  // save state after drawing
  after = document.createElement('canvas');
  after.width = path.width;
  after.height = path.height;
  after.getContext('2d').putImageData(
    this.ctx.getImageData(path.x, path.y, path.width, path.height),
    0,
    0
  );

  // save history
  if (this.history.length > this.historyIndex) {
    this.history.length = this.historyIndex;
  }
  this.history[this.historyIndex++] = new Diceros.HistoryObject(
    path.x,
    path.y,
    path.width,
    path.height,
    before.toDataURL(),
    after.toDataURL(),
    goog.bind(function() {
      this.lines.pop();
      this.paths.pop();
      if (this.mode !== Diceros.VectorLayer.Mode.DEFAULT) {
        this.drawCtrlPoint();
      } else {
        this.clearCtrlPoint();
      }
    }, this),
    goog.bind(function() {
      this.lines.push(line);
      this.paths.push(path);
      if (this.mode !== Diceros.VectorLayer.Mode.DEFAULT) {
        this.drawCtrlPoint();
      } else {
        this.clearCtrlPoint();
      }
    }, this)
  );
  this.sendHistoryTarget();
};

Diceros.VectorLayer.prototype.refreshCurrentLineEnd = function() {
  /** @type {Diceros.VectorLayer} */
  var vectorLayer = this;
  /** @type {HTMLCanvasElement} */
  var canvas = this.canvas;
  /** @type {Diceros.Line} */
  var line = this.lines[this.currentLine];

  this.refreshCurrentLine();

  // save history
  if (this.history.length > this.historyIndex) {
    this.history.length = this.historyIndex;
  }

  var history = new Diceros.HistoryObject(
    0,
    0,
    canvas.width,
    canvas.height,
    this.beforeEdit,
    line.copy(),
    function(before) {
      vectorLayer.lines[this.lineIndex] = before;
      vectorLayer.paths[this.lineIndex] = before.path();

      vectorLayer.currentLine = this.lineIndex;
      vectorLayer.draw();
      if (vectorLayer.mode !== Diceros.VectorLayer.Mode.DEFAULT) {
        vectorLayer.drawCtrlPoint();
      } else {
        vectorLayer.clearCtrlPoint();
      }
    },
    function(after) {
      vectorLayer.lines[this.lineIndex] = after;
      vectorLayer.paths[this.lineIndex] = after.path();
      vectorLayer.currentLine = this.lineIndex;
      vectorLayer.draw();
      if (vectorLayer.mode !== Diceros.VectorLayer.Mode.DEFAULT) {
        vectorLayer.drawCtrlPoint();
      } else {
        vectorLayer.clearCtrlPoint();
      }
    }
  );
  history.lineIndex = this.currentLine;

  this.history[this.historyIndex++] = history;
  this.sendHistoryTarget();
};

Diceros.VectorLayer.prototype.undo = function() {
  var top;
  var image;
  var ctx = this.ctx;

  if (this.historyIndex === 0) {
    return;
  }

  top = this.history[--this.historyIndex];

  if (typeof top.before === "string") {
    image = new Image();

    image.addEventListener('load', function() {
      ctx.clearRect(top.x, top.y, top.width, top.height);
      ctx.drawImage(image, top.x, top.y, top.width, top.height);
    }, false);
    image.src = top.before;
  }

  if (top.beforeFunc) {
    top.beforeFunc(top.before);
  }
};

Diceros.VectorLayer.prototype.redo = function() {
  var top;
  var image;
  var ctx = this.ctx;

  if (this.history.length === this.historyIndex) {
    return;
  }

  top = this.history[this.historyIndex++];

  if (typeof top.after === "string") {
    image = new Image();

    image.addEventListener('load', function() {
      ctx.clearRect(top.x, top.y, top.width, top.height);
      ctx.drawImage(image, top.x, top.y, top.width, top.height);
    }, false);
    image.src = top.after;
  }

  if (top.afterFunc) {
    top.afterFunc(top.after);
  }
};


/**
 * オーバーレイにざっくり描画する
 */
Diceros.VectorLayer.prototype.drawOutline = function() {
  /** @type {number} */
  var lineIndex = this.currentLine;
  /** @type {Diceros.Line} */
  var line = this.lines[lineIndex];
  /** @type {Diceros.LinePath} */
  var overlayPath = this.overlayPath;
  /** @type {Diceros.LinePath} */
  var tempPath = this.tempPath;
  /** @type {CanvasRenderingContext2D} */
  var overlay = this.getOverlayContext();
  /** @type {CanvasRenderingContext2D} */
  var temp = this.getTempContext();

  // clear before outline
  if (tempPath) {
    temp.clearRect(tempPath.x, tempPath.y, tempPath.width, tempPath.height);
  }

  // draw outline
  if (line.getCtrlPoints().length < 3) {
    tempPath = this.tempPath = line.outline();
    if (tempPath) {
      temp.save();
      temp.lineCap = 'round';
      tempPath.draw(temp);
      temp.restore();
    }
  } else {
    // 未確定のアウトライン
    tempPath = this.tempPath = line.outline(void 0, void 0, -1);
    if (tempPath) {
      temp.save();
      temp.lineCap = 'round';
      tempPath.draw(temp);
      temp.restore();
    }

    // 確定したアウトライン
    overlayPath = this.overlayPath = line.outline(void 0, void 0, -3, -1);
    if (overlayPath) {
      overlay.save();
      overlay.lineCap = 'round';
      overlayPath.draw(overlay);
      overlay.restore();
    }
  }
};

/**
 * 線を選択したときに前後のバッファを作成する
 */
Diceros.VectorLayer.prototype.selectLine = function() {
  /** @type {number} */
  var lineIndex = this.currentLine;
  /** @type {CanvasRenderingContext2D} */
  var ctx;
  /** @type {HTMLCanvasElement} */
  var canvas;
  /** @type {Array.<Diceros.LinePath>} */
  var paths = this.paths;
  /** @type {Diceros.LinePath} */
  var path;
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  // back buffer
  ctx = this.backBuffer;
  canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (i = 0, il = lineIndex; i < il; ++i) {
    if (path = paths[i]) {
      if (path.redraw) {
        path.redraw(ctx);
      } else {
        path.draw(ctx);
      }
    }
  }

  // front buffer
  ctx = this.frontBuffer;
  canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (i = lineIndex + 1, il = paths.length; i < il; ++i) {
    if (path = paths[i]) {
      if (path.redraw) {
        path.redraw(ctx);
      } else {
        path.draw(ctx);
      }
    }
  }
};

/**
 * 現在の線を前後のバッファとあわせて描画しなおす
 */
Diceros.VectorLayer.prototype.refreshCurrentLine = function() {
  /** @type {CanvasRenderingContext2D} */
  var ctx = this.ctx;
  /** @type {HTMLCanvasElement} */
  var canvas = this.canvas;
  /** @type {Diceros.Line} */
  var line = this.lines[this.currentLine];
  /** @type {Diceros.LinePath} */
  var path = this.paths[this.currentLine] = line.path();

  // initialize
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw
  ctx.drawImage(this.backBuffer.canvas, 0, 0);
  if (path) {
    path.draw(ctx);
  }
  ctx.drawImage(this.frontBuffer.canvas, 0, 0);
};

/**
 * カーソルの更新
 * @param {goog.events.BrowserEvent} event BrowserEvent.
 */
Diceros.VectorLayer.prototype.updateCursor = function(event) {
  /** @type {goog.math.Coordinate} */
  var offset;
  /** @type {number} */
  var x;
  /** @type {number} */
  var y;
  /** @type {Object} */
  var ctrlPoint;
  /** @type {HTMLCanvasElement} */
  var cssTarget;
  /** @type {number} */
  var width;

  /** @type {Element} */
  event.target;

  x = event.x;
  y = event.y;
  width = (event.type.slice(0, 5) === 'touch') ? 15 : 5;

  if (typeof this.app.currentCanvasWindow === 'number') {
    cssTarget = this.app.windows[this.app.currentCanvasWindow].element;
  } else {
    cssTarget = this.canvas;
  }

  switch (this.mode) {
    case Diceros.VectorLayer.Mode.DEFAULT:
      goog.style.setStyle(cssTarget, 'cursor', 'default');
      break;
    case Diceros.VectorLayer.Mode.DELETE: /* FALLTHROUGH */
    case Diceros.VectorLayer.Mode.EDIT:   /* FALLTHROUGH */
    case Diceros.VectorLayer.Mode.WIDTH_UPDATE:
      ctrlPoint = this.checkCtrlPoint(x, y, width);
      if (ctrlPoint) {
        goog.style.setStyle(cssTarget, 'cursor', 'move');
      } else {
        goog.style.setStyle(cssTarget, 'cursor', 'default');
      }
      break;
      // XXX: 他のモードは未実装
  }

  this.currentCtrlPoint = ctrlPoint;
};

/**
 * 制御点の描画
 * @param {number=} opt_drawIndex 描画する線.省略時は全ての線の制御点を描画.
 */
Diceros.VectorLayer.prototype.drawCtrlPoint = function(opt_drawIndex) {
  var overlay = this.getOverlayContext();
  var path;
  var i;
  var il;

  // XXX: クリアではなくオーバーレイ自体を表示/非表示でも良いかも知れない
  overlay.clearRect(0, 0, this.app.width, this.app.height);
  overlay.save();

  // 全ての線を描画するか,特定の線のみ描画するか
  if (typeof opt_drawIndex === 'number') {
    path = this.lines[opt_drawIndex].outline(1, 'rgb(196,196,255)');
    if (path) {
      path.draw(overlay);
    }
    overlay.beginPath();
    this.drawCtrlPointImpl_(overlay, opt_drawIndex);
  } else {
    if (this.currentCtrlPoint) {
      // XXX: magic number
      path = this.lines[this.currentCtrlPoint.lineIndex].outline(2, 'rgb(196,196,255)');
      if (path) {
        path.draw(overlay);
      }
    }
    overlay.beginPath();
    for (i = 0, il = this.lines.length; i < il; i++) {
      this.drawCtrlPointImpl_(overlay, i);
    }
  }

  overlay.strokeStyle = 'rgb(0,0,255)'; // XXX: magic number
  overlay.fillStyle = 'rgb(255,255,255)'; // XXX: magic number
  overlay.fill();
  overlay.stroke();
  overlay.restore();
};

Diceros.VectorLayer.prototype.optimizeRedrawCurrentLine = function() {
  this.paths[this.currentLine].createRedrawFunction();
};


/**
 * 制御点の描画実装
 * @param {Object} ctx 描画コンテキスト.
 * @param {number} lineIndex 描画する線の index.
 */
Diceros.VectorLayer.prototype.drawCtrlPointImpl_ =
function(ctx, lineIndex) {
  var line = this.lines[lineIndex],
      ctrlPoints = line.getCtrlPoints(),
      width = 3, // XXX: magic number
      drawPoint;

  // 制御点の描画
  for (var i = 0, l = ctrlPoints.length; i < l; i++) {
    drawPoint = ctrlPoints[i];

    ctx.moveTo(drawPoint.x + width, drawPoint.y);
    ctx.arc(drawPoint.x, drawPoint.y, width, 0, 7, false);
  }
};


/**
 * 制御点の表示を消す
 */
Diceros.VectorLayer.prototype.clearCtrlPoint =
function() {
  var ctx = this.getOverlayContext();

  ctx.clearRect(0, 0, this.app.width, this.app.height);
};


/**
 * 制御点のアタリ判定
 * @param {number} x 判定する制御点の X 座標.
 * @param {number} y 判定する制御点の Y 座標.
 * @param {number=} opt_width 判定する制御点の大きさ.
 * @return {?Object} 線と制御点の index を含む Object か null.
 */
Diceros.VectorLayer.prototype.checkCtrlPoint = function(x, y, opt_width) {
  var ctx = this.getOverlayContext();

  if (typeof opt_width !== 'number') {
    opt_width = 5;
  }

  // 新しい制御点から判定するため index は後ろからたどる
  for (var i = 0, il = this.lines.length; i < il; i++) {
    var lineIndex = il - i - 1,
        line = this.lines[lineIndex].getCtrlPoints();

    for (var j = 0, jl = line.length; j < jl; j++) {
      var pointIndex = jl - j - 1,
          point = line[pointIndex];

      ctx.beginPath();
      ctx.arc(
        point.x | 0,
        point.y | 0,
        opt_width,
        0,
        Math.PI * 2,
        false
      );

      if (!ctx.isPointInPath(x, y)) {
        continue;
      }

      return {
        lineIndex: lineIndex,
        pointIndex: pointIndex
      };
    }
  }

  return null;
};

Diceros.VectorLayer.prototype.draw = function() {
  this.selectLine();
  this.refreshCurrentLine();
};

Diceros.VectorLayer.prototype.toObject = function() {
  return {
    'type': this.name,
    'data': this.lines.map(
      function(line) {
        return line.toObject();
      }
    )
  };
};

Diceros.VectorLayer.fromObject = function(app, obj) {
  var layer;
  var lines;
  var paths;
  var data = obj['data'];
  var i;
  var il;

  layer = new Diceros.VectorLayer(app);
  lines = new Array(data.length);
  paths = new Array(data.length);

  layer.init();

  for (i = 0, il = data.length; i < il; ++i) {
    switch (data[i]['type']) {
      case 'BezierAGG':
        lines[i] = Diceros.BezierAGG.fromObject(data[i]);
        paths[i] = lines[i].path();
        break;
      default:
        throw new Error('unknown line type');
    }
  }

  layer.lines = lines;
  layer.paths = paths;

  if (lines.length > 0) {
    layer.currentLine = 0;
    layer.selectLine();
    layer.refreshCurrentLine();
  }

  return layer;
};

// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
