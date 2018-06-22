/*
 * (C) Copyright HCL Technologies Ltd. 2018
 * (C) Copyright IBM Corp. 2012, 2017 All Rights Reserved.
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
const {tap} = require("webpack-plugin-compat").for("webpack-preamble-plugin");

module.exports = class PreamblePlugin {
	constructor(options) {
		this.options = options;
	}
	apply(compiler) {
		const contents = [];

		tap(compiler, "make", (compilation__, callback) => {
			this.getResolver(compiler, resolver => {
				async.eachOf(this.options && this.options.files || [], (elem, i, cb) => {
					const resolverCb = (err, file) => {
						if (err) {
							return cb(err);
						}
						fs.readFile(file, 'utf8', (error, data) => {
							if (!error) {
								contents[i] = {data: data, source: file};
							}
							cb(error);
						});
					};
					if (compiler.resolverFactory) {
						resolver.resolve({}, compiler.context, elem, {}, resolverCb);
					} else {
						resolver.resolve({}, compiler.context, elem, resolverCb);
					}
				}, (err) => {
					callback(err);
				});
			});
		});

		tap(compiler, "compilation", (compilation) => {
			tap(compilation.mainTemplate, "render", (src) => {
				const source = new ConcatSource();
				contents.forEach((entry) => {
					source.add(new OriginalSource(entry.data, entry.source));
					source.add('\n');
				});
				source.add(src);
				return source;
			});

			tap(compilation.mainTemplate, "hash", (hash) => {
				hash.update("PreamblePlugin ");
				hash.update("4");   // Increment this whenever the render code above changes
				contents.forEach((entry) => {
					hash.update(entry.source);
				});
			});
		});
	}

	getResolver(compiler, callback) {
		if (compiler.resolverFactory) {
			// Webpack V4
			tap(compiler.resolverFactory, "resolver normal", callback);
		} else {
			// Webpack V3
			callback(compiler.resolvers.normal);
		}
	}
};
