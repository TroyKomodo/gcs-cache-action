import * as core from '@actions/core';

import { RequestedCompressionMethod } from './tar-utils';

export type CacheHitKindState = 'exact' | 'partial' | 'none';

export interface State {
  path: string;
  bucket: string;
  cacheHitKind: CacheHitKindState;
  targetFileName: string;
  compressionMethod: RequestedCompressionMethod;
}

export function saveState(state: State): void {
  core.debug(`Saving state: ${JSON.stringify(state)}.`);

  core.saveState('bucket', state.bucket);
  core.saveState('path', state.path);
  core.saveState('cache-hit-kind', state.cacheHitKind);
  core.saveState('target-file-name', state.targetFileName);
  core.saveState('compression-method', state.compressionMethod);
}

export function getState(): State {
  const state = {
    path: core.getState('path'),
    bucket: core.getState('bucket'),
    cacheHitKind: core.getState('cache-hit-kind') as CacheHitKindState,
    targetFileName: core.getState('target-file-name'),
    compressionMethod: core.getState(
      'compression-method',
    ) as RequestedCompressionMethod,
  };

  core.debug(`Loaded state: ${JSON.stringify(state)}.`);

  return state;
}
