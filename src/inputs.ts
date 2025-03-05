import * as core from '@actions/core';

import {
  RequestedCompressionMethod,
  valid_requested_compression_methods,
  validateRequestedCompressionMethod,
} from './tar-utils';

export interface Inputs {
  bucket: string;
  path: string;
  key: string;
  restoreKeys: string[];
  compressionMethod: RequestedCompressionMethod;
}

export function getInputs(): Inputs {
  const compressionMethod = validateRequestedCompressionMethod(
    core.getInput('compression-method', {
      required: true,
    }),
  );

  if (!compressionMethod) {
    core.setFailed(
      `Invalid compression method: ${core.getInput('compression-method')}, expected one of: ${valid_requested_compression_methods.join(', ')}`,
    );
    process.exit(1);
  }

  const inputs = {
    bucket: core.getInput('bucket', { required: true }),
    path: core.getInput('path', { required: true }),
    key: core.getInput('key', { required: true }),
    restoreKeys: core
      .getInput('restore-keys')
      .split(',')
      .filter((path) => path),
    compressionMethod,
  };

  core.debug(`Loaded inputs: ${JSON.stringify(inputs)}.`);

  return inputs;
}
