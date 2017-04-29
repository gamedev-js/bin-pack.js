
/*
 * bin-pack.js v1.0.1
 * (c) 2017 @Johnny Wu
 * Released under the MIT License.
 */

'use strict';

var utils = {
  rotatedWidth (node) {
    return node.rotated ? node.height : node.width;
  },

  rotatedHeight (node) {
    return node.rotated ? node.width : node.height;
  },
};

var simple_pack = function (nodes, width, height, padding, allowRotate, progress) {
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
};

function _insertNode(treeNode, node, padding, allowRotate) {
  // when this node is already occupied (when it has children),
  // forward to child nodes recursively
  if (treeNode.right !== null) {
    var pos = _insertNode(treeNode.right, node, padding, allowRotate);
    if (pos) {
      return pos;
    }

    return _insertNode(treeNode.bottom, node, padding, allowRotate);
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

var tree_pack = function (nodes, width, height, padding, allowRotate, progress) {
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
    let result = _insertNode(root, node, padding, allowRotate);
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
};

function _cloneRect(rect) {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

function _containsRect(a, b) {
  if (
    a.x <= b.x &&
    a.x + a.width >= b.x + b.width &&
    a.y <= b.y &&
    a.y + a.height >= b.y + b.height
  ) {
    return true;
  }

  return false;
}

function _scoreRect(freeRects, width, height, allowRotate, scores) {
  scores.score1 = Number.MAX_VALUE;
  scores.score2 = Number.MAX_VALUE;

  let newRect = { x: 0, y: 0, width: 1, height: 1 };
  let found = false;

  //
  for (let i = 0; i < freeRects.length; ++i) {
    let freeRect = freeRects[i];

    let leftoverHoriz, leftoverVert, shortSideFit, longSideFit;
    //
    if (freeRect.width >= width && freeRect.height >= height) {
      leftoverHoriz = Math.abs(Math.floor(freeRect.width) - width);
      leftoverVert = Math.abs(Math.floor(freeRect.height) - height);
      shortSideFit = Math.min(leftoverHoriz, leftoverVert);
      longSideFit = Math.max(leftoverHoriz, leftoverVert);

      if (shortSideFit < scores.score1 || (shortSideFit === scores.score1 && longSideFit < scores.score2)) {
        newRect.x = freeRect.x;
        newRect.y = freeRect.y;
        newRect.width = width;
        newRect.height = height;
        scores.score1 = shortSideFit;
        scores.score2 = longSideFit;

        found = true;
      }
    }

    // rotated
    if (allowRotate && freeRect.width >= height && freeRect.height >= width) {
      leftoverHoriz = Math.abs(Math.floor(freeRect.width) - height);
      leftoverVert = Math.abs(Math.floor(freeRect.height) - width);
      shortSideFit = Math.min(leftoverHoriz, leftoverVert);
      longSideFit = Math.max(leftoverHoriz, leftoverVert);

      if (shortSideFit < scores.score1 || (shortSideFit === scores.score1 && longSideFit < scores.score2)) {
        newRect.x = freeRect.x;
        newRect.y = freeRect.y;
        newRect.width = height;
        newRect.height = width;
        scores.score1 = shortSideFit;
        scores.score2 = longSideFit;

        found = true;
      }
    }
  }

  //
  if (found === false) {
    scores.score1 = Number.MAX_VALUE;
    scores.score2 = Number.MAX_VALUE;
  }

  return newRect;
}

function _splitFreeNode(freeRects, freeNode, usedNode) {
  // Test with SAT if the rectangles even intersect.
  if (
    usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
    usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y
  ) {
    return false;
  }

  if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
    // New node at the top side of the used node.
    if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
      let newNode = _cloneRect(freeNode);
      newNode.height = usedNode.y - newNode.y;
      freeRects.push(newNode);
    }

    // New node at the bottom side of the used node.
    if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
      let newNode = _cloneRect(freeNode);
      newNode.y = usedNode.y + usedNode.height;
      newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
      freeRects.push(newNode);
    }
  }

  if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
    // New node at the left side of the used node.
    if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
      let newNode = _cloneRect(freeNode);
      newNode.width = usedNode.x - newNode.x;
      freeRects.push(newNode);
    }

    // New node at the right side of the used node.
    if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
      let newNode = _cloneRect(freeNode);
      newNode.x = usedNode.x + usedNode.width;
      newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
      freeRects.push(newNode);
    }
  }

  return true;
}

function _placeRect(freeRects, rect) {
  // NOTE: in _splitFreeNode, the number of freeRects will increase,
  // we need to pre-cache the current number of rects.
  let len = freeRects.length;
  for (let i = 0; i < len; ++i) {
    if (_splitFreeNode(freeRects, freeRects[i], rect)) {
      freeRects.splice(i, 1);
      --i;
      --len;
    }
  }

  // clean up
  _pruneFreeRects(freeRects);
}

function _pruneFreeRects(freeRects) {
  for (let i = 0; i < freeRects.length; ++i) {
    for (let j = i + 1; j < freeRects.length; ++j) {
      if (_containsRect(freeRects[j], freeRects[i])) {
        freeRects.splice(i, 1);
        --i;
        break;
      }

      if (_containsRect(freeRects[i], freeRects[j])) {
        freeRects.splice(j, 1);
        --j;
      }
    }
  }
}

var max_rect_pack = function(nodes, width, height, padding, allowRotate, progress) {
  let freeRects = [];

  // NOTE: the first free rect can have padding at the edge
  freeRects.push({
    x: 0,
    y: 0,
    width: width + padding,
    height: height + padding,
  });

  // clone
  let unhandledNodes = nodes.slice();
  let scores = {
    score1: Number.MAX_VALUE, // shortSideFit
    score2: Number.MAX_VALUE, // longSideFit
  };
  let i = 0;
  let len = nodes.length;

  while (unhandledNodes.length > 0) {
    let bestScore1 = Number.MAX_VALUE;
    let bestScore2 = Number.MAX_VALUE;
    let bestNodeIdx = -1;
    let bestRect = { x: 0, y: 0, width: 1, height: 1 };

    for (let i = 0; i < unhandledNodes.length; ++i) {
      let newRect = _scoreRect(
        freeRects,
        unhandledNodes[i].width + padding,
        unhandledNodes[i].height + padding,
        allowRotate,
        scores
      );

      if (scores.score1 < bestScore1 || (scores.score1 === bestScore1 && scores.score2 < bestScore2)) {
        bestScore1 = scores.score1;
        bestScore2 = scores.score2;
        bestRect = newRect;
        bestNodeIdx = i;
      }
    }

    if (bestNodeIdx === -1) {
      return new Error('Pack failed.');
    }

    _placeRect(freeRects, bestRect);

    // apply the best node and remove it from unhandled nodes
    let bestNode = unhandledNodes.splice(bestNodeIdx, 1)[0];
    bestNode.x = Math.floor(bestRect.x);
    bestNode.y = Math.floor(bestRect.y);
    bestNode.rotated = (bestNode.width + padding !== bestRect.width);

    if (progress) {
      progress(i, len, bestNode.id);
    }
    ++i;
  }
};

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

module.exports = index;
//# sourceMappingURL=bin-pack.js.map
