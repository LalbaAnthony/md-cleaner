import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { cleanMarkdown } from './clean.js';
import { FileAccessError, FileNotFoundError } from './errors.js';
import type { CleanFileResult } from './types/clean.js';

export const markdownExtensions: readonly string[] = ['.md', '.markdown'];

function errorCode(value: unknown): string | undefined {
  if (value instanceof Error && 'code' in value) {
    const { code } = value as { code?: unknown };
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function describe(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}

/**
 * Reads a Markdown file, cleans it and writes it back in place as UTF-8
 * without a byte order mark.
 *
 * The extension is not enforced: a non-Markdown extension is reported through
 * `unexpectedExtension` and the file is cleaned anyway.
 */
export async function cleanFile(inputPath: string): Promise<CleanFileResult> {
  const path = resolve(inputPath);
  const extension = extname(path);

  let original: string;
  try {
    original = await readFile(path, 'utf8');
  } catch (cause) {
    if (errorCode(cause) === 'ENOENT') {
      throw new FileNotFoundError(inputPath, { cause });
    }
    throw new FileAccessError(
      `cannot read ${path}: ${describe(cause)}`,
      path,
      { cause },
    );
  }

  const cleaned = cleanMarkdown(original);

  try {
    await writeFile(path, cleaned, 'utf8');
  } catch (cause) {
    throw new FileAccessError(
      `cannot write ${path}: ${describe(cause)}`,
      path,
      { cause },
    );
  }

  return {
    path,
    changed: cleaned !== original,
    unexpectedExtension: markdownExtensions.includes(extension.toLowerCase())
      ? null
      : extension,
  };
}
