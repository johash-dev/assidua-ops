import { parseEnv } from '../config/env';
import { LocalDiskStorage } from './local-disk';
import type { FileStorage } from './port';

export type { FileStorage } from './port';

export function createFileStorage(
  source: Record<string, string | undefined> = process.env,
): FileStorage {
  const env = parseEnv(source);
  if (env.STORAGE_PROVIDER === 'local')
    return new LocalDiskStorage(env.STORAGE_LOCAL_DIR);
  throw new Error(
    `Storage provider '${env.STORAGE_PROVIDER}' is not implemented yet`,
  );
}
