import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import type { FileStorage } from './port';

/** Zero-cost storage for development and tests: files under a local directory. */
export class LocalDiskStorage implements FileStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private pathFor(key: string): string {
    const segments = key.split('/');
    if (
      key === '' ||
      key.includes('\\') ||
      key.includes('\0') ||
      segments.some((s) => s === '' || s === '.' || s === '..')
    ) {
      throw new Error(`invalid storage key: ${JSON.stringify(key)}`);
    }
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) {
      throw new Error(`invalid storage key: ${JSON.stringify(key)}`);
    }
    return path;
  }

  async put(key: string, data: Uint8Array): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async get(key: string): Promise<Uint8Array> {
    return readFile(this.pathFor(key));
  }
}
