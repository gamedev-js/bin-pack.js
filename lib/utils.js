export default {
  rotatedWidth (node) {
    return node.rotated ? node.height : node.width;
  },

  rotatedHeight (node) {
    return node.rotated ? node.width : node.height;
  },
};