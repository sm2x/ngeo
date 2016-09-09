goog.provide('gmf.Themes');
goog.provide('gmf.ThemesEventType');

goog.require('gmf');
goog.require('ngeo.LayerHelper');
goog.require('ol.array');
goog.require('ol.Collection');
goog.require('ol.events.EventTarget');
goog.require('ol.layer.Tile');


/**
 * @typedef {Object<string, GmfOgcServer>}
 */
gmf.OgcServers;


/**
 * @enum {string}
 */
gmf.ThemesEventType = {
  CHANGE: 'change'
};


/**
 * @typedef {{
 *     themes: Array.<Object>,
 *     background_layers: Array.<Object>,
 *     ogcServers: gmf.OgcServers
 * }}
 */
gmf.ThemesResponse;


/**
 * The Themes service. This service interacts
 * with c2cgeoportal's "themes" web service and exposes functions that return
 * objects in the tree returned by the "themes" web service.
 *
 * @constructor
 * @extends {ol.events.EventTarget}
 * @param {angular.$http} $http Angular http service.
 * @param {angular.$injector} $injector Main injector.
 * @param {angular.$q} $q Angular q service
 * @param {ngeo.LayerHelper} ngeoLayerHelper Ngeo Layer Helper.
 * @param {angularGettext.Catalog} gettextCatalog Gettext catalog.
 * @ngInject
 * @ngdoc service
 * @ngname gmfThemes
 */
gmf.Themes = function($http, $injector, $q, ngeoLayerHelper, gettextCatalog) {

  ol.events.EventTarget.call(this);

  /**
   * @type {angular.$q}
   * @private
   */
  this.$q_ = $q;

  /**
   * @type {angular.$http}
   * @private
   */
  this.$http_ = $http;

  /**
   * @type {?string}
   * @private
   */
  this.treeUrl_ = null;
  if ($injector.has('gmfTreeUrl')) {
    this.treeUrl_ = $injector.get('gmfTreeUrl');
  }

  this.cacheVersion_ = '0';
  if ($injector.has('cacheVersion')) {
    this.cacheVersion_ = $injector.get('cacheVersion');
  }

  /**
   * @type {ngeo.Location}
   * @private
   */
  this.ngeoLocation_ = null;
  if ($injector.has('ngeoLocation')) {
    this.ngeoLocation_ = $injector.get('ngeoLocation');
  }

  /**
   * @type {ngeo.LayerHelper}
   * @private
   */
  this.layerHelper_ = ngeoLayerHelper;

  /**
   * @type {angularGettext.Catalog}
   * @private
   */
  this.gettextCatalog = gettextCatalog;

  /**
   * @type {angular.$q.Deferred}
   * @private
   */
  this.deferred_ = $q.defer();

  /**
   * @type {angular.$q.Promise}
   * @private
   */
  this.promise_ = this.deferred_.promise;

  /**
   * @type {boolean}
   * @private
   */
  this.loaded_ = false;

  /**
   * @type {angular.$q.Promise}
   * @private
   */
  this.bgLayerPromise_ = null;

};
ol.inherits(gmf.Themes, ol.events.EventTarget);


/**
 * @param {Array.<GmfThemesNode>} themes Array of "theme" objects.
 * @param {string} name The layer name.
 * @return {GmfThemesNode} The group.
 */
gmf.Themes.findGroupByLayerNodeName = function(themes, name) {
  for (var i = 0, ii = themes.length; i < ii; i++) {
    var theme = themes[i];
    for (var j = 0, jj = theme.children.length; j < jj; j++) {
      var group = theme.children[j];
      var childNodes = [];
      gmf.Themes.getFlatNodes(group, childNodes);
      for (var k = 0, kk = childNodes.length; k < kk; k++) {
        var layer = childNodes[k];
        if (layer.name == name) {
          return group;
        }
      }
    }
  }
  return null;
};

/**
 * Find a layer group object by its name. Return null if not found.
 * @param {Array.<GmfThemesNode>} themes Array of "theme" objects.
 * @param {string} name The group name.
 * @return {GmfThemesNode} The group.
 */
gmf.Themes.findGroupByName = function(themes, name) {
  for (var i = 0, ii = themes.length; i < ii; i++) {
    var theme = themes[i];
    for (var j = 0, jj = theme.children.length; j < jj; j++) {
      var group = theme.children[j];
      if (group.name == name) {
        return group;
      }
    }
  }
  return null;
};


/**
 * Find an object by its name. Return null if not found.
 * @param {Array.<T>} objects Array of objects with a 'name' attribute.
 * @param {string} objectName The object name.
 * @return {T} The object.
 * @template T
 * @private
 */
gmf.Themes.findObjectByName_ = function(objects, objectName) {
  return ol.array.find(objects, function(object) {
    return object['name'] === objectName;
  });
};


/**
 * Find a theme object by its name. Return null if not found.
 * @param {Array.<GmfThemesNode>} themes Array of "theme" objects.
 * @param {string} themeName The theme name.
 * @return {GmfThemesNode} The theme object.
 */
