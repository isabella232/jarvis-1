/*
 * Copyright 2020 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as fs from 'fs';
import * as path from 'path';

import mkdirp from 'mkdirp';
import type { Compiler } from 'webpack';

export interface JSONGeneratorPluginOptions {
  content: string;
  filename: string;
}

export default class JSONGeneratorPlugin {
  private options: JSONGeneratorPluginOptions;

  constructor(options: JSONGeneratorPluginOptions) {
    this.options = options;
  }

  apply(compiler: Compiler): void {
    const { content, filename } = this.options;

    compiler.hooks.done.tapPromise('JSONGeneratorPlugin', async _stats => {
      const output = path.resolve(compiler.outputPath, filename);

      await mkdirp(path.dirname(output));

      return fs.promises.writeFile(path.resolve(compiler.outputPath, filename), JSON.stringify(content, null, 2));
    });
  }
}
