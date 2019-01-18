import angular from 'angular';
import gmfThemeThemes from 'gmf/theme/Themes.js';
import {WMSInfoFormat} from 'ngeo/datasource/OGC.js';
import olFormatWMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo.js';
import olSourceImageWMS from 'ol/source/ImageWMS.js';

/**
 * A service that collects all queryable layer nodes from all themes, stores
 * them and use them to make WMS GetFeatureInfo queries. Queries can be made
 * regardless of the associated layer visibility. The layer nodes are also
 * loaded only once.
 *
 * @param {angular.IHttpService} $http Angular $http service.
 * @param {angular.IQService} $q Angular $q service.
 * @param {import("gmf/theme/Themes.js").default} gmfThemes The gmf themes service.
 * @constructor
 * @ngInject
 */
function Query($http, $q, gmfThemes) {

  /**
   * @type {angular.IHttpService}
   * @private
   */
  this.http_ = $http;

  /**
   * @type {angular.IQService}
   * @private
   */
  this.q_ = $q;

  /**
   * @type {import("gmf/theme/Themes.js").default}
   * @private
   */
  this.gmfThemes_ = gmfThemes;

  /**
   * @type {?angular.IDeferred}
   * @private
   */
  this.getQueryableLayerNodesDefered_ = null;

}


/**
 * @return {angular.IPromise} Promise.
 * @export
 */
Query.prototype.getQueryableLayersInfo = function() {

  if (!this.getQueryableLayerNodesDefered_) {
    this.getQueryableLayerNodesDefered_ = this.q_.defer();
    this.gmfThemes_.getOgcServersObject().then((ogcServers) => {
      this.gmfThemes_.getThemesObject().then((themes) => {
        if (!themes) {
          return;
        }

        // Get all queryable nodes
        const allQueryableLayersInfo =
            getQueryableLayersInfoFromThemes(
              themes,
              ogcServers
            );

        // Narrow down to only those that have the 'copyable' metadata set
        const queryableLayersInfo = [];
        for (let i = 0, ii = allQueryableLayersInfo.length; i < ii; i++) {
          if (allQueryableLayersInfo[i].layerNode.metadata.copyable) {
            queryableLayersInfo.push(allQueryableLayersInfo[i]);
          }
        }

        this.getQueryableLayerNodesDefered_.resolve(queryableLayersInfo);
      });
    });
  }

  return this.getQueryableLayerNodesDefered_.promise;

};


/**
 * From a list of theme nodes, collect all WMS layer nodes that are queryable.
 * A list of OGC servers is given in order to bind each queryable layer node
 * to its associated server and be able to build requests.
 *
 * @param {Array.<gmfThemes.GmfTheme>} themes List of theme nodes.
 * @param {gmfThemes.GmfOgcServers} ogcServers List of ogc servers
 * @return {Array.<gmfx.ObjectEditingQueryableLayerInfo>} List of
 *     queryable layers information.
 * @export
 */
function getQueryableLayersInfoFromThemes(
  themes, ogcServers
) {
  const queryableLayersInfo = [];
  let theme;
  let group;
  let nodes;
  let node;

  for (let i = 0, ii = themes.length; i < ii; i++) {
    theme = /** @type {gmfThemes.GmfTheme} */ (themes[i]);
    for (let j = 0, jj = theme.children.length; j < jj; j++) {
      group = /** @type {gmfThemes.GmfGroup} */ (theme.children[j]);

      // Skip groups that don't have an ogcServer set
      if (!group.ogcServer) {
        continue;
      }

      nodes = [];
      gmfThemeThemes.getFlatNodes(group, nodes);

      for (let k = 0, kk = nodes.length; k < kk; k++) {
        node = /** @type {gmfThemes.GmfGroup|gmfThemes.GmfLayerWMS} */ (
          nodes[k]);

        // Skip groups within groups
        if (node.children && node.children.length) {
          continue;
        }

        if (node.childLayers &&
          node.childLayers[0] &&
          node.childLayers[0].queryable
        ) {
          queryableLayersInfo.push({
            layerNode: node,
            ogcServer: ogcServers[group.ogcServer]
          });
        }
      }
    }
  }

  return queryableLayersInfo;
}


/**
 * From a queryable layer (WMS layer node), use its associated OGC server
 * to issue a single WMS GetFeatureInfo request at a specific location on a
 * specific map to fetch a single feature. If no feature is found, a `null`
 * value is returned.
 *
 * @param {gmfx.ObjectEditingQueryableLayerInfo} layerInfo Queryable layer
 *     information.
 * @param {import("ol/coordinate.js").Coordinate} coordinate Coordinate.
 * @param {import("ol/Map.js").default} map Map.
 * @return {angular.IPromise} Promise.
 * @export
 */
Query.prototype.getFeatureInfo = function(layerInfo, coordinate, map) {
  const view = map.getView();
  const projCode = view.getProjection().getCode();
  const resolution = /** @type {number} */(view.getResolution());
  const infoFormat = WMSInfoFormat.GML;
  const layerNode = layerInfo.layerNode;
  const layersParam = layerNode.layers.split(',');
  const ogcServer = layerInfo.ogcServer;

  const format = new olFormatWMSGetFeatureInfo({
    layers: layersParam
  });

  const wmsSource = new olSourceImageWMS({
    url: ogcServer.url,
    params: {
      layers: layersParam
    }
  });

  const url = /** @type {string} */ (
    wmsSource.getGetFeatureInfoUrl(coordinate, resolution, projCode, {
      'INFO_FORMAT': infoFormat,
      'FEATURE_COUNT': 1,
      'QUERY_LAYERS': layersParam
    })
  );

  return this.http_.get(url).then(
    (response) => {
      const features = format.readFeatures(response.data);
      return (features && features[0]) ? features[0] : null;
    }
  );
};


/**
 * @type {!angular.IModule}
 */
const module = angular.module('gmfObjectEditingQuery', [
  gmfThemeThemes.name,
]);
module.service('gmfObjectEditingQuery', exports);


export default module;