gmf.Themes.findThemeByName = function(themes, themeName) {
  return gmf.Themes.findObjectByName_(themes, themeName);
};


/**
 * Return a "type" that defines the node.
 * @param {GmfThemesNode} node Layer tree node.
 * @return {string} A type.
 */
gmf.Themes.getNodeType = function(node) {
  var children = node.children;
  var mixed = node.mixed;
  if (node.children !== undefined && mixed) {
    return gmf.Themes.NodeType.MIXED_GROUP;
  }
  if (children !== undefined && !mixed) {
    return gmf.Themes.NodeType.NOT_MIXED_GROUP;
  }
  if (node.type === 'WMTS') {
    return gmf.Themes.NodeType.WMTS;
  }
  return gmf.Themes.NodeType.WMS;
};


/**
 * Fill the given "nodes" array with all node in the given node including the
 * given node itself.
 * @param {GmfThemesNode} node Layertree node.
 * @param {Array.<GmfThemesNode>} nodes An array.
 * @export
 */
gmf.Themes.getFlatNodes = function(node, nodes) {
  var i;
  var children = node.children;
  if (children !== undefined) {
    for (i = 0; i < children.length; i++) {
      gmf.Themes.getFlatNodes(children[i], nodes);
    }
  } else {
    nodes.push(node);
  }
};


/**
 * Get background layers.
 * @param {Object.<string, string>} appDimensions Dimensions.
 * @return {angular.$q.Promise.<Array.<GmfThemesNode>>} Promise.
 */
gmf.Themes.prototype.getBgLayers = function(appDimensions) {
  if (this.bgLayerPromise_) {
    return this.bgLayerPromise_;
  }
  var $q = this.$q_;
  var layerHelper = this.layerHelper_;

  /**
   * @param {GmfThemesNode} item The item.
   * @param {ol.layer.Base} layer The layer.
   * @return {ol.layer.Base} the provided layer.
   */
  var callback = function(item, layer) {
    layer.set('label', item.name);
    layer.set('metadata', item.metadata);
    layer.set('dimensions', item.dimensions);
    var ids = gmf.LayertreeController.getLayerNodeIds(item);
    layer.set('querySourceIds', ids);
    layer.set('editableIds', []);
    return layer;
  };

  /**
   * @param {GmfThemesNode} item The item.
   * @return {angular.$q.Promise.<ol.layer.Base>|ol.layer.Base} the created layer.
   */
  var layerLayerCreationFn = function(item) {
    // Overwrite conflicting server dimensions with application ones
    for (var dimkey in item.dimensions) {
      if (appDimensions[dimkey] !== undefined) {
        item.dimensions[dimkey] = appDimensions[dimkey];
      }
    }

    goog.asserts.assert(item.url, 'Layer URL is required');

    if (item.type === 'WMTS') {
      return layerHelper.createWMTSLayerFromCapabilitites(
          item.url,
          item.name,
          item.dimensions
      ).then(callback.bind(null, item)).then(null, function(error) {
        console.error(error || 'unknown error');
        // Continue even if some layers have failed loading.
        return $q.resolve(undefined);
      });
    } else if (item.type === 'WMS') {
      return callback(item, layerHelper.createBasicWMSLayer(
          item.url,
          item.layers,
          item.serverType,
          undefined, // time
          item.dimensions
      ));
    }
    goog.asserts.fail('Unsupported type: ' + item.type);
  };

  /**
   * @param {GmfThemesNode} item The item.
   * @return {angular.$q.Promise.<ol.layer.Group>} the created layer.
   */
  var layerGroupCreationFn = function(item) {
    // We assume no child is a layer group.
    var promises = item.children.map(layerLayerCreationFn);
    return $q.all(promises).then(function(layers) {
      var collection;
      if (layers) {
        layers = layers.filter(function(l) {
          return l;
        });
        collection = new ol.Collection(layers);
      }
      var group = layerHelper.createBasicGroup(collection);
      callback(item, group);
      return group;
    });
  };

  /**
   * @param {GmfThemesResponse} data The "themes" web service response.
   * @return {angular.$q.Promise.<Array.<ol.layer.Base>>} Promise.
   */
  var promiseSuccessFn = function(data) {
    var promises = data.background_layers.map(function(item) {
      var itemType = item.type;
      if (itemType === 'WMTS' || itemType === 'WMS') {
        return layerLayerCreationFn(item);
      } else if (item.children) {
        // group of layers
        return layerGroupCreationFn(item);
      } else {
        return undefined;
      }
    }, this);
    return $q.all(promises);
  }.bind(this);

  this.bgLayerPromise_ = this.promise_.then(promiseSuccessFn).then(function(values) {
    var layers = [];

    // (1) add a blank layer
    layers.push(new ol.layer.Tile({
      'label': this.gettextCatalog.getString('blank'),
      'metadata': {'thumbnail': ''}
    }));

    // (2) add layers that were returned
    values.forEach(function(layer) {
      if (layer) {
        layers.push(layer);
      }
    });
    return layers;
  }.bind(this));

  return this.bgLayerPromise_;
};


