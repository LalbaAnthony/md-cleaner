/**
 * Line-based Markdown cleaner: strips emojis, normalizes AI-style typography,
 * drops standalone horizontal rules and collapses runs of blank lines.
 *
 * Processing is line-based so fenced code blocks can be passed through
 * untouched. Every non-ASCII character is written as a \uXXXX escape so the
 * source stays readable and diffable.
 */

const byteOrderMark = '\uFEFF';

/** A line that opens a fenced code block. A trailing info string is allowed. */
const fenceOpenPattern = /^\s*(?:```|~~~)/;

/** A line that closes a fenced code block: the fence and nothing else. */
const fenceClosePattern = /^\s*(?:```|~~~)\s*$/;

/**
 * Headings, table rows and bold-led lines. An em-dash reads wrong as a comma
 * in a title or a cell, so those get a hyphen instead.
 */
const headingOrCellPattern = /^\s*(?:#{1,6}\s|\||\*\*)/;

/** " em-dash " -- surrounded by spaces, which is the AI-style usage. */
const emDashPattern = / \u2014 /g;

/**
 * Astral-plane characters (surrogate pairs) plus the BMP symbol and dingbat
 * blocks, the variation selector, the ZWJ and the keycap combiner - plus one
 * space on the right, so a leading emoji does not leave a leading space.
 *
 * Deliberately not a unicode-mode regex: the lone-surrogate ranges are what
 * make the astral branch match on UTF-16 code units.
 */
const emojiPattern =
  // eslint-disable-next-line no-misleading-character-class -- the class matches individual code units on purpose
  /(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2300-\u23FF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D\u20E3])+ ?/g;

/**
 * Applied in order, before the emoji strip: arrows and math symbols sit next
 * to the symbol blocks the emoji pattern removes.
 */
const typographyReplacements: readonly (readonly [RegExp, string])[] = [
  [/\u0152/g, 'Oe'], // OE ligature
  [/\u0153/g, 'oe'], // oe ligature
  [/\u2026/g, '...'], // ellipsis
  [/\u2248/g, '~='], // almost equal
  [/\u2265/g, '>='], // greater-or-equal
  [/\u2264/g, '<='], // less-or-equal
  [/\u2190/g, '<-'], // left arrow
  [/\u2192/g, '->'], // right arrow
  [/\u21D0/g, '<='], // double left arrow
  [/\u21D2/g, '=>'], // double right arrow
  [/[\u21D4\u2194]/g, '<=>'], // double / double-headed arrow
  [/[\u2018\u2019]/g, "'"], // curly single quotes
  [/\u00AB[ \t]*/g, '"'], // opening guillemet + inner space
  [/[ \t]*\u00BB/g, '"'], // closing guillemet + inner space
  [/[\u201C\u201D]/g, '"'], // curly double quotes
];

function normalizeNewlines(content: string): string {
  const withoutBom = content.startsWith(byteOrderMark)
    ? content.slice(byteOrderMark.length)
    : content;

  return withoutBom.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Cleans Markdown source. The result always uses LF newlines, carries no
 * leading blank line and ends with exactly one trailing newline.
 */
export function cleanMarkdown(content: string): string {
  const out: string[] = [];
  let inFence = false;

  for (const rawLine of normalizeNewlines(content).split('\n')) {
    // Fenced code blocks: keep the content byte-for-byte
    if (inFence) {
      out.push(rawLine);
      if (fenceClosePattern.test(rawLine)) {
        inFence = false;
      }
      continue;
    }

    if (fenceOpenPattern.test(rawLine)) {
      inFence = true;
      out.push(rawLine.trimEnd());
      continue;
    }

    let line = rawLine;

    for (const [pattern, replacement] of typographyReplacements) {
      line = line.replace(pattern, replacement);
    }

    // Tested after the typography pass, exactly like the shell original
    line = line.replace(
      emDashPattern,
      headingOrCellPattern.test(line) ? ' - ' : ', ',
    );

    line = line.replace(emojiPattern, '');

    // Trailing whitespace only: leading indent is significant in Markdown
    // (nested lists, indented code blocks)
    line = line.trimEnd();

    const previous = out.at(-1);

    // Remove only actual horizontal rules: a '---' preceded by a blank line.
    // A '---' directly under text is a setext heading or a table separator,
    // and one on the very first line opens YAML frontmatter - keep those.
    if (line === '---' && previous === '') {
      continue;
    }

    // Collapse runs of blank lines into a single blank line
    if (line === '' && previous === '') {
      continue;
    }

    out.push(line);
  }

  return `${out.join('\n').replace(/^\n+/, '').trimEnd()}\n`;
}
