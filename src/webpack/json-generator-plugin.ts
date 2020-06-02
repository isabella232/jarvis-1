import * as fs from 'fs';
import * as path from 'path';

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

  apply(compiler: Compiler) {
    const { content, filename } = this.options;

    compiler.hooks.done.tapPromise('JSONGeneratorPlugin', _stats => {
      return fs.promises.writeFile(path.resolve(compiler.outputPath, filename), JSON.stringify(content, null, 2));
    });
  }
}
