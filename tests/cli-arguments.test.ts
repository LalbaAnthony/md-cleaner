import { describe, expect, it } from 'vitest';
import { UsageError } from '../src/errors.js';
import { parseCliArguments } from '../src/index.js';

describe('parseCliArguments', () => {
  it('reads the file positional', () => {
    expect(parseCliArguments(['README.md'])).toEqual({
      help: false,
      version: false,
      path: 'README.md',
    });
  });

  it('accepts the help and version flags without a file', () => {
    expect(parseCliArguments(['--help']).help).toBe(true);
    expect(parseCliArguments(['-h']).help).toBe(true);
    expect(parseCliArguments(['--version']).version).toBe(true);
    expect(parseCliArguments(['-v']).version).toBe(true);
  });

  it('rejects a missing file', () => {
    expect(() => parseCliArguments([])).toThrow(UsageError);
    expect(() => parseCliArguments([''])).toThrow(UsageError);
  });

  it('rejects more than one file', () => {
    expect(() => parseCliArguments(['a.md', 'b.md'])).toThrow(UsageError);
  });

  it('rejects an unknown flag', () => {
    expect(() => parseCliArguments(['--nope', 'a.md'])).toThrow(UsageError);
  });

  it('exits with code 2 on a usage error', () => {
    try {
      parseCliArguments([]);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(UsageError);
      expect((error as UsageError).exitCode).toBe(2);
    }
  });
});
