import utils from './utils';

export default class SimplePacker {
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