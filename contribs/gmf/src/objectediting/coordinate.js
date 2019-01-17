/**
 * @module import("gmf/objectediting/coordinate.js").default
 */
const exports = {};


/**
 * Convert a given coordinate or list of coordinates of any 'nesting' level
 * to XY, i.e. remove any extra dimensions to the coordinates and keep only 2.
 *
 * @param {Array.<import("ol/Coordinate.js").default>|import("ol/Coordinate.js").default} coordinates Coordinates
 * @param {number} nesting Nesting level.
 * @return {Array.<import("ol/Coordinate.js").default>|import("ol/Coordinate.js").default} Converted coordinates.
 */
exports.toXY = function(coordinates, nesting) {
  if (nesting === 0) {
    if (coordinates.length > 2) {
      coordinates = [coordinates[0], coordinates[1]];
    }
  } else {
    for (let i = 0, ii = coordinates.length; i < ii; i++) {
      coordinates[i] = exports.toXY(coordinates[i], nesting - 1);
    }
  }
  return coordinates;
};


export default exports;
