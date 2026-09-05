export interface CleanFileResult {
  /** Absolute path of the file that was rewritten. */
  readonly path: string;
  /** False when the cleaned content was byte-identical to the original. */
  readonly changed: boolean;
  /**
   * The file extension when it is neither `.md` nor `.markdown`, otherwise
   * null. The file is cleaned either way; callers may warn.
   */
  readonly unexpectedExtension: string | null;
}
