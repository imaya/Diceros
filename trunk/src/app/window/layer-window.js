
goog.provide('application.Diceros.LayerWindow');

goog.require('goog.dom');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.events');
goog.require('goog.events.EventType');

goog.require('goog.ui.Tooltip');
goog.require('goog.ui.Toolbar');

goog.require('goog.ui.ToolbarMenuButton');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuSeparator');

goog.require('application.Diceros.util');
goog.require('application.Diceros.Window');
goog.require('application.Diceros.LayerType');

goog.scope(function(){
/**
 * レイヤー制御ウィンドウクラス
 *
 * @param {application.Diceros.Application} app
 * @param {number} index
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 *
 * @extends {application.Diceros.Window}
 * @constructor
 */
application.Diceros.LayerWindow =
function(app, index, opt_domHelper) {
  goog.base(this, app, index, opt_domHelper);
  //application.Diceros.Window.call(this, app, index, opt_domHelper);

  this.name = 'LayerWindow';
  this.element = null;
  this.layerListElement = null;
};
goog.inherits(
  application.Diceros.LayerWindow,
  application.Diceros.Window
);

/**
 * CSS クラス名
 * @type {string}
 */
application.Diceros.LayerWindow.CLASS_NAME_ = goog.getCssName('layerwindow');

/**
 * このコンポーネントが decorate 可能かどうか
 */
application.Diceros.LayerWindow.prototype.canDecorate = function() {
  return false;
};

/**
 * コンポーネントの初期化処理
 */
application.Diceros.LayerWindow.prototype.decorateInternal =
function(element){
  goog.base(this, 'decorateInternal', element);

  // ルートノード
  goog.dom.classes.add(
    element,
    application.Diceros.LayerWindow.CLASS_NAME_
  );
  goog.dom.classes.add(
    element,
    this.app.cssClassPrefix + 'layerWindow'
  );

  // ツールバー
  this.toolbar = this.createToolbar();

  // レイヤーリスト
  this.layerListElement = goog.dom.createElement('ul');
  goog.dom.classes.add(
    this.layerListElement,
    this.app.cssClassPrefix + 'layerList'
  );
  goog.dom.append(this.element, this.layerListElement);
  this.refresh();
};

/**
 * ルートノードの作成
 */
application.Diceros.LayerWindow.prototype.createDom = function() {
  this.element = goog.dom.createElement('div');

  this.decorateInternal(this.element);
};

/**
 * ツールバーの作成
 */
application.Diceros.LayerWindow.prototype.createToolbar = function() {
  var self = this,
      toolbar = new goog.ui.Toolbar(),
      layer = new goog.ui.Menu(),
      layerButton = new goog.ui.MenuButton('Add Layer', layer),
      layerItems = [
        {label: 'VectorLayer',
         type: application.Diceros.LayerType.VECTOR_LAYER},
        {label: 'RasterLayer',
         type: application.Diceros.LayerType.RASTER_LAYER}
      ];

  layerButton.setTooltip('Add Layer');
  goog.array.forEach(layerItems, function(obj){
    var item;
    if (obj) {
      item = new goog.ui.MenuItem(obj.label);
      item.setValue(obj.type);
      // XXX: 現状はベクタレイヤーのみ
      if (obj.type !== application.Diceros.LayerType.VECTOR_LAYER) {
        item.setEnabled(false);
      }
      goog.events.listen(
        item,
        goog.ui.Component.EventType.ACTION,
        function(event) {
          var canvasWindow = self.app.getCurrentCanvasWindow();

          canvasWindow.addLayer(event.target.getValue());
          self.refresh();
        }
      );
    } else {
      item = new goog.ui.MenuSeparator();
    }
    layer.addChild(item, true);
  }, this);
  // XXX: event handler

  toolbar.addChild(layerButton, true);

  toolbar.render(this.element);
};

/**
 * リフレッシュする
 */
application.Diceros.LayerWindow.prototype.refresh = function() {
  var self = this,
      canvasWindow = this.app.getCurrentCanvasWindow(),
      layers,
      indexMap = {};

  // TODO: this.clear();
  goog.dom.removeChildren(this.layerListElement);

  // キャンバスが選択されていなかったら何も表示しない
  if (!canvasWindow) {
    return;
  }

  layers = canvasWindow.layers;

  // レイヤーのリスト表示
  for (var i = 0, l = layers.length; i < l; i++) {
    var li = goog.dom.createElement('li'),
        checkbox = goog.dom.createElement('input'),
        layer = layers[i],
        name = layer.name;

    // チェックボックス＋レイヤー名
    goog.dom.setProperties(
      checkbox,
      {'type': 'checkbox', 'checked': layer.visible}
    );
    goog.dom.append(
      li,
      checkbox
    );
    goog.dom.append(
      li,
      goog.dom.createTextNode(name + '(' + i + ')')
    );

    // 現在の選択レイヤーのスタイルを変更
    if (i === canvasWindow.currentLayer) {
      goog.dom.classes.add(
        li,
        this.app.cssClassPrefix + 'selectedLayer'
      );
    }

    // event
    application.Diceros.util.data(li, 'layerIndex', i);
    goog.events.listen(checkbox, goog.events.EventType.CLICK,
      function(event){
        var parent = this.parentNode,
            index = application.Diceros.util.data(
              parent,
              'layerIndex'
            ),
            layer = canvasWindow.layers[index];

        if (layer.visible) {
          layer.hide();
        } else {
          layer.show();
        }

        self.refresh();
      }
    );
    goog.events.listen(li, goog.events.EventType.CLICK,
      function(event) {
        canvasWindow.selectLayer(
          application.Diceros.util.data(
            this,
            'layerIndex'
          )
        );
        self.refresh();
      }
    );

    application.Diceros.util.prepend(this.layerListElement, li);
  }
};

});
/* vim:set expandtab ts=2 sw=2 tw=80: */
