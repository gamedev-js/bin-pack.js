import simple_pack from './lib/simple';
import tree_pack from './lib/tree';
import max_rect_pack from './lib/max-rect';

// ==================
// sort
// ==================

function _compareByWidth(a, b) {
  let ret = a.width - b.width;
  if (ret === 0) {
    ret = _compareByID(a,b);
  }
  return ret;
}

function _compareByHeight(a, b) {
  let ret = a.height - b.height;
  if (ret === 0) {
    ret = _compareByID(a,b);
  }
  return ret;
}

function _compareByArea(a, b) {
  let ret = a.width * a.height - b.width * b.height;
  if (ret === 0) {
    ret = _compareByID(a,b);
  }
  return ret;
}

function _compareByID(a, b) {
  if (typeof a.id === 'string') {
    return a.id.localeCompare(b.id);
  }
  return a.id - b.id;
}

function _compareByRotatedWidth(a, b) {
  let a_size = a.width;
  if (a.height > a.width) {
    a_size = a.height;
    a.rotated = true;
  }

  let b_size = b.width;
  if (b.height > b.width) {
    b_size = b.height;
    b.rotated = true;
  }

  let ret = a_size - b_size;
  if (ret === 0) {
    ret = a.id.localeCompare(b.id);
  }
  return ret;
}

function _compareByRotatedHeight(a, b) {
  let a_size = a.height;
  if (a.width > a.height) {
    a_size = a.width;
    a.rotated = true;
  }

  let b_size = b.height;
  if (b.width > b.height) {
    b_size = b.width;
    b.rotated = true;
  }

  let ret = a_size - b_size;
  if (ret === 0) {
    ret = a.id.localeCompare(b.id);
  }
  return ret;
}

function _pack(nodes, algorithm, width, height, padding, allowRotate, progress) {
  let pack = null;

  if (algorithm === 'simple') {
    pack = simple_pack;
  } else if (algorithm === 'tree') {
    pack = tree_pack;
  } else if (algorithm === 'max-rect') {
    pack = max_rect_pack;
  }

  return pack(nodes, width, height, padding, allowRotate, progress);
}

export default {
  /**
   * @method sort
   * @param {Array} nodes
   * @param {string} sortBy - 'width', 'height', 'area', 'id' - default is 'area'
   * @param {string} order - 'ascending', 'descending', default is 'ascending'
   * @param {boolean} allowRotate - default is true
   */
  sort(nodes, sortBy = 'area', order = 'ascending', allowRotate = true) {
    // reset rotation
    for (let i = 0; i < nodes.length; ++i) {
      nodes[i].rotated = false;
    }

    // sort by
    if (sortBy === 'width') {
      nodes.sort(allowRotate ? _compareByRotatedWidth : _compareByWidth);
    } else if (sortBy === 'height') {
      nodes.sort(allowRotate ? _compareByRotatedHeight : _compareByHeight);
    } else if (sortBy === 'area') {
      nodes.sort(_compareByArea);
    } else {
      nodes.sort(_compareByID);
    }

    // sort order
    if (order === 'descending') {
      nodes.reverse();
    }

    return nodes;
  },

  /**
   * @method pack
   * @param {Array} nodes
   * @param {string} algorithm - 'simple', 'tree', 'max-rect', 'skyline'
   * @param {number} width
   * @param {number} height
   * @param {number} padding - default is 2
   * @param {boolean} allowRotate - default is true
   * @param {function} progress - default is null
   */
  pack(nodes, algorithm, width, height, padding = 2, allowRotate = true, progress = null) {
    return _pack(nodes, algorithm, width, height, padding, allowRotate, progress);
  },

  /**
   * @method packAutoResize
   * @param {Array} nodes
   * @param {string} algorithm - 'simple', 'tree', 'max-rect', 'skyline'
   * @param {number} width - default is 32
   * @param {number} height - default is 32
   * @param {number} padding - default is 2
   * @param {boolean} allowRotate - default is true
   * @param {function} progress - default is null
   */
  packAutoResize(nodes, algorithm, width = 32, height = 32, padding = 2, allowRotate = true, progress = null) {
    let w = width;
    let h = height;

    while(1) {
      let error = _pack(nodes, algorithm, w, h, padding, allowRotate, progress);

      if (!error) {
        return nodes;
      }

      if (w === 4096 && h === 4096) {
        console.error(error);
        return nodes;
      }

      if (w === h) {
        w *= 2;
      } else {
        h = w;
      }
    }
  }
};