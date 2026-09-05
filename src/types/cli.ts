export interface CliArguments {
  readonly help: boolean;
  readonly version: boolean;
  /** Path to the Markdown file to clean. Empty when `help` or `version` is set. */
  readonly path: string;
}
