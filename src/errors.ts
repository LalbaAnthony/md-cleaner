export class MdCleanerError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number) {
    super(message);
    this.name = 'MdCleanerError';
    this.exitCode = exitCode;
  }
}

export class UsageError extends MdCleanerError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'UsageError';
  }
}
