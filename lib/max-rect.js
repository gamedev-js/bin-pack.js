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
  if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
    usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
    return false;

  let newNode;
  if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
    // New node at the top side of the used node.
    if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
      newNode = _cloneRect(freeNode);
      newNode.height = usedNode.y - newNode.y;
      freeRects.push(newNode);
    }

    // New node at the bottom side of the used node.
    if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
      newNode = _cloneRect(freeNode);
      newNode.y = usedNode.y + usedNode.height;
      newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
      freeRects.push(newNode);
    }
  }

  if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
    // New node at the left side of the used node.
    if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
      newNode = _cloneRect(freeNode);
      newNode.width = usedNode.x - newNode.x;
      freeRects.push(newNode);
    }

    // New node at the right side of the used node.
    if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
      newNode = _cloneRect(freeNode);
      newNode.x = usedNode.x + usedNode.width;
      newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
      freeRects.push(newNode);
    }
  }

  return true;
}

function _placeRect(freeRects, rect) {
  for (let i = 0; i < freeRects.length; ++i) {
    if (_splitFreeNode(freeRects, freeRects[i], rect)) {
      freeRects.splice(i, 1);
      --i;
    }
  }

  // cleanUpFreeRects
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

export default function(nodes, width, height, padding, allowRotate, progress) {
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
}