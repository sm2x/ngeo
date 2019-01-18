/**
 */
// Todo - use the 'Filter' theme instead if the 'Edit' theme

import angular from 'angular';
import appURL from './url.js';
import './filterselector.css';
import 'jquery-ui/ui/widgets/tooltip.js';
import gmfAuthenticationModule from 'gmf/authentication/module.js';

import gmfDatasourceManager from 'gmf/datasource/Manager.js';

import gmfFiltersModule from 'gmf/filters/module.js';
import gmfLayertreeComponent from 'gmf/layertree/component.js';
import gmfLayertreeTreeManager from 'gmf/layertree/TreeManager.js';

import gmfMapComponent from 'gmf/map/component.js';

import gmfThemeThemes from 'gmf/theme/Themes.js';
import ngeoDatasourceDataSources from 'ngeo/datasource/DataSources.js';
import ngeoQueryBboxQueryComponent from 'ngeo/query/bboxQueryComponent.js';
import ngeoQueryMapQueryComponent from 'ngeo/query/mapQueryComponent.js';
import ngeoMiscToolActivate from 'ngeo/misc/ToolActivate.js';
import ngeoMiscToolActivateMgr from 'ngeo/misc/ToolActivateMgr.js';
import EPSG21781 from '@geoblocks/proj/src/EPSG_21781.js';
import olMap from 'ol/Map.js';
import olView from 'ol/View.js';
import olLayerTile from 'ol/layer/Tile.js';
import olSourceOSM from 'ol/source/OSM.js';


/** @type {!angular.IModule} **/
const module = angular.module('gmfapp', [
  'gettext',
  gmfAuthenticationModule.name,
  gmfDatasourceManager.name,
  gmfLayertreeComponent.name,
  gmfLayertreeTreeManager.name,
  gmfFiltersModule.name,
  gmfMapComponent.name,
  gmfThemeThemes.name,
  ngeoDatasourceDataSources.name,
  ngeoMiscToolActivateMgr.name,
  ngeoQueryBboxQueryComponent.name,
  ngeoQueryMapQueryComponent.name,
]);


exports.module.value('gmfTreeUrl', appURL.GMF_THEMES);
exports.module.value('authenticationBaseUrl', appURL.GMF_DEMO);
exports.module.value('gmfLayersUrl', appURL.GMF_LAYERS);

exports.module.constant('defaultTheme', 'Filters');
exports.module.constant('angularLocaleScript', '../build/angular-locale_{{locale}}.js');


exports.MainController = class {

  /**
   * @param {!angular.IScope} $scope Angular scope.
   * @param {import("gmf/datasource/Manager.js").default} gmfDataSourcesManager The gmf
   *     data sources manager service.
   * @param {import("gmf/theme/Themes.js").default} gmfThemes The gmf themes service.
   * @param {import("gmf/layertree/TreeManager.js").default} gmfTreeManager gmf Tree Manager service.
   * @param {import("ngeo/datasource/DataSources.js").default} ngeoDataSources Ngeo data sources service.
   * @param {import("ngeo/misc/ToolActivateMgr.js").default} ngeoToolActivateMgr Ngeo ToolActivate manager
   *     service.
   * @ngInject
   */
  constructor($scope, gmfDataSourcesManager, gmfThemes, gmfTreeManager,
    ngeoDataSources, ngeoToolActivateMgr
  ) {

    /**
     * @type {!angular.IScope}
     * @private
     */
    this.scope_ = $scope;

    gmfThemes.loadThemes();

    /**
     * @type {import("gmf/layertree/TreeManager.js").default}
     * @export
     */
    this.gmfTreeManager = gmfTreeManager;

    /**
     * @type {import("ol/Map.js").default}
     * @export
     */
    this.map = new olMap({
      layers: [
        new olLayerTile({
          source: new olSourceOSM()
        })
      ],
      view: new olView({
        projection: EPSG21781,
        resolutions: [200, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5],
        center: [537635, 152640],
        zoom: 2
      })
    });

    // Init the datasources with our map.
    gmfDataSourcesManager.setDatasourceMap(this.map);

    gmfThemes.getThemesObject().then((themes) => {
      if (themes) {
        // Set 'Filters' theme, i.e. the one with id 176
        for (let i = 0, ii = themes.length; i < ii; i++) {
          if (themes[i].id === 176) {
            this.gmfTreeManager.setFirstLevelGroups(themes[i].children);
            break;
          }
        }
      }
    });

    /**
     * @type {string}
     * @export
     */
    this.toolGroup = 'mapTools';

    /**
     * @type {boolean}
     * @export
     */
    this.filterSelectorActive = true;

    const filterSelectorToolActivate = new ngeoMiscToolActivate(
      this, 'filterSelectorActive');
    ngeoToolActivateMgr.registerTool(
      'dummyTools', filterSelectorToolActivate, true);

    /**
     * @type {boolean}
     * @export
     */
    this.dummyActive = false;

    const dummyToolActivate = new ngeoMiscToolActivate(
      this, 'dummyActive');
    ngeoToolActivateMgr.registerTool(
      'dummyTools', dummyToolActivate, false);

    /**
     * @type {boolean}
     * @export
     */
    this.queryActive = true;

    const queryToolActivate = new ngeoMiscToolActivate(
      this, 'queryActive');
    ngeoToolActivateMgr.registerTool(
      this.toolGroup, queryToolActivate, true);

    // initialize tooltips
    $('[data-toggle="tooltip"]').tooltip({
      container: 'body',
      trigger: 'hover'
    });

  }
};


exports.module.controller('MainController', exports.MainController);


export default exports;
