import utils from './utils';

export default class TreePacker {
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