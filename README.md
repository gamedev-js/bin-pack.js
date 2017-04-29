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

## Reference

  - [RectangleBinPack](https://github.com/juj/RectangleBinPack)
    - [RectangleBinPack.pdf](http://clb.demon.fi/files/RectangleBinPack.pdf)
    - [rectangle-bin-packing](http://clb.demon.fi/projects/rectangle-bin-packing)
    - [more-rectangle-bin-packing](http://clb.demon.fi/projects/more-rectangle-bin-packing)
    - [even-more-rectangle-bin-packing](http://clb.demon.fi/projects/even-more-rectangle-bin-packing)
  - [bin-packing](https://github.com/jakesgordon/bin-packing)
  - [bin-pack](https://github.com/armollica/bin-pack)

## License

MIT © 2017 Johnny Wu