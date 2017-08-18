/*
 * (C) Copyright IBM Corp. 2012, 2016 All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 /*
 * Inserts the files specified in options at the beginning of the entry chunks, before the
 * webpack bootstrap code.  The files are inserted as is, without any module header/footer.
 * This is useful if you want to include non-module script files ahead of the weback
 * code.  The added files are processed by the uglifier.
 *
 * options.files - array
 *             Array of files to include in the preamble.  File names will be resolved
 *             by webpack using the normal module resolver.
 */

/*
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ATTENTION!!! If you make changes to this file that affect the generated code,
 * be sure to update the hash generation function at the end of the file.
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

const fs = require('fs');
const async = require('async');
const ConcatSource = require("webpack-sources").ConcatSource;
const OriginalSource = require("webpack-sources").OriginalSource;

module.exports = class PreamblePlugin {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    const contents = [];

    compiler.plugin("make", (compilation__, callback) => {
      async.eachOf(this.options && this.options.files || [], (elem, i, cb) => {
        compiler.resolvers.normal.resolve({}, compiler.context, elem, (err, file) => {
          if (err) {
            return cb(err);
          }
          fs.readFile(file, 'utf8', (error, data) => {
            if (!error) {
              contents[i] = {data: data, source: file};
            }
            cb(error);
          });
        });
      }, (err) => {
        callback(err);
      });
    });

    compiler.plugin("compilation", (compilation) => {
      compilation.mainTemplate.plugin("render", (src) => {
        const source = new ConcatSource();
        contents.forEach((entry) => {
          source.add(new OriginalSource(entry.data, entry.source));
        });
        source.add(src);
        return source;
      });

      compilation.mainTemplate.plugin("hash", (hash) => {
        hash.update("PreamblePlugin ");
        hash.update("3");   // Increment this whenever the render code above changes
        contents.forEach((entry) => {
          hash.update(entry.source);
        });
      });
    });
  }
};
