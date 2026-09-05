import { parseArgs } from 'node:util';
import { UsageError } from './errors.js';
import type { CliArguments } from './types/cli.js';

export { cleanMarkdown } from './clean.js';
export { cleanFile, markdownExtensions } from './file.js';
export {
  FileAccessError,
  FileNotFoundError,
  MdCleanerError,
  UsageError,
} from './errors.js';
export { packageVersion } from './version.js';
export type * from './types/index.js';

const cliOptions = {
  help: { type: 'boolean', short: 'h', default: false },
  version: { type: 'boolean', short: 'v', default: false },
} as const;

export function parseCliArguments(argv: readonly string[]): CliArguments {
  let values: Record<string, boolean | undefined>;
  let positionals: readonly string[];

  try {
    const parsed = parseArgs({
      args: [...argv],
      options: cliOptions,
      allowPositionals: true,
      strict: true,
    });
    values = parsed.values;
    positionals = parsed.positionals;
  } catch (cause) {
    throw new UsageError(
      cause instanceof Error ? cause.message : 'invalid arguments',
    );
  }

  const help = values.help === true;
  const version = values.version === true;

  // --help and --version short-circuit in the CLI, so the path is irrelevant
  if (help || version) {
    return { help, version, path: '' };
  }

  if (positionals.length > 1) {
    throw new UsageError('expected exactly one file argument');
  }

  const path = positionals[0] ?? '';

  if (path.length === 0) {
    throw new UsageError('missing file argument');
  }

  return { help, version, path };
}

