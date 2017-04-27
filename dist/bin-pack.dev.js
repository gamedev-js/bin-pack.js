
/*
 * bin-pack.js v1.0.0
 * (c) 2017 @Johnny Wu
 * Released under the MIT License.
 */

var binpack = (function () {
'use strict';

var utils = {
  rotatedWidth (node) {
    return node.rotated ? node.height : node.width;
  },

  rotatedHeight (node) {
    return node.rotated ? node.width : node.height;
  },
};

class SimplePacker {
  constructor() {
  }

  pack(nodes, width, height, padding, allowRotate, progress) {
    let curX = 0;
    let curY = 0;
    let maxY = 0;

    let hasError = false;
    let len = nodes.length;

    for (let i = 0; i < len; ++i) {
      let node = nodes[i];
      if (curX + utils.rotatedWidth(node) > width) {
        curX = 0;
        curY = curY + maxY + padding;
        maxY = 0;
      }

      if (curY + utils.rotatedHeight(node) > height) {
        hasError = true;
      }

      node.x = curX;
      node.y = curY;

      curX = curX + utils.rotatedWidth(node) + padding;
      if (utils.rotatedHeight(node) > maxY) {
        maxY = utils.rotatedHeight(node);
      }

      if (progress) {
        progress(i, len, node.id);
      }
    }

    if (hasError) {
      return new Error('Pack failed.');
    }
  }
}

class TreePacker {
  constructor() {
  }

  pack(nodes, width, height, padding, allowRotate, progress) {
    let root = {
      x: 0,
      y: 0,
      width: width,
      height: height,
      right: null,
      bottom: null,
    };

    let len = nodes.length;
    let hasError = false;

    for (let i = 0; i < len; ++i) {
      let node = nodes[i];
      let result = this._insertNode(root, node, padding, allowRotate);
      if (result) {
        node.x = result.x;
        node.y = result.y;
      } else {
        hasError = true;
      }

      if (progress) {
        progress(i, len, node.id);
      }
    }

    if (hasError) {
      return new Error('Pack failed.');
    }
  }

  _insertNode(treeNode, node, padding, allowRotate) {
    // when this node is already occupied (when it has children),
    // forward to child nodes recursively
    if (treeNode.right !== null) {
      var pos = this._insertNode(treeNode.right, node, padding, allowRotate);
      if (pos) {
        return pos;
      }

      return this._insertNode(treeNode.bottom, node, padding, allowRotate);
    }

    // determine trimmed and padded sizes
    let nodeWidth = utils.rotatedWidth(node);
    let nodeHeight = utils.rotatedHeight(node);
    let paddedWidth = nodeWidth + padding;
    let paddedHeight = nodeHeight + padding;

    // trimmed element size must fit within current node rect
    if (nodeWidth > treeNode.width || nodeHeight > treeNode.height) {
      if (allowRotate === false) {
        return null;
      }

      if (nodeHeight > treeNode.width || nodeWidth > treeNode.height) {
        return null;
      }

      node.rotated = !node.rotated;
      nodeWidth = utils.rotatedWidth(node);
      nodeHeight = utils.rotatedHeight(node);
      paddedWidth = nodeWidth + padding;
      paddedHeight = nodeHeight + padding;
    }

    // create first child node in remaining space to the right, using nodeHeight
    // so that only other elements with the same height or less can be added there
    // (we do not use paddedHeight, because the padding area is reserved and should
    // never be occupied)
    treeNode.right = {
      x: treeNode.x + paddedWidth,
      y: treeNode.y,
      width: treeNode.width - paddedWidth,
      height: nodeHeight,
      right: null,
      bottom: null,
    };

    // create second child node in remaining space at the bottom, occupying the entire width
    treeNode.bottom = {
      x: treeNode.x,
      y: treeNode.y + paddedHeight,
      width: treeNode.width,
      height: treeNode.height - paddedHeight,
      right: null,
      bottom: null,
    };

    // return position where to put element
    return { x: treeNode.x, y: treeNode.y };
  }
}

// ==================
// sort
// ==================

function _compareByWidth(a, b) {
  let ret = a.width - b.width;
  if (ret === 0) {
    ret = a.id.localeCompare(b.id);
  }
  return ret;
}

function _compareByHeight(a, b) {
  let ret = a.height - b.height;
  if (ret === 0) {
    ret = a.id.localeCompare(b.id);
  }
  return ret;
}

function _compareByArea(a, b) {
  let ret = a.width * a.height - b.width * b.height;
  if (ret === 0) {
    ret = a.id.localeCompare(b.id);
  }
  return ret;
}

function _compareByID(a, b) {
  return a.id.localeCompare(b.id);
}

function _compareByRotateWidth(a, b) {
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

function _compareByRotateHeight(a, b) {
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
  let packer = null;

  if (algorithm === 'simple') {
    packer = new SimplePacker();
  } else if (algorithm === 'tree') {
    packer = new TreePacker();
  }

  return packer.pack(nodes, width, height, padding, allowRotate, progress);
}

var index = {
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
      nodes.sort(allowRotate ? _compareByRotateWidth : _compareByWidth);
    } else if (sortBy === 'height') {
      nodes.sort(allowRotate ? _compareByRotateHeight : _compareByHeight);
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

return index;

}());
//# sourceMappingURL=bin-pack.dev.js.map
