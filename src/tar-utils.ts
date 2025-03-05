import * as exec from '@actions/exec';
import * as semver from 'semver';

const ZSTD_WITHOUT_LONG_VERSION = '1.3.2';

export const valid_requested_compression_methods = [
  'gzip',
  'zstd',
  'auto',
  'none',
] as const;
export const valid_file_compression_methods = [
  'gzip',
  'zstd',
  'zstd (without long)',
  'none',
] as const;

export type FileCompressionMethod =
  (typeof valid_file_compression_methods)[number];
export type RequestedCompressionMethod =
  (typeof valid_requested_compression_methods)[number];

export function validateRequestedCompressionMethod(
  compressionMethod: string,
): RequestedCompressionMethod | null {
  if (
    !valid_requested_compression_methods.includes(
      compressionMethod as RequestedCompressionMethod,
    )
  ) {
    return null;
  }

  return compressionMethod as RequestedCompressionMethod;
}

export function validateFileCompressionMethod(
  compressionMethod: string,
): FileCompressionMethod | null {
  if (
    !valid_file_compression_methods.includes(
      compressionMethod as FileCompressionMethod,
    )
  ) {
    return null;
  }

  return compressionMethod as FileCompressionMethod;
}

async function getTarCompressionMethod(
  specifiedCompressionMethod: RequestedCompressionMethod,
): Promise<FileCompressionMethod> {
  if (specifiedCompressionMethod === 'gzip') {
    return 'gzip';
  } else if (specifiedCompressionMethod === 'none') {
    return 'none';
  }

  const [zstdOutput, zstdVersion] = await exec
    .getExecOutput('zstd', ['--version'], {
      ignoreReturnCode: true,
      silent: true,
    })
    .then((out) => out.stdout.trim())
    .then((out) => {
      const extractedVersion = /v(\d+(?:\.\d+)*)/.exec(out);
      return [out, extractedVersion ? extractedVersion[1] : null];
    })
    .catch(() => ['', null]);

  if (!zstdOutput?.toLowerCase().includes('zstd command line interface')) {
    if (specifiedCompressionMethod === 'auto') {
      return 'gzip';
    } else {
      throw new Error('zstd is not installed');
    }
  } else if (
    !zstdVersion ||
    semver.lt(zstdVersion, ZSTD_WITHOUT_LONG_VERSION)
  ) {
    return 'zstd (without long)';
  } else {
    return 'zstd';
  }
}

export async function createTar(
  requestedCompressionMethod: RequestedCompressionMethod,
  archivePath: string,
  paths: string[],
  cwd: string,
): Promise<FileCompressionMethod> {
  const compressionMethod = await getTarCompressionMethod(
    requestedCompressionMethod,
  );
  console.log(`🔹 Using '${compressionMethod}' compression method.`);

  const args = ['-c'];

  if (compressionMethod === 'gzip') {
    args.push('-z');
  } else if (compressionMethod === 'zstd (without long)') {
    args.push('--use-compress-program', 'zstd -T0');
  } else if (compressionMethod === 'zstd') {
    args.push('--use-compress-program', 'zstd -T0 --long=30');
  }

  args.push('--posix', '-P', '-f', archivePath, '-C', cwd, ...paths);

  await exec.exec('tar', args);

  return compressionMethod;
}

export async function extractTar(
  archivePath: string,
  compressionMethod: FileCompressionMethod,
  cwd: string,
): Promise<void> {
  console.log(
    `🔹 Detected '${compressionMethod}' compression method from object metadata.`,
  );

  const args = ['-x'];

  if (compressionMethod === 'gzip') {
    args.push('-z');
  } else if (compressionMethod === 'zstd (without long)') {
    args.push('--use-compress-program', 'zstd -d');
  } else if (compressionMethod === 'zstd') {
    args.push('--use-compress-program', 'zstd -d --long=30');
  }

  args.push('-P', '-f', archivePath, '-C', cwd);

  await exec.exec('tar', args);
}
