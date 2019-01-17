/**
 * @module import("ngeo/grid/Config.js").default
 */
import angular from 'angular';
import {getUid as olUtilGetUid} from 'ol/util.js';

/**
 * @param {Array.<Object>|undefined} data Entries/objects to be shown in a grid.
 * @param {Array.<GridColumnDef>|undefined} columnDefs Column definition of a grid.
 * @constructor
 * @export
 */
const exports = function(data, columnDefs) {
  /**
   * @type {Array.<Object>|undefined}
   * @export
   */
  this.data = data;

  /**
   * @type {Array.<GridColumnDef>|undefined}
   * @export
   */
  this.columnDefs = columnDefs;

  /**
   * @type {!Object.<string, Object>}
   * @export
   */
  this.selectedRows = {};
};


/**
 * Get an ID for a row.
 * @param {Object} attributes An entry/row.
 * @return {string} Unique id for this object.
 * @export
 */
exports.getRowUid = function(attributes) {
  return `${olUtilGetUid(attributes)}`;
};


/**
 * Is the given row selected?
 * @param {Object} attributes An entry/row.
 * @return {boolean} True if already selected. False otherwise.
 * @export
 */
exports.prototype.isRowSelected = function(attributes) {
  return !!this.selectedRows[exports.getRowUid(attributes)];
};


/**
 * Returns the number of selected rows.
 * @return {number} Number of selected rows.
 * @export
 */
exports.prototype.getSelectedCount = function() {
  return Object.keys(this.selectedRows).length;
};


/**
 * Returns the selected rows.
 * @return {Array.<Object>} Selected rows in the current ordering.
 * @export
 */
exports.prototype.getSelectedRows = function() {
  return this.data.filter(row => this.isRowSelected(row));
};


/**
 * @param {Object} attributes An entry/row.
 * @public
 */
exports.prototype.selectRow = function(attributes) {
  const uid = exports.getRowUid(attributes);
  this.selectedRows[uid] = attributes;
};


/**
 * @param {Object} attributes An entry/row.
 * @public
 */
exports.prototype.toggleRow = function(attributes) {
  const uid = exports.getRowUid(attributes);
  const isSelected = this.isRowSelected(attributes);
  if (isSelected) {
    delete this.selectedRows[uid];
  } else {
    this.selectedRows[uid] = attributes;
  }
};


/**
 * Select all rows.
 * @export
 */
exports.prototype.selectAll = function() {
  this.data.forEach((attributes) => {
    this.selectRow(attributes);
  });
};


/**
 * Deselect all rows.
 * @export
 */
exports.prototype.unselectAll = function() {
  for (const rowId in this.selectedRows) {
    delete this.selectedRows[rowId];
  }
};


/**
 * Invert selection.
 * @export
 */
exports.prototype.invertSelection = function() {
  this.data.forEach((attributes) => {
    this.toggleRow(attributes);
  });
};

/**
 * @type {!angular.IModule}
 */
exports.module = angular.module('ngeoGridConfig', []);


export default exports;
