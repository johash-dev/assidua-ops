import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFileStorage } from './index';
import { LocalDiskStorage } from './local-disk';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'ao-storage-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('createFileStorage', () => {
  it('returns local disk storage under development and test', () => {
    expect(
      createFileStorage({ APP_ENV: 'development', STORAGE_LOCAL_DIR: dir }),
    ).toBeInstanceOf(LocalDiskStorage);
    expect(
      createFileStorage({ APP_ENV: 'test', STORAGE_LOCAL_DIR: dir }),
    ).toBeInstanceOf(LocalDiskStorage);
  });

  it('cannot build a real provider outside staging and production', () => {
    expect(() =>
      createFileStorage({ APP_ENV: 'development', STORAGE_PROVIDER: 's3' }),
    ).toThrow(/STORAGE_PROVIDER/);
  });

  it('refuses a real provider in production until one is implemented', () => {
    expect(() =>
      createFileStorage({ APP_ENV: 'production', STORAGE_PROVIDER: 's3' }),
    ).toThrow(/not implemented/);
  });
});

describe('LocalDiskStorage', () => {
  it('round-trips bytes, including nested keys', async () => {
    const storage = new LocalDiskStorage(dir);
    await storage.put('jobs/1/photo.jpg', Buffer.from([1, 2, 3]));
    expect([...(await storage.get('jobs/1/photo.jpg'))]).toEqual([1, 2, 3]);
  });

  it.each(['../escape', 'a/../../escape', '/etc/passwd', 'a\\..\\b', ''])(
    'rejects the key %j',
    async (key) => {
      const storage = new LocalDiskStorage(dir);
      await expect(storage.put(key, Buffer.from('x'))).rejects.toThrow(
        /invalid storage key/,
      );
      await expect(storage.get(key)).rejects.toThrow(/invalid storage key/);
    },
  );
});
