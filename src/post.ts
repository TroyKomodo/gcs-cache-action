import * as core from '@actions/core';
import * as glob from '@actions/glob';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import { withFile as withTemporaryFile } from 'tmp-promise';

import { getState } from './state';
import { createTar } from './tar-utils';

async function main() {
  const state = getState();

  if (state.cacheHitKind === 'exact') {
    console.log(
      '🌀 Skipping uploading cache as the cache was hit by exact match.',
    );
    return;
  }

  const bucket = new Storage().bucket(state.bucket);
  const targetFileName = state.targetFileName;
  const [targetFileExists] = await bucket
    .file(targetFileName)
    .exists()
    .catch((err) => {
      core.error('Failed to check if the file already exists');
      throw err;
    });

  core.debug(`Target file name: ${targetFileName}.`);

  if (targetFileExists) {
    console.log(
      '🌀 Skipping uploading cache as it already exists (probably due to another job).',
    );
    return;
  }

  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const globber = await glob.create(state.path, {
    implicitDescendants: false,
  });

  const paths = await globber
    .glob()
    .then((files) => files.map((file) => path.relative(workspace, file)));

  core.debug(`Paths: ${JSON.stringify(paths)}.`);

  return withTemporaryFile(async (tmpFile) => {
    const compressionMethod = await core
      .group('🗜️ Creating cache archive', () =>
        createTar(state.compressionMethod, tmpFile.path, paths, workspace),
      )
      .catch((err) => {
        core.error('Failed to create the archive');
        throw err;
      });

    const metadata = {
      'Cache-Action-Compression-Method': compressionMethod,
    };

    core.debug(`Metadata: ${JSON.stringify(metadata)}.`);

    await core
      .group('🌐 Uploading cache archive to bucket', async () => {
        console.log(`🔹 Uploading file '${targetFileName}'...`);

        await bucket.upload(tmpFile.path, {
          destination: targetFileName,
          metadata,
        });
      })
      .catch((err) => {
        core.error('Failed to upload the file');
        throw err;
      });

    console.log('✅ Successfully saved cache.');
  });
}

void main().catch((err: Error) => {
  core.error(err);
  core.setFailed(err);
});
