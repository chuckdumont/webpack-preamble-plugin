# webpack-preamble-plugin

Inserts the files specified in options at the beginning of the entry chunks, before the webpack bootstrap code.  The files are inserted as is, without any module header/footer.  This is useful if you want to include non-module script files ahead of the weback code.  The added files are processed by the uglifier.

## Install

```bash
npm i -D webpack-preamble-plugin
```
## Usage

```javascript
// webpack.config.js
var PreamblePlugin = require('webpack-preamble-plugin');

module.exports = {
  // ... snip ...
  plugins: [
    new PreamblePlugin({
			files: [
				'scripts/browser_detect.js',
			]
		})
  ],
  // ... snip ...
}
```

## Options

#### files

Array of file names to include.  File names will be resolved by webpack using the normal module resolver.
