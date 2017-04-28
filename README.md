## bin-pack.js

2d rectangular bin packing in javascript.

## Install

```bash
npm install bin-pack.js
```

## Usage

```javascript
  const binpack = require('bin-pack');

  binpack.sort(nodes, 'height', 'descending', true);
  binpack.pack(nodes, algorithmEL.value, 512, 512, 2, true, (i, total, id) => {
    console.log(i, total, id);
  });
```

## Documentation

### sort (nodes, sortBy, order, allowRotate)

### pack (nodes, algorithm, width, height, padding, allowRotate, progress)

### packAutoResize (nodes, algorithm, width, height, padding, allowRotate, progress)

## License

MIT © 2017 Johnny Wu