/**
 * Get a theme object by its name.
 * @param {string} themeName Theme name.
 * @return {angular.$q.Promise.<GmfThemesNode>} Promise.
 * @export
 */
gmf.Themes.prototype.getThemeObject = function(themeName) {
  return this.promise_.then(
      /**
       * @param {GmfThemesResponse} data The "themes" web service response.
       * @return {GmfThemesNode} The theme object for themeName, or null if not found.
       */
      function(data) {
        return gmf.Themes.findThemeByName(data.themes, themeName);
      });
};


/**
 * Get an array of theme objects.
 * @return {angular.$q.Promise.<Array.<GmfThemesNode>>} Promise.
 * @export
 */
gmf.Themes.prototype.getThemesObject = function() {
  return this.promise_.then(
      /**
       * @param {GmfThemesResponse} data The "themes" web service response.
       * @return {Array.<GmfThemesNode>} The themes object.
       */
      function(data) {
        return data.themes;
      });
};


/**
 * Get an array of background layer objects.
 * @return {angular.$q.Promise.<Array.<GmfThemesNode>>} Promise.
 */
gmf.Themes.prototype.getBackgroundLayersObject = function() {
  goog.asserts.assert(this.promise_ !== null);
  return this.promise_.then(
      /**
       * @param {GmfThemesResponse} data The "themes" web service response.
       * @return {Array.<GmfThemesNode>} The background layers object.
       */
      function(data) {
        return data.background_layers;
      });
};


/**
 * Get the `ogcServers` object.
 * @return {angular.$q.Promise.<GmfOgcServers>} Promise.
 */
gmf.Themes.prototype.getOgcServersObject = function() {
  goog.asserts.assert(this.promise_ !== null);
  return this.promise_.then(
      /**
       * @param {GmfThemesResponse} data The "themes" web service response.
       * @return {GmfOgcServers} The `ogcServers` object.
       */
      function(data) {
        return data.ogcServers;
      });
};


/**
 * Returns a promise to check if one of the layers in the themes is editable.
 * @return {angular.$q.Promise.<boolean>} Promise.
 */
gmf.Themes.prototype.hasEditableLayers = function() {
  goog.asserts.assert(this.promise_ !== null);
  return this.promise_.then(this.hasEditableLayers_.bind(this));
};


/**
 * Returns if one of the layers in the themes is editable.
 * @param {GmfThemesResponse} data The "themes" web service response.
 * @return {boolean} Editable layers?
 */
gmf.Themes.prototype.hasEditableLayers_ = function(data) {
  return data.themes.some(function(theme) {
    var hasEditableLayers = theme.children.some(this.hasNodeEditableLayers_.bind(this));
    return hasEditableLayers;
  }.bind(this));
};


/**
 * @param {GmfThemesNode} node Theme node
 * @return {boolean} Editable layers?
 */
gmf.Themes.prototype.hasNodeEditableLayers_ = function(node) {
  if (node.editable) {
    return true;
  }

  var hasEditableLayers = false;
  var children = node.children;
  if (children && children.length) {
    hasEditableLayers = children.some(this.hasNodeEditableLayers_.bind(this));
  }
  return hasEditableLayers;
};


/**
 * @param {number=} opt_roleId The role id to send in the request.
 * Load themes from the "themes" service.
 * @export
 */
gmf.Themes.prototype.loadThemes = function(opt_roleId) {

  goog.asserts.assert(this.treeUrl_, 'gmfTreeUrl should be defined.');

  if (this.loaded_) {
    // reload the themes
    this.deferred_ = this.$q_.defer();
    this.promise_ = this.deferred_.promise;
    this.bgLayerPromise_ = null;
    this.loaded_ = false;
  }

  this.$http_.get(this.treeUrl_, {
    params: opt_roleId !== undefined ? {
      'role': opt_roleId,
      'cache_version': this.cacheVersion_
    } : {
      'cache_version': this.cacheVersion_
    },
    cache: false,
    withCredentials: true
  }).then(function(response) {
    if (response.data.errors.length != 0) {
      var message = 'The themes contain some errors:\n' +
        response.data.errors.join('\n');
      console.error(message);
      if (this.ngeoLocation_ !== null && this.ngeoLocation_.hasParam('debug')) {
        window.alert(message);
      }
    }
    this.deferred_.resolve(response.data);
    this.dispatchEvent(gmf.ThemesEventType.CHANGE);
    this.loaded_ = true;
  }.bind(this), function(response) {
    this.deferred_.reject(response);
  }.bind(this));
};


gmf.module.service('gmfThemes', gmf.Themes);


/**
 * @enum {string}
 */
gmf.Themes.NodeType = {
  MIXED_GROUP: 'MixedGroup',
  NOT_MIXED_GROUP: 'NotMixedGroup',
  WMTS: 'WMTS',
  WMS: 'WMS'
};
