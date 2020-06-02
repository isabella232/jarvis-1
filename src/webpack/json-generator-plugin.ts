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
