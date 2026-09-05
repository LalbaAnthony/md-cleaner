import { describe, expect, it } from 'vitest';
import { cleanMarkdown } from '../src/clean.js';

describe('cleanMarkdown', () => {
  it('normalizes typography', () => {
    expect(cleanMarkdown('Le c\u0153ur, l\u2019\u0152uvre\u2026 a \u2248 b, x \u2265 y, z \u2264 w')).toBe(
      "Le coeur, l'Oeuvre... a ~= b, x >= y, z <= w\n",
    );
  });

  it('normalizes arrows', () => {
    expect(cleanMarkdown('a \u2192 b \u2190 c \u21D2 d \u21D0 e \u21D4 f \u2194 g')).toBe(
      'a -> b <- c => d <= e <=> f <=> g\n',
    );
  });

  it('normalizes quotes and swallows the inner guillemet spaces', () => {
    expect(cleanMarkdown('Il dit \u00AB bonjour \u00BB et \u201Csalut\u201D et \u2018hi\u2019')).toBe(
      'Il dit "bonjour" et "salut" et \'hi\'\n',
    );
  });

  it('turns an em-dash into a comma in prose', () => {
    expect(cleanMarkdown('This is fine \u2014 really fine')).toBe(
      'This is fine, really fine\n',
    );
  });

  it('turns an em-dash into a hyphen in headings, tables and bold lines', () => {
    expect(cleanMarkdown('## Title \u2014 subtitle')).toBe('## Title - subtitle\n');
    expect(cleanMarkdown('| a \u2014 b | c |')).toBe('| a - b | c |\n');
    expect(cleanMarkdown('**Bold** \u2014 rest')).toBe('**Bold** - rest\n');
  });

  it('strips emojis together with one trailing space', () => {
    expect(cleanMarkdown('\uD83D\uDE80 Ship it \u2705')).toBe('Ship it\n');
    expect(cleanMarkdown('- \u26A0\uFE0F careful')).toBe('- careful\n');
  });

  it('strips ZWJ emoji sequences as a whole', () => {
    expect(cleanMarkdown('\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 family')).toBe('family\n');
  });

  it('leaves fenced code blocks byte-for-byte', () => {
    const source = [
      'Text \u2014 here',
      '',
      '```js',
      'const a = "x \u2014 y"; // \uD83D\uDE80   ',
      'const b = \u00ABq\u00BB;',
      '```',
      '',
      'After \u2014 here',
      '',
    ].join('\n');

    expect(cleanMarkdown(source)).toBe(
      [
        'Text, here',
        '',
        '```js',
        'const a = "x \u2014 y"; // \uD83D\uDE80   ',
        'const b = \u00ABq\u00BB;',
        '```',
        '',
        'After, here',
        '',
      ].join('\n'),
    );
  });

  it('trims the opening fence line but not the closing one', () => {
    const source = ['```js   ', 'code', '```   ', '', 'tail', ''].join('\n');

    expect(cleanMarkdown(source)).toBe(
      ['```js', 'code', '```   ', '', 'tail', ''].join('\n'),
    );
  });

  it('supports tilde fences', () => {
    expect(cleanMarkdown('~~~\n\uD83D\uDE80 kept\n~~~\n')).toBe('~~~\n\uD83D\uDE80 kept\n~~~\n');
  });

  it('removes a horizontal rule preceded by a blank line', () => {
    expect(cleanMarkdown('a\n\n---\n\nb\n')).toBe('a\n\nb\n');
  });

  it('keeps a setext heading underline and a table separator', () => {
    expect(cleanMarkdown('Title\n---\n\nbody\n')).toBe('Title\n---\n\nbody\n');
  });

  it('keeps frontmatter delimiters on the first line', () => {
    expect(cleanMarkdown('---\ntitle: x\n---\n\nbody\n')).toBe(
      '---\ntitle: x\n---\n\nbody\n',
    );
  });

  it('collapses runs of blank lines', () => {
    expect(cleanMarkdown('a\n\n\n\nb\n')).toBe('a\n\nb\n');
  });

  it('drops leading blank lines and forces a single trailing newline', () => {
    expect(cleanMarkdown('\n\n\na\n\n\n\n')).toBe('a\n');
  });

  it('trims trailing whitespace but preserves indentation', () => {
    expect(cleanMarkdown('- a\n    - b   \n')).toBe('- a\n    - b\n');
  });

  it('normalizes CRLF and lone CR newlines', () => {
    expect(cleanMarkdown('a\r\nb\rc\n')).toBe('a\nb\nc\n');
  });

  it('strips a leading byte order mark', () => {
    expect(cleanMarkdown('\uFEFF# Title\n')).toBe('# Title\n');
  });

  it('turns an empty document into a single newline', () => {
    expect(cleanMarkdown('')).toBe('\n');
  });

  it('is idempotent', () => {
    const source = '# T \u2014 x \uD83D\uDE80\n\n\n---\n\nBody \u00AB q \u00BB \u2014 end\u2026\n';
    const once = cleanMarkdown(source);

    expect(cleanMarkdown(once)).toBe(once);
  });
});
