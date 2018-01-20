'use strict';

const fsJetpack = require('fs-jetpack');
const buble = require('rollup-plugin-buble');
const pjson = require('../package.json');

let banner = `
/*
 * ${pjson.name} v${pjson.version}
 * (c) ${new Date().getFullYear()} @Johnny Wu
 * Released under the MIT License.
 */
`;

let dest = './dist';
let file = 'bin-pack';
let name = 'binpack';
let sourcemap = true;
let globals = {};

// clear directory
fsJetpack.dir(dest, { empty: true });

module.exports = {
  input: './index.js',
  external: [],
  plugins: [
    buble()
  ],
  output: [
    {
      file: `${dest}/${file}.dev.js`,
      format: 'iife',
      name,
      banner,
      globals,
      sourcemap,
    },
    {
      file: `${dest}/${file}.js`,
      format: 'cjs',
      name,
      banner,
      globals,
      sourcemap,
    },
  ],
};