goog.provide('Diceros.Layer');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('Diceros.HistoryObject');

goog.scope(function() {

/**
 * レイヤー基本クラス
 * @param {Diceros.Application} app アプリケーションオブジェクト
 * @constructor
 */
Diceros.Layer = function(app) {
  /**
   * アプリケーションオブジェクト
   * @type {Diceros.Application}
   */
  this.app = app;
  /**
   * クラス名
   * @type {string}
   */
  this.name = 'Layer';
  /**
   * キャンバス
   * @type {HTMLCanvasElement}
   */
  this.canvas = null;
  /**
   * キャンバスコンテキスト
   * @type {CanvasRenderingContext2D}
   */
  this.ctx = null;
  /**
   * 表示状態
   * @type {boolean}
   */
  this.visible = true;
  /**
   * Undo/Redo 用のヒストリ
   * @type {Array.<Diceros.HistoryObject>}
   */
  this.history = [];
  /**
   * Undo/Redo 用のヒストリ位置
   * @type {number}
   */
  this.historyIndex = 0;
};

/**
 * レイヤーの初期化を行う
 */
Diceros.Layer.prototype.init = function() {
  this.canvas = this.app.makeCanvas(this.app.width, this.app.height);
  this.ctx =
    /** @type {CanvasRenderingContext2D} */
    (this.canvas.getContext('2d'));

  goog.style.setStyle(this.canvas, 'position', 'absolute');
};

Diceros.Layer.prototype.getCanvas = function() {
  return this.canvas;
};


/**
 * レイヤーの更新を行う
 */
Diceros.Layer.prototype.update = goog.abstractMethod;


/**
 * レイヤーの描画を行う
 */
Diceros.Layer.prototype.draw = goog.abstractMethod;


/**
 * レイヤーの描画状態をリフレッシュする
 */
Diceros.Layer.prototype.refresh = function() {
  this.clear();
  this.draw();
};


/**
 * キャンバスのクリア
 */
Diceros.Layer.prototype.clear = function() {
  if (this.canvas === null || this.ctx === null) {
    throw 'canvas not initialized';
  }

  this.ctx.clearRect(0, 0, this.app.width, this.app.height);
};


/**
 * キャンバスの表示
 */
Diceros.Layer.prototype.show = function() {
  this.visible = true;
  goog.style.showElement(this.canvas, true);
};


/**
 * キャンバスの非表示
 */
Diceros.Layer.prototype.hide = function() {
  this.visible = false;
  goog.style.showElement(this.canvas, false);
};

/**
 * undo
 */
Diceros.Layer.prototype.undo = goog.abstractMethod;

/**
 * redo
 */
Diceros.Layer.prototype.redo = goog.abstractMethod;

Diceros.Layer.prototype.shiftHistory = function() {
  if (this.history.length === 0) {
    return;
  }

  this.history.shift();
  if (this.historyIndex > 0) {
    --this.historyIndex;
  }
};

Diceros.Layer.prototype.adjustHistory = function() {
  if (this.historyIndex > this.history.length) {
    this.historyIndex = this.history.length;
  }
};

Diceros.Layer.prototype.sendHistoryTarget = function() {
  this.app.getCurrentCanvasWindow().addHistoryTarget(this);
};

/**
 * イベントハンドラ
 */
Diceros.Layer.prototype.event = goog.abstractMethod;

/**
 * 現在のペンのサイズを取得
 * @return {number} 現在のペンサイズ
 */
Diceros.Layer.prototype.getCurrentPenSize = function() {
  return this.app.getCurrentSizerWindow().size;
};

// end of scope
});
/* vim:set expandtab ts=2 sw=2 tw=80: */
