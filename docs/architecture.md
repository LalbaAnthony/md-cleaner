# Architecture

## Module graph

```
cli.ts          argv, stdout/stderr, exit code
  |
  +-- index.ts      public entry point, argument parsing
        |
        +-- file.ts     read, clean, write in place
        |     |
        |     +-- clean.ts    the transformation, pure
        |
        +-- errors.ts   typed failures carrying an exit code
        +-- version.ts  version read from package.json
        +-- types/      shared interfaces
```

Nothing above `clean.ts` is imported by it. The dependency direction is one
way, from the shell boundary down to the pure function.

## Design decisions

**`clean.ts` does no I/O.** The whole transformation is `string -> string`,
which is what makes it testable without a filesystem, and reusable by anything
that already holds the source (an editor plugin, a build step, a lint rule).

**Processing is line-based.** A single whole-document regex pass cannot tell a
fenced code block from prose, and a `---` under a paragraph from a horizontal
rule. Walking lines with a fence flag and a one-line lookbehind (`out.at(-1)`)
gives both for free.

**Newlines are normalized up front.** CRLF and lone CR become LF before the
split, and a leading byte order mark is dropped. The output is always LF and
always ends with exactly one newline, so the result does not depend on the
platform that produced the input.

**The regexes are not unicode-mode.** The emoji pattern matches a lone high
surrogate followed by a lone low surrogate, which is only expressible on UTF-16
code units. Adding the `u` flag would make those ranges an error.

**Non-ASCII characters are written as `\uXXXX` escapes.** A file full of
invisible variation selectors and zero-width joiners is unreviewable and
unsafe to edit; the escapes keep the source diffable and the intent explicit.

**Errors carry their own exit code.** `cli.ts` never maps a failure to a
number: it reads `error.exitCode` off `MdCleanerError`. Adding a failure mode
means adding a subclass, not touching the CLI.

**The file is always rewritten.** `cleanFile` reports `changed` for callers
that care, but it does not skip the write, so the on-disk encoding and line
endings are normalized even when the text itself is untouched.
