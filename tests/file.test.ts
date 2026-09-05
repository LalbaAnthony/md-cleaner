import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileNotFoundError } from '../src/errors.js';
import { cleanFile } from '../src/file.js';

describe('cleanFile', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'md-cleaner-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  async function fixture(name: string, content: string): Promise<string> {
    const path = join(directory, name);
    await writeFile(path, content, 'utf8');
    return path;
  }

  it('rewrites the file in place', async () => {
    const path = await fixture('doc.md', '# Title \uD83D\uDE80\r\n\r\n\r\nBody \u2014 end\r\n');
    const result = await cleanFile(path);

    expect(await readFile(path, 'utf8')).toBe('# Title\n\nBody, end\n');
    expect(result.path).toBe(path);
    expect(result.changed).toBe(true);
    expect(result.unexpectedExtension).toBeNull();
  });

  it('writes UTF-8 without a byte order mark', async () => {
    const path = await fixture('doc.md', '\uFEFF# Title\n');
    await cleanFile(path);

    const bytes = await readFile(path);

    expect(bytes[0]).not.toBe(0xef);
    expect(bytes.toString('utf8')).toBe('# Title\n');
  });

  it('reports an unchanged file', async () => {
    const path = await fixture('doc.markdown', '# Title\n');
    const result = await cleanFile(path);

    expect(result.changed).toBe(false);
    expect(result.unexpectedExtension).toBeNull();
  });

  it('reports an unexpected extension but still cleans the file', async () => {
    const path = await fixture('doc.txt', '# Title \uD83D\uDE80\n');
    const result = await cleanFile(path);

    expect(result.unexpectedExtension).toBe('.txt');
    expect(await readFile(path, 'utf8')).toBe('# Title\n');
  });

  it('throws FileNotFoundError for a missing file', async () => {
    await expect(cleanFile(join(directory, 'missing.md'))).rejects.toBeInstanceOf(
      FileNotFoundError,
    );
  });
});
