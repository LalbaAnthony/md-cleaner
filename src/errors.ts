const usageExitCode = 2;
const failureExitCode = 1;

export class MdCleanerError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'MdCleanerError';
    this.exitCode = exitCode;
  }
}

/** Bad or missing command-line arguments. The CLI prints the usage block. */
export class UsageError extends MdCleanerError {
  constructor(message: string) {
    super(message, usageExitCode);
    this.name = 'UsageError';
  }
}

export class FileNotFoundError extends MdCleanerError {
  readonly path: string;

  constructor(path: string, options?: ErrorOptions) {
    super(`file not found: ${path}`, failureExitCode, options);
    this.name = 'FileNotFoundError';
    this.path = path;
  }
}

/** The file exists but could not be read or rewritten. */
export class FileAccessError extends MdCleanerError {
  readonly path: string;

  constructor(message: string, path: string, options?: ErrorOptions) {
    super(message, failureExitCode, options);
    this.name = 'FileAccessError';
    this.path = path;
  }
}
