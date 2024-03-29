/*
 * Copyright 2020 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as path from 'path';
import * as fs from 'fs';

import globby from 'globby';

export interface Options {
  ext: string[];
  path: string;
}

export default async function (options: Options): Promise<void> {
  // const workingDir = path.resolve(process.cwd(), options.path);
  const globs = options.ext.map(ext => path.normalize(`${options.path}/**/*${ext}.d.ts`));

  console.log(`Looking for ${options.ext.join(', ')} files`);
  const files = await globby(globs);
  let deletedCount = 0;

  console.log(`Found ${files.length} declaration files`);

  files.forEach(file => {
    // for every '.css' there will be a coresponding '.css.d.ts' file and vice versa
    const cssFile = file.replace(/\.d\.ts$/, '');

    if (!fs.existsSync(cssFile)) {
      console.log(`Deleting "${file}" because corresponding "${cssFile}" does not exist`);
      fs.unlinkSync(file);
      deletedCount++;
    }
  });

  console.log(`Deleted total of ${deletedCount} declaration files`);
}
