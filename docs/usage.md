# Usage

```sh
npx @lalba-anthony/md-cleaner <file>
```

The file is rewritten in place as UTF-8 without a byte order mark, with LF
newlines. There is no dry-run and no backup: run it on a file that is under
version control.

## Flags

| Flag              | Effect                                |
| ----------------- | ------------------------------------- |
| `-h`, `--help`    | Print the usage block and exit.       |
| `-v`, `--version` | Print the package version and exit.   |

Exactly one positional argument is accepted. A path starting with `-` must be
placed after `--`.

## Exit codes

| Code | Meaning                                                                 |
| ---- | ----------------------------------------------------------------------- |
| `0`  | The file was cleaned.                                                   |
| `1`  | The file does not exist, or it could not be read or written.            |
| `2`  | Bad arguments: no file, more than one file, or an unknown flag.         |

An extension other than `.md` or `.markdown` is a warning on stderr, not an
error: the file is cleaned anyway.

## Environment variables

| Variable | Effect                                                    |
| -------- | --------------------------------------------------------- |
| `DEBUG`  | Set to `1` to print the stack trace of a failure on stderr. |

## What it changes

Everything below is applied line by line. Fenced code blocks (``` and `~~~`)
are passed through byte for byte, so only the opening fence line is touched.

**Typography**

| Character                       | Becomes     |
| ------------------------------- | ----------- |
| U+0152 / U+0153 OE ligature     | `Oe` / `oe` |
| U+2026 ellipsis                 | `...`       |
| U+2248 almost equal             | `~=`        |
| U+2265 / U+2264 greater/less-eq | `>=` / `<=` |
| U+2190 / U+2192 left/right arrow| `<-` / `->` |
| U+21D0 / U+21D2 double arrow    | `<=` / `=>` |
| U+21D4 / U+2194 two-headed arrow| `<=>`       |
| U+2018 / U+2019 curly quote     | `'`         |
| U+201C / U+201D curly quote     | `"`         |
| U+00AB / U+00BB guillemet       | `"`, inner space swallowed |

**Em-dash** surrounded by spaces becomes ` - ` on a heading, a table row or a
bold-led line, and `, ` anywhere else. A comma reads wrong in a title or a
cell.

**Emojis** are removed together with one following space: astral-plane
characters plus the BMP symbol and dingbat blocks, the variation selector, the
zero-width joiner and the keycap combiner.

**Whitespace and rules**

- Trailing whitespace is trimmed; leading indentation is kept, because it is
  significant for nested lists and indented code blocks.
- A `---` preceded by a blank line is a horizontal rule and is removed. A `---`
  directly under text is a setext heading or a table separator, and one on the
  very first line opens YAML frontmatter: both are kept.
- Runs of blank lines collapse to one. Leading blank lines are dropped and the
  file ends with exactly one newline.

## Library API

```ts
import { cleanMarkdown, cleanFile } from '@lalba-anthony/md-cleaner';

// Pure: string in, string out. No I/O.
const cleaned = cleanMarkdown(source);

// Reads, cleans and rewrites the file in place.
const result = await cleanFile('./README.md');
// -> { path: string, changed: boolean, unexpectedExtension: string | null }
```

Failures are thrown as `MdCleanerError` subclasses, each carrying an
`exitCode`: `UsageError` (2), `FileNotFoundError` (1), `FileAccessError` (1).

`parseCliArguments(argv)` and `packageVersion` are exported as well, so the CLI
can be driven from another entry point.
