const ScriptsLink = "https://roblox-scripts-dns.pages.dev/";
const ServiceKey = "AdRa-hXtp-44pk-uopl-cVIp-QdG1-Dnh1-adO0-russ-1ov3";

//-- Encode Decode Word Function
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function toBase32(bytes) {
  let bits = 0, value = 0, output = '';
  for (let byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(str) {
  let bits = 0, value = 0, output = [];
  for (let c of str.toUpperCase()) {
    const index = base32Alphabet.indexOf(c);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

function EncodeText(text, key) {
  const data = new TextEncoder().encode(text);
  const keyData = new TextEncoder().encode(key);
  const encrypted = data.map((b, i) => b ^ keyData[i % keyData.length]);
  return toBase32(encrypted);
}

function DecodeText(encoded, key) {
  const data = fromBase32(encoded);
  const keyData = new TextEncoder().encode(key);
  const decrypted = data.map((b, i) => b ^ keyData[i % keyData.length]);
  return new TextDecoder().decode(new Uint8Array(decrypted));
}
//--


// Get Random String With Length
function GetRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get Random Name Function
function GetRandomName() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * (32 - 16 + 1)) + 16; // random length between 16 and 32
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}


// Encode Script Function
function EncodeScript(str, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str); // UTF-8 bytes
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const k = key.charCodeAt(i % key.length);
    result.push((data[i] + k) % 256); // still using key shift
  }
  return result.join('/');
}

// Get Number With Math Function
function GetNumberWithMath(num) {
  if (typeof num !== 'number' || !Number.isFinite(num)) return null;
  const operators = ['+', '-', '*', '/'];
  const op = operators[Math.floor(Math.random() * operators.length)];
  let expr;
  switch (op) {
    case '+': {
      const a = Math.floor(Math.random() * num);
      const b = num - a;
      expr = `${a} + ${b}`;
      break;
    }
    case '-': {
      const a = Math.floor(Math.random() * 50) + num;
      const b = a - num;
      expr = `${a} - ${b}`;
      break;
    }
    case '*': {
      const factors = [];
      for (let i = 1; i <= Math.abs(num); i++) {
        if (num % i === 0) factors.push(i);
      }
      const a = factors[Math.floor(Math.random() * factors.length)];
      const b = num / a;
      expr = `${a} * ${b}`;
      break;
    }
    case '/': {
      const b = Math.floor(Math.random() * 10) + 1;
      const a = num * b;
      expr = `${a} / ${b}`;
      break;
    }
  }
  return expr;
}
















/* Luau obfuscator core - drop this into any Worker or module. No imports, no page, no fetch handler.
 * Usage: obfuscate(source, options) -> { script, ... }   (options are optional) */


const MAX_SCRIPT_BYTES = 512 * 1024;

// Above this the Worker can run out of its per-request CPU/memory budget and
// the platform answers with an HTML error page, so the API says so in JSON.
const SERVER_MAX_SCRIPT_BYTES = 130 * 1024;

const encoder = new TextEncoder();

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function randInt(max) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

// Names are deliberately long and made of lookalike characters (I, l, 1, O, 0)
// and underscores, so two generated names are hard to tell apart while reading.
// Two more shapes are mixed in, the ones other builds use: long runs of only
// `n` and `m` (they read like binary noise) and one long run of `l`.
const MANGLED_POOL = 'iIlmnoO01_';
const NAME_STATE = { used: new Set(), seq: 0 };

/** Every build starts with a clean name registry, so names never carry over. */
function resetNameState() {
  NAME_STATE.used = new Set();
  NAME_STATE.seq = 0;
}

function nmName() {
  const length = 14 + randInt(20);
  let name = '';
  for (let i = 0; i < length; i++) name += randInt(2) === 0 ? 'n' : 'm';
  return name;
}

function lName() {
  // The length advances per name, so two names in one build never match.
  const length = 20 + (NAME_STATE.seq++ % 13) * 2 + randInt(2);
  return 'l'.repeat(length);
}

function mangleName(minLength = 6) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const roll = randInt(10);
    let name;
    if (roll < 4) {
      name = nmName();
    } else if (roll < 6) {
      name = lName();
    } else {
      name = '_';
      const length = minLength + randInt(10);
      for (let i = 0; i < length; i++) name += MANGLED_POOL[randInt(MANGLED_POOL.length)];
    }
    if (!NAME_STATE.used.has(name)) {
      NAME_STATE.used.add(name);
      return name;
    }
  }
  const fallback = '_' + NAME_STATE.used.size.toString(36) + Date.now().toString(36);
  NAME_STATE.used.add(fallback);
  return fallback;
}

/**
 * A number is never written as itself when it can be spread over an expression
 * instead: `v` becomes `(m*q+r)`. The digits that steer decoding are therefore
 * not visibly present in the file, and the reader has to do arithmetic before
 * any constant means anything.
 */
function foldNum(v) {
  if (!Number.isInteger(v) || v < 64 || v > 1 << 26) return String(v);
  const m = 7 + randInt(Math.min(991, v - 6));
  const q = Math.floor(v / m);
  const r = v - q * m;
  return q === 1 && r === 0 ? String(v) : `(${m}*${q}+${r})`;
}

function randomName(source) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = mangleName(17);
    // Never pick a name the script already uses, and avoid the keyword-ish shape.
    if (!source.includes(name)) return name;
  }
  return '_o' + Date.now().toString(36) + randInt(1000);
}

const KEYWORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'goto',
  'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true',
  'until', 'while', 'continue',
]);

const RESERVED_NAMES = new Set([
  '_G', '_ENV', '_VERSION', 'self', 'assert', 'bit32', 'buffer', 'coroutine', 'debug',
  'error', 'getfenv', 'getmetatable', 'ipairs', 'loadstring', 'math', 'next', 'os',
  'pairs', 'pcall', 'print', 'rawequal', 'rawget', 'rawlen', 'rawset', 'require',
  'select', 'setfenv', 'setmetatable', 'shared', 'string', 'table', 'task', 'tonumber',
  'tostring', 'type', 'typeof', 'unpack', 'utf8', 'warn', 'xpcall', 'workspace', 'game',
  'script', 'Enum', 'Instance', 'Vector2', 'Vector3', 'Vector2int16', 'Vector3int16',
  'CFrame', 'Color3', 'ColorSequence', 'ColorSequenceKeypoint', 'NumberRange',
  'NumberSequence', 'NumberSequenceKeypoint', 'PhysicalProperties', 'Random', 'Ray',
  'Rect', 'Region3', 'Region3int16', 'TweenInfo', 'UDim', 'UDim2', 'BrickColor',
  'Faces', 'Axes', 'PathWaypoint', 'settings', 'UserSettings', 'plugin', 'wait',
  'spawn', 'delay', 'tick', 'time', 'elapsedTime', 'version', 'typeof', 'getgenv',
  'getrenv', 'hookfunction', 'identifyexecutor',
]);

/** Matches a long bracket starting exactly at src[i] (which must be '['). */
function matchLongBracket(src, i) {
  let j = i + 1;
  let level = 0;
  while (src[j] === '=') {
    level++;
    j++;
  }
  if (src[j] !== '[') return null;
  const contentStart = j + 1;
  const close = ']' + '='.repeat(level) + ']';
  const contentEnd = src.indexOf(close, contentStart);
  if (contentEnd < 0) return null;
  return { contentStart, contentEnd, end: contentEnd + close.length };
}

const SIMPLE_ESCAPES = {
  a: 7,
  b: 8,
  f: 12,
  n: 10,
  r: 13,
  t: 9,
  v: 11,
  '\\': 92,
  '"': 34,
  "'": 39,
  '\n': 10, // \<newline> in Lua is a newline byte
};

/**
 * Parses a short Lua string literal that starts at src[i].
 * Returns { bytes, end } or null when the literal is malformed / uses an
 * escape we do not understand (in which case the original is left alone).
 */
function parseShortString(src, i) {
  const quote = src[i];
  const bytes = [];
  let j = i + 1;

  while (j < src.length) {
    const ch = src[j];

    if (ch === quote) return { bytes, end: j + 1 };
    if (ch === '\n') return null; // unterminated

    if (ch !== '\\') {
      const cp = src.codePointAt(j);
      const asString = String.fromCodePoint(cp);
      for (const b of encoder.encode(asString)) bytes.push(b);
      j += asString.length;
      continue;
    }

    const esc = src[j + 1];
    if (esc === undefined) return null;

    if (Object.prototype.hasOwnProperty.call(SIMPLE_ESCAPES, esc)) {
      bytes.push(SIMPLE_ESCAPES[esc]);
      j += 2;
      continue;
    }

    if (esc === 'x') {
      const hex = src.slice(j + 2, j + 4);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) return null;
      bytes.push(parseInt(hex, 16));
      j += 4;
      continue;
    }

    if (esc === 'z') {
      j += 2;
      while (j < src.length && /\s/.test(src[j])) j++;
      continue;
    }

    if (esc === 'u') {
      const m = /^\{([0-9a-fA-F]{1,8})\}/.exec(src.slice(j + 2, j + 12));
      if (!m) return null;
      const cp = parseInt(m[1], 16);
      if (cp > 0x10ffff) return null;
      for (const b of encoder.encode(String.fromCodePoint(cp))) bytes.push(b);
      j += 2 + m[0].length;
      continue;
    }

    if (esc >= '0' && esc <= '9') {
      const m = /^\d{1,3}/.exec(src.slice(j + 1, j + 4));
      const value = parseInt(m[0], 10);
      if (value > 255) return null;
      bytes.push(value);
      j += 1 + m[0].length;
      continue;
    }

    return null; // unknown escape: leave this literal untouched
  }

  return null;
}

/** Skips a literal we could not parse, so its contents are not treated as code. */
function skipShortString(src, i) {
  const quote = src[i];
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === '\\') {
      // `\z` swallows the whitespace that follows it, newlines included.
      if (src[j + 1] === 'z') {
        j += 2;
        while (j < src.length && /\s/.test(src[j])) j++;
        continue;
      }
      j += 2;
      continue;
    }
    if (src[j] === quote) return j + 1;
    // An unterminated literal still belongs to the string token: returning just
    // past the quote would let its contents be tokenized as code.
    if (src[j] === '\n') return j;
    j++;
  }
  return src.length;
}

/* ------------------------------------------------------------------ */
/* tokenizer                                                           */
/* ------------------------------------------------------------------ */

const OPS3 = ['...', '..=', '//='];
const OPS2 = ['..', '==', '~=', '<=', '>=', '//', '::', '->', '+=', '-=', '*=', '/=', '%=', '^='];
const WS_CHARS = ' \t\r\n\f\v';

/**
 * Every numeric literal Luau accepts: decimal, hex (with optional fraction and
 * `p` exponent), binary, and any form with `_` digit separators. Splitting one
 * of these in two turns the script into a syntax error, so the whole literal is
 * always taken as one token.
 */
const NUM_DIGITS = '[0-9a-fA-F]';
const NUM_SEP = '(?:_?[0-9a-fA-F])*';
const NUMBER_LITERAL = new RegExp(
  '^(?:' +
    '0[xX][0-9a-fA-F](?:_?[0-9a-fA-F])*(?:\\.[0-9a-fA-F](?:_?[0-9a-fA-F])*)?(?:[pP][+-]?[0-9](?:_?[0-9])*)?' +
    '|0[bB][01](?:_?[01])*' +
    '|[0-9](?:_?[0-9])*(?:\\.(?!\\.)[0-9](?:_?[0-9])*|\\.(?!\\.))?(?:[eE][+-]?[0-9](?:_?[0-9])*)?' +
    '|\\.[0-9](?:_?[0-9])*(?:[eE][+-]?[0-9](?:_?[0-9])*)?' +
    ')',
);

function tokenize(src) {
  return tokenizeFrom(src, 0, false).tokens;
}

/**
 * Tokenizes from `start`. With `stopBrace` the scan ends at the `}` that closes
 * the current level, which is how the code inside a `${...}` template hole is
 * read. Literal template text is its own token, so renaming never touches it.
 */
function tokenizeFrom(src, start, stopBrace) {
  const out = [];
  let i = start;
  let depth = 0;

  while (i < src.length) {
    const ch = src[i];

    if (stopBrace && ch === '}' && depth === 0) {
      return { tokens: out, end: i + 1 };
    }

    if (ch === '`') {
      out.push({ t: 'op', text: '`' });
      i += 1;
      for (;;) {
        let lit = '';
        while (i < src.length) {
          if (src[i] === '\\' && i + 1 < src.length) {
            lit += src.slice(i, i + 2);
            i += 2;
            continue;
          }
          if (src[i] === '`' || src[i] === '{') break;
          lit += src[i];
          i += 1;
        }
        if (lit) out.push({ t: 'template', text: lit });
        if (i >= src.length) break;
        if (src[i] === '`') {
          out.push({ t: 'op', text: '`' });
          i += 1;
          break;
        }
        // `{ ... }` in a template holds ordinary code, so it is tokenized normally.
        out.push({ t: 'op', text: '{' });
        const inner = tokenizeFrom(src, i + 1, true);
        out.push(...inner.tokens);
        out.push({ t: 'op', text: '}' });
        i = inner.end;
      }
      continue;
    }

    if (WS_CHARS.includes(ch)) {
      let j = i + 1;
      while (j < src.length && WS_CHARS.includes(src[j])) j++;
      out.push({ t: 'ws', text: src.slice(i, j) });
      i = j;
      continue;
    }

    if (ch === '-' && src[i + 1] === '-') {
      const long = matchLongBracket(src, i + 2);
      if (long) {
        out.push({ t: 'comment', text: src.slice(i, long.end) });
        i = long.end;
        continue;
      }
      let end = src.indexOf('\n', i);
      if (end < 0) end = src.length;
      out.push({ t: 'comment', text: src.slice(i, end) });
      i = end;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const end = skipShortString(src, i);
      out.push({ t: 'string', text: src.slice(i, end) });
      i = end;
      continue;
    }

    if (ch === '[') {
      const long = matchLongBracket(src, i);
      if (long) {
        out.push({ t: 'longstring', text: src.slice(i, long.end) });
        i = long.end;
        continue;
      }
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = NUMBER_LITERAL.exec(src.slice(i));
      if (m) {
        out.push({ t: 'number', text: m[0] });
        i += m[0].length;
        continue;
      }
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      out.push({ t: 'name', text: src.slice(i, j) });
      i = j;
      continue;
    }

    const three = src.slice(i, i + 3);
    if (OPS3.includes(three)) {
      out.push({ t: 'op', text: three });
      i += 3;
      continue;
    }

    const two = src.slice(i, i + 2);
    if (OPS2.includes(two)) {
      out.push({ t: 'op', text: two });
      i += 2;
      continue;
    }

    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    out.push({ t: 'op', text: ch });
    i += 1;
  }

  return { tokens: out, end: i };
}

/**
 * Token indexes that belong to a `type Name = ...` / `export type` declaration.
 * Types are erased at run time, but their syntax is not Lua: renaming, member
 * hiding or number encoding inside one produces a script that will not parse.
 * These ranges are therefore copied through untouched.
 */
function markTypeAliases(tokens) {
  const set = new Set();
  const endsValue = (t) =>
    t &&
    (t.t === 'name' || t.t === 'string' || t.t === 'number' || t.t === 'template' ||
      isOp(t, '}', ')', ']', '?', '...'));

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t !== 'name' || tk.text !== 'type') continue;
    const p = prevSig(tokens, i);
    const prev = p >= 0 ? tokens[p] : null;
    const before = tokens[i - 1];
    const startsStatement =
      !prev ||
      isOp(prev, ';') ||
      (before && before.t === 'ws' && before.text.includes('\n')) ||
      (prev.t === 'name' && ['export', 'end', 'then', 'do', 'else'].includes(prev.text));
    if (!startsStatement) continue;

    const nameIdx = nextSig(tokens, i);
    const nameTok = tokens[nameIdx];
    if (!nameTok || nameTok.t !== 'name' || KEYWORDS.has(nameTok.text)) continue;

    // `type Name =` or `type Name<T> =`
    let eq = -1;
    for (let k = nextSig(tokens, nameIdx); k >= 0 && k < tokens.length && k < nameIdx + 24; k = nextSig(tokens, k)) {
      const t = tokens[k];
      if (isOp(t, '=')) {
        eq = k;
        break;
      }
      if (t.t === 'name' || isOp(t, '<', '>', ',')) continue;
      break;
    }
    if (eq < 0) continue;

    let last = null;
    let d = 0;
    for (let k = eq; k < tokens.length; k++) {
      const t = tokens[k];
      if (t.t === 'ws') {
        if (d === 0 && t.text.includes('\n')) {
          const nextTok = tokens[nextSig(tokens, k)];
          const carryOn =
            (last && last.t === 'op' && ['=', '|', '&', '->', ',', ':', '(', '[', '{', '<'].includes(last.text)) ||
            (nextTok && nextTok.t === 'op' && ['|', '&', '->'].includes(nextTok.text));
          if (!carryOn) break;
        }
        set.add(k);
        continue;
      }
      if (t.t === 'comment') {
        set.add(k);
        continue;
      }
      if (d === 0 && endsValue(last)) {
        const continues =
          isOp(t, '|', '&', '->', '?', '.', '<') || (isOp(t, '(') && last.t === 'name');
        if (!continues) break;
      }
      if (isOp(t, '(', '[', '{', '<')) d += 1;
      else if (isOp(t, ')', ']', '}', '>')) {
        d -= 1;
        if (d < 0) break;
      }
      set.add(k);
      last = t;
    }
    set.add(i);
    set.add(nameIdx);
    if (prev && prev.t === 'name' && prev.text === 'export') set.add(p);
  }
  return set;
}

/**
 * Marks the spans that hold type annotations (`local x: Foo<Bar>`, `(...) : T`,
 * `value :: T`). Types are erased at run time but their syntax is not Lua, so
 * feeding one through the value renamers produces a script that will not parse.
 */
function markTypeContexts(tokens, set) {
  const endsValue = (t) =>
    !!t &&
    (t.t === 'name' || t.t === 'string' || t.t === 'number' || t.t === 'template' ||
      isOp(t, '}', ')', ']', '?', '...'));

  const markSpan = (start) => {
    let depth = 0;
    let last = null;
    for (let k = start; k >= 0 && k < tokens.length; k++) {
      const t = tokens[k];
      if (t.t === 'ws') {
        if (depth === 0 && t.text.includes('\n')) {
          const nextTok = tokens[nextSig(tokens, k)];
          const carryOn =
            (last && last.t === 'op' && ['=', '|', '&', '->', ',', ':', '(', '[', '{', '<'].includes(last.text)) ||
            (nextTok && nextTok.t === 'op' && ['|', '&', '->'].includes(nextTok.text));
          if (!carryOn) break;
        }
        set.add(k);
        continue;
      }
      if (t.t === 'comment') {
        set.add(k);
        continue;
      }
      if (depth === 0 && endsValue(last)) {
        const continues =
          isOp(t, '|', '&', '->', '?', '.', '<') || (isOp(t, '(') && last.t === 'name');
        if (!continues) break;
      }
      if (
        depth === 0 &&
        !(
          t.t === 'name' ||
          t.t === 'string' ||
          t.t === 'number' ||
          isOp(t, '|', '&', '->', '?', '.', ',', ':', '...', '(', '[', '{', '<', ')', ']', '}', '>')
        )
      ) {
        break;
      }
      if (isOp(t, '(', '[', '{', '<')) depth += 1;
      else if (isOp(t, ')', ']', '}', '>')) {
        depth -= 1;
        if (depth < 0) break;
      }
      set.add(k);
      last = t;
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (isOp(tk, '::', '->')) {
      markSpan(nextSig(tokens, i));
      continue;
    }
    if (!isOp(tk, ':')) continue;
    const p = prevSig(tokens, i);
    const n = nextSig(tokens, i);
    const prev = p >= 0 ? tokens[p] : null;
    const next = tokens[n];
    if (!prev || !next) continue;
    // `obj:method(...)`, `obj:method "x"` and `obj:method {}` are calls.
    if (next.t === 'name') {
      const after = tokens[nextSig(tokens, n)];
      if (isOp(after, '(') || isOp(after, '{') || (after && after.t === 'string')) continue;
    }
    if (!endsValue(prev) && prev.t !== 'name') continue;
    markSpan(n);
  }
}

const insignificant = (tok) => !tok || tok.t === 'ws' || tok.t === 'comment';

function prevSig(tokens, i) {
  let j = i - 1;
  while (j >= 0 && insignificant(tokens[j])) j--;
  return j;
}

function nextSig(tokens, i) {
  let j = i + 1;
  while (j < tokens.length && insignificant(tokens[j])) j++;
  return j;
}

function isOp(tok, ...texts) {
  return !!tok && tok.t === 'op' && texts.includes(tok.text);
}

/** Matches an operator or a keyword (`function`, `local`, `not`, ...). */
function isTok(tok, ...texts) {
  return !!tok && (tok.t === 'op' || tok.t === 'name') && texts.includes(tok.text);
}

/* ------------------------------------------------------------------ */
/* local-variable renaming                                             */
/* ------------------------------------------------------------------ */

/** Finds the '(' that starts a `function` token's parameter list. */
function paramsStart(tokens, i) {
  let j = nextSig(tokens, i);
  let tok = tokens[j];
  if (!tok) return -1;
  if (isOp(tok, '(')) return j;
  if (tok.t !== 'name') return -1;

  // name path:  a  /  a.b  /  a:b
  for (;;) {
    const nxt = nextSig(tokens, j);
    if (isOp(tokens[nxt], '.', ':')) {
      j = nextSig(tokens, nxt);
      continue;
    }
    j = nxt;
    break;
  }

  // Luau generics: function f<T>(x)
  if (isOp(tokens[j], '<')) {
    let depth = 0;
    while (j < tokens.length) {
      if (isOp(tokens[j], '<')) depth++;
      else if (isOp(tokens[j], '>')) {
        depth--;
        if (depth === 0) {
          j = nextSig(tokens, j);
          break;
        }
      }
      j++;
    }
  }

  return isOp(tokens[j], '(') ? j : -1;
}

function collectDeclarations(tokens) {
  const declared = new Set();
  const names = new Set();
  // every name the script binds locally, including ones we must not rename
  const localNames = new Set();

  const commit = (list) => {
    for (const idx of list) {
      const tok = tokens[idx];
      if (!tok || tok.t !== 'name') continue;
      if (KEYWORDS.has(tok.text)) continue;
      localNames.add(tok.text);
      if (RESERVED_NAMES.has(tok.text)) continue;
      declared.add(idx);
      names.add(tok.text);
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.t !== 'name') continue;

    // ---------------- local ... / local function ... ----------------
    if (tok.text === 'local') {
      let j = nextSig(tokens, i);
      if (tokens[j] && tokens[j].t === 'name' && tokens[j].text === 'function') {
        const n = nextSig(tokens, j);
        if (tokens[n] && tokens[n].t === 'name') commit([n]);
        continue;
      }

      const list = [];
      let typed = false;
      for (;;) {
        const n = j; // the candidate name itself
        const nameTok = tokens[n];
        if (!nameTok || nameTok.t !== 'name' || KEYWORDS.has(nameTok.text)) break;
        if (isOp(tokens[nextSig(tokens, n)], ':')) {
          typed = true; // Luau type annotation: leave this declaration alone
          break;
        }
        list.push(n);
        const sep = nextSig(tokens, n);
        if (isOp(tokens[sep], ',')) {
          j = nextSig(tokens, sep);
          continue;
        }
        break;
      }
      if (!typed) commit(list);
      continue;
    }

    // ---------------- for k, v in ... / for i = a, b ----------------
    if (tok.text === 'for') {
      const list = [];
      let typed = false;
      let ok = false;
      let j = i;
      for (;;) {
        const n = nextSig(tokens, j);
        const nameTok = tokens[n];
        if (!nameTok || nameTok.t !== 'name' || KEYWORDS.has(nameTok.text)) break;
        const after = nextSig(tokens, n);
        const at = tokens[after];
        if (isOp(at, ':')) {
          typed = true;
          break;
        }
        if (isOp(at, '=', 'in')) {
          list.push(n);
          ok = true;
          break;
        }
        if (isOp(at, ',')) {
          list.push(n);
          j = after;
          continue;
        }
        break;
      }
      if (ok && !typed) commit(list);
      continue;
    }

    // ---------------- function params ----------------
    if (tok.text === 'function') {
      const start = paramsStart(tokens, i);
      if (start < 0) continue;

      const list = [];
      let typed = false;
      let j = start;
      for (;;) {
        const n = nextSig(tokens, j);
        const tk = tokens[n];
        if (!tk) break;
        if (isOp(tk, ')')) break;
        if (isOp(tk, '...')) {
          // vararg: usable only if not aliased, nothing to rename
          break;
        }
        if (tk.t !== 'name') break;
        const after = nextSig(tokens, n);
        if (isOp(tokens[after], ':')) {
          typed = true;
          break;
        }
        list.push(n);
        if (isOp(tokens[after], ',')) {
          j = after;
          continue;
        }
        break;
      }
      if (!typed) commit(list);
    }
  }

  return { declared, names, localNames };
}

/** True when renaming this local name everywhere cannot change its meaning. */
function isSafeName(tokens, name, declared) {
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t !== 'name' || tk.text !== name) continue;
    if (declared.has(i)) continue;

    const p = prevSig(tokens, i);
    const n = nextSig(tokens, i);
    const pt = tokens[p];
    const nt = tokens[n];

    // member access / method call / label: not a plain variable
    if (isOp(pt, '.', ':', '::')) return false;
    if (isOp(nt, '::')) return false;
    // looks like a table-constructor key:  { name = ...  or  ..., name = ...
    if (isOp(nt, '=') && isOp(pt, '{', ',')) return false;
  }
  return true;
}

function renameLocals(tokens, declarations) {
  const { declared, names } = declarations || collectDeclarations(tokens);
  if (names.size === 0) return 0;

  const used = new Set();
  for (const tk of tokens) if (tk.t === 'name') used.add(tk.text);

  const map = new Map();
  for (const name of names) {
    if (!isSafeName(tokens, name, declared)) continue;
    let fresh;
    do {
      fresh = mangleName(6);
    } while (used.has(fresh));
    used.add(fresh);
    map.set(name, fresh);
  }

  if (map.size === 0) return 0;

  for (const tk of tokens) {
    if (tk.t === 'name' && map.has(tk.text)) tk.text = map.get(tk.text);
  }
  return map.size;
}

/* ------------------------------------------------------------------ */
/* table fields and global functions                                   */
/* ------------------------------------------------------------------ */

/** Finds the `end` that closes the block opened at `funcIdx`. */
function functionEnd(tokens, funcIdx) {
  let depth = 0;
  let pendingDo = 0;
  for (let k = funcIdx; k < tokens.length; k++) {
    const tk = tokens[k];
    if (tk.t !== 'name') continue;
    if (tk.text === 'function' || tk.text === 'if' || tk.text === 'repeat') {
      depth++;
    } else if (tk.text === 'for' || tk.text === 'while') {
      depth++;
      pendingDo++;
    } else if (tk.text === 'do') {
      if (pendingDo > 0) pendingDo--;
      else depth++;
    } else if (tk.text === 'end' || tk.text === 'until') {
      depth--;
      if (depth === 0) return k;
    }
  }
  return -1;
}

/**
 * Globals that get replaced by an environment lookup, so the script never spells
 * out `print`, `game`, `Instance`, ... Some names are deliberately kept plain:
 * `script` is not reachable through the env table, `_G`/`_ENV` are the escape
 * hatch itself, and the executor names are left for the guard to use.
 */
const KEEP_PLAIN_GLOBALS = [
  '_G', '_ENV', '_VERSION', 'self', 'script', 'getgenv', 'getrenv', 'getfenv', 'setfenv',
  'hookfunction', 'identifyexecutor', 'isfile', 'writefile', 'readfile',
];

const HIDABLE_GLOBALS = new Set(
  [...RESERVED_NAMES].filter((name) => !KEEP_PLAIN_GLOBALS.includes(name)),
);

/** Name-based lookup (`_G.foo`, `getgenv().foo`) makes global renaming unsafe. */
const UNSAFE_GLOBALS = [
  '_G', '_ENV', 'getgenv', 'getrenv', 'getfenv', 'setfenv', 'shared', 'rawget', 'rawset',
];

/** True when a token starts a line (or follows a `;`). */
function newlineMap(tokens) {
  const map = new Array(tokens.length).fill(false);
  let atStart = true;
  for (let i = 0; i < tokens.length; i++) {
    map[i] = atStart;
    const tk = tokens[i];
    if (tk.t === 'ws' || tk.t === 'comment') continue;
    atStart = false;
  }
  return map;
}

/** Every string literal's decoded text, so we never rename something used as a string. */
function literalStrings(tokens) {
  const decoder = new TextDecoder();
  const set = new Set();
  for (const tk of tokens) {
    if (tk.t === 'string') {
      const parsed = parseShortString(tk.text, 0);
      if (parsed && parsed.end === tk.text.length) {
        set.add(decoder.decode(new Uint8Array(parsed.bytes)));
      }
    } else if (tk.t === 'longstring') {
      const long = matchLongBracket(tk.text, 0);
      if (long) set.add(tk.text.slice(long.contentStart, long.contentEnd));
    }
  }
  return set;
}

function freshName(used) {
  let name;
  do {
    name = mangleName(6);
  } while (used.has(name));
  used.add(name);
  return name;
}

/**
 * A table is only field-renamed when the script never hands it to other code:
 * anything it is passed to would still look for the original field names.
 */
function tableIsSelfContained(tokens, name) {
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t !== 'name' || tk.text !== name) continue;
    const p = prevSig(tokens, i);
    const n = nextSig(tokens, i);
    const pt = tokens[p];
    const nt = tokens[n];
    if (isOp(nt, '.', ':', '[')) continue; // own field access
    if (isOp(pt, '.')) continue; // someone else's field
    if (isTok(pt, '#', 'not', 'if', 'and', 'or', '==', '~=')) continue;
    if (pt && pt.t === 'name' && pt.text === 'local') continue;
    // `local other = t` is a tracked alias, not a hand-off
    if (isOp(pt, '=')) {
      const aliasName = prevSig(tokens, p);
      if (
        tokens[aliasName] &&
        tokens[aliasName].t === 'name' &&
        isTok(tokens[prevSig(tokens, aliasName)], 'local')
      ) {
        continue;
      }
    }
    if (pt && pt.t === 'name' && ['pairs', 'ipairs', 'next', 'type', 'typeof'].includes(pt.text)) {
      continue;
    }
    // `pairs(t)` / `#t` style read-only use is safe
    if (isOp(pt, '(')) {
      const callee = prevSig(tokens, p);
      if (
        tokens[callee] &&
        tokens[callee].t === 'name' &&
        ['pairs', 'ipairs', 'next', 'type', 'typeof'].includes(tokens[callee].text)
      ) {
        continue;
      }
    }
    return false; // passed around / returned / reassigned: leave its fields alone
  }
  return true;
}

function renameStructure(tokens, opts, declNames) {
  const lines = newlineMap(tokens);
  const literals = literalStrings(tokens);
  const used = new Set();
  for (const tk of tokens) if (tk.t === 'name') used.add(tk.text);

  const owned = new Map(); // table name -> { keys: [tokenIndex], fields: Set }
  const alias = new Map(); // local u = t

  const ownerOf = (name) => {
    let cur = name;
    for (let hop = 0; hop < 8 && alias.has(cur); hop++) cur = alias.get(cur);
    return owned.has(cur) ? cur : null;
  };

  const addTable = (name, valIdx) => {
    if (RESERVED_NAMES.has(name) || KEYWORDS.has(name)) return;
    const v = tokens[valIdx];
    if (!v) return;
    if (v.t === 'name') {
      if (!KEYWORDS.has(v.text)) alias.set(name, v.text);
      return;
    }
    if (!isOp(v, '{')) return;

    let depth = 0;
    let close = -1;
    const keys = [];
    for (let k = valIdx; k < tokens.length; k++) {
      const tk = tokens[k];
      if (isOp(tk, '{', '(', '[')) depth++;
      else if (isOp(tk, '}', ')', ']')) {
        depth--;
        if (depth === 0) {
          close = k;
          break;
        }
      } else if (depth === 1 && tk.t === 'name' && !KEYWORDS.has(tk.text)) {
        const nx = nextSig(tokens, k);
        if (isOp(tokens[nx], '=')) keys.push(k);
        else if (isOp(tokens[nx], '(') && isTok(tokens[prevSig(tokens, k)], 'function')) keys.push(k);
      }
    }
    if (close < 0) return;

    let rec = owned.get(name);
    if (!rec) {
      rec = { keys: [], fields: new Set() };
      owned.set(name, rec);
    }
    for (const idx of keys) {
      rec.keys.push(idx);
      rec.fields.add(tokens[idx].text);
    }
  };

  // ---- 1. table constructors, local or global ------------------------
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t !== 'name') continue;
    if (KEYWORDS.has(tk.text) && tk.text !== 'local') continue;

    if (tk.text === 'local') {
      const n = nextSig(tokens, i);
      const nameTok = tokens[n];
      if (!nameTok || nameTok.t !== 'name' || KEYWORDS.has(nameTok.text)) continue;
      const eq = nextSig(tokens, n);
      if (!isOp(tokens[eq], '=')) continue; // typed declaration or no initialiser
      addTable(nameTok.text, nextSig(tokens, eq));
      continue;
    }

    const eq = nextSig(tokens, i);
    if (!isOp(tokens[eq], '=')) continue;
    if (!(lines[i] || isOp(tokens[prevSig(tokens, i)], ';'))) continue;
    addTable(tk.text, nextSig(tokens, eq));
  }

  // ---- 2. fields added later: t.f = ... / function t:f() -------------
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t !== 'name') continue;
    const dot = nextSig(tokens, i);
    if (!isOp(tokens[dot], '.', ':')) continue;
    const owner = ownerOf(tk.text);
    if (!owner) continue;
    const fIdx = nextSig(tokens, dot);
    const fTok = tokens[fIdx];
    if (!fTok || fTok.t !== 'name' || KEYWORDS.has(fTok.text)) continue;
    const after = nextSig(tokens, fIdx);
    const isDecl =
      isOp(tokens[after], '=') ||
      (isOp(tokens[after], '(') && isTok(tokens[prevSig(tokens, i)], 'function'));
    if (!isDecl) continue;
    const rec = owned.get(owner);
    rec.keys.push(fIdx);
    rec.fields.add(fTok.text);
  }

  // ---- 3. rename field names ----------------------------------------
  let fields = 0;
  let globals = 0;

  if (opts.renameFields && owned.size > 0) {
    const safe = new Set();
    for (const name of owned.keys()) if (tableIsSelfContained(tokens, name)) safe.add(name);
    for (const [name, target] of alias) {
      if (safe.has(target) && tableIsSelfContained(tokens, name)) safe.add(name);
    }

    const fieldMap = new Map();
    for (const name of safe) {
      const rec = owned.get(ownerOf(name));
      for (const f of rec.fields) {
        if (KEYWORDS.has(f) || RESERVED_NAMES.has(f)) continue;
        if (literals.has(f)) continue; // also reached as a string key: leave it
        if (!fieldMap.has(f)) fieldMap.set(f, freshName(used));
      }
    }

    const touched = new Set();

    // Methods declared as `function t:name()` get the table as `self`, so
    // `self.field` inside their body must follow the rename too.
    for (const name of safe) {
      const rec = owned.get(ownerOf(name));
      for (let i = 0; i < tokens.length; i++) {
        const tk = tokens[i];
        if (tk.t !== 'name' || tk.text !== name) continue;
        const funcIdx = prevSig(tokens, i);
        if (!isTok(tokens[funcIdx], 'function')) continue;
        const colon = nextSig(tokens, i);
        if (!isOp(tokens[colon], ':')) continue;
        const methodIdx = nextSig(tokens, colon);
        const methodTok = tokens[methodIdx];
        if (!methodTok || methodTok.t !== 'name' || !rec.fields.has(methodTok.text)) continue;
        const end = functionEnd(tokens, funcIdx);
        if (end < 0) continue;

        for (let k = methodIdx; k < end; k++) {
          const selfTok = tokens[k];
          if (selfTok.t !== 'name' || selfTok.text !== 'self') continue;
          const dot = nextSig(tokens, k);
          if (!isOp(tokens[dot], '.', ':')) continue;
          const aIdx = nextSig(tokens, dot);
          const aTok = tokens[aIdx];
          if (!aTok || aTok.t !== 'name') continue;
          if (touched.has(aIdx)) continue;
          if (!rec.fields.has(aTok.text)) continue;
          if (!fieldMap.has(aTok.text)) continue;
          aTok.text = fieldMap.get(aTok.text);
          touched.add(aIdx);
        }
      }
    }

    for (const name of safe) {
      const rec = owned.get(ownerOf(name));
      for (const idx of rec.keys) {
        if (touched.has(idx)) continue;
        touched.add(idx);
        const tk = tokens[idx];
        if (tk && fieldMap.has(tk.text)) tk.text = fieldMap.get(tk.text);
      }
    }

    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i];
      if (tk.t !== 'name' || !safe.has(tk.text)) continue;
      const dot = nextSig(tokens, i);
      if (!isOp(tokens[dot], '.', ':')) continue;
      const fIdx = nextSig(tokens, dot);
      if (touched.has(fIdx)) continue;
      const fTok = tokens[fIdx];
      if (!fTok || fTok.t !== 'name') continue;
      const owner = ownerOf(tk.text);
      if (!owner || !owned.get(owner).fields.has(fTok.text)) continue;
      if (fieldMap.has(fTok.text)) fTok.text = fieldMap.get(fTok.text);
    }

    fields = fieldMap.size;
  }

  // ---- 4. rename globals the script defines itself -------------------
  if (opts.renameGlobals) {
    let unsafe = false;
    for (const tk of tokens) {
      if (tk.t === 'name' && UNSAFE_GLOBALS.includes(tk.text)) {
        unsafe = true;
        break;
      }
    }

    if (!unsafe) {
      const candidates = new Set();
      for (let i = 0; i < tokens.length; i++) {
        const tk = tokens[i];
        if (tk.t !== 'name') continue;

        if (tk.text === 'function') {
          const n = nextSig(tokens, i);
          const nameTok = tokens[n];
          if (!nameTok || nameTok.t !== 'name' || KEYWORDS.has(nameTok.text)) continue;
          if (isTok(tokens[prevSig(tokens, i)], 'local')) continue;
          candidates.add(nameTok.text);
          continue;
        }

        if (KEYWORDS.has(tk.text)) continue;
        const eq = nextSig(tokens, i);
        if (!isOp(tokens[eq], '=')) continue;
        if (!(lines[i] || isOp(tokens[prevSig(tokens, i)], ';'))) continue;
        if (isOp(tokens[prevSig(tokens, i)], '{', ',')) continue;
        candidates.add(tk.text);
      }

      const globalMap = new Map();
      for (const name of candidates) {
        if (declNames.has(name) || RESERVED_NAMES.has(name) || KEYWORDS.has(name)) continue;
        if (literals.has(name)) continue;
        let plain = true;
        for (let i = 0; i < tokens.length && plain; i++) {
          const tk = tokens[i];
          if (tk.t !== 'name' || tk.text !== name) continue;
          if (isOp(tokens[prevSig(tokens, i)], '.', ':', '::')) plain = false;
        }
        if (!plain) continue;
        globalMap.set(name, freshName(used));
      }

      for (const tk of tokens) {
        if (tk.t === 'name' && globalMap.has(tk.text)) tk.text = globalMap.get(tk.text);
      }
      globals = globalMap.size;
    }
  }

  return { fields, globals };
}

/* ------------------------------------------------------------------ */
/* encoder                                                             */
/* ------------------------------------------------------------------ */

// The characters an encrypted payload is written with. Symbols dominate, so a
// payload looks like noise instead of a word; every character here is safe
// inside a Lua "..." literal and is looked up with string.find(..., true).
const PAYLOAD_SYMBOLS = '@#$%^&*()!~;:<>?/|[]{}=+-_.';
const PAYLOAD_ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

function makeAlphabet() {
  const symbols = [...PAYLOAD_SYMBOLS].sort(() => Math.random() - 0.5).slice(0, 11);
  const alnum = [...PAYLOAD_ALNUM].sort(() => Math.random() - 0.5).slice(0, 5);
  return [...symbols, ...alnum].sort(() => Math.random() - 0.5).join('');
}

/**
 * The payload literal for one string: the encrypted bytes, cut into two or
 * three fragments and listed backwards. The runtime joins them from the last
 * one down, so a tool that simply concatenates the literals gets nonsense.
 */
/**
 * Turns a byte string into a chain that depends on its own history.
 *
 * Byte i is stored as (plain[i] - plain[i-1] - key[i]), where key[i] comes from
 * a mixer that is advanced with every plaintext byte. Rebuilding the string
 * therefore means walking it in order, carrying a state word along, and the
 * state word is only correct if the bytes before it were correct. There is no
 * "decode the table once" step: a single wrong guess poisons the rest.
 */
function chainBytes(bytes) {
  const out = [];
  let prev = 0;
  let st = 0x5b;
  for (const b of bytes) {
    const k = (st * 13 + 7) & 255;
    out.push((b - prev - k) & 255);
    prev = b;
    st = (st * 31 + b + 11) & 255;
  }
  return out;
}

/**
 * Two more byte schemes, each with its own state word and its own arithmetic.
 * Scheme 0 is chainBytes above. A build spreads constants over all three, and
 * no single routine in the output can undo more than one of them.
 */
function schemeEncode(bytes, g) {
  if (g === 0) return chainBytes(bytes);
  const out = [];
  let prev = 0;
  let st = g === 1 ? 0x2f : 0x77;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (g === 1) {
      const k = (st * 7 + 13) & 255;
      out.push((b - prev * 3 - k) & 255);
      st = (st * 17 + b + 5) & 255;
    } else {
      const k = (st * 29 + i * 37 + 11) & 255;
      out.push((b - (prev >> 1) - k) & 255);
      st = (st * 13 + b + 3) & 255;
    }
    prev = b;
  }
  return out;
}

/**
 * A constant is stored as two independently keyed halves. Neither half decodes
 * to anything on its own, so a decoded constant pool cannot be listed as "this
 * entry is print".
 */
function splitConstant(bytes) {
  if (bytes.length < 2) return [bytes];
  const cut = 1 + randInt(bytes.length - 1);
  return [bytes.slice(0, cut), bytes.slice(cut)];
}

function encodePayload(bytes, cipher, link) {
  const payload = cipher.encrypt(bytes, link);
  const want = 2 + randInt(2);
  const size = Math.ceil(payload.length / want);
  const cuts = [];
  for (let i = 0; i < payload.length; i += size) cuts.push(payload.slice(i, i + size));
  if (cuts.length < 2) return `"${payload}"`;
  cuts.reverse();
  return `{${cuts.map((c) => `"${c}"`).join(',')}}`;
}

/**
 * Every string is cut into two to five pieces. Piece n+1 is keyed with the last
 * byte of piece n, so a piece on its own cannot be decrypted at all, the pieces
 * alternate between machines, and they are put back together in a scrambled
 * order, so "join them in the order they appear" gives nonsense.
 */
function makeCodec(first, second) {
  const link0 = 1 + randInt(255);

  const split = (bytes, count) => {
    const out = [];
    let at = 0;
    for (let i = 0; i < count; i++) {
      const take = Math.ceil((bytes.length - at) / (count - i));
      out.push(bytes.slice(at, at + take));
      at += take;
    }
    return out;
  };

  // Seal in decode order: positions[] says which part of the plaintext each
  // step carries, and every step is keyed with the last byte of the step before
  // it, exactly the chain the runtime rebuilds.
  const seal = (bytes, positions) => {
    const chunks = split(bytes, positions.length);
    const sealed = [];
    let link = link0;
    for (let t = 0; t < positions.length; t++) {
      const chunk = chunks[positions[t]];
      const machine = t % 2 === 0 ? first : second;
      sealed.push({ payload: encodePayload(chunk, machine.cipher, link), machine });
      if (chunk.length > 0) link = chunk[chunk.length - 1];
    }
    return sealed;
  };

  const countFor = (len) => (len === 0 ? 1 : 1 + randInt(Math.min(len, 5)));

  return {
    link0,
    /** Lua expression that produces the plaintext of these bytes. */
    call(bytes) {
      const count = countFor(bytes.length);
      // Decode order is not the order the text is rebuilt in, so joining the
      // pieces the way they appear gives a scrambled string.
      const positions = Array.from({ length: count }, (_, i) => i);
      if (count > 1) {
        do positions.sort(() => Math.random() - 0.5);
        while (positions.every((p, i) => p === i));
      }
      const sealed = seal(bytes, positions);
      if (count === 1) return `${sealed[0].machine.decoder}(${sealed[0].payload},${link0})`;
      const lines = [];
      sealed.forEach((piece, t) => {
        const link = t === 0 ? String(link0) : `(string.byte(p${t - 1},-1) or ${link0})`;
        lines.push(`local p${t}=${piece.machine.decoder}(${piece.payload},${link}) `);
      });
      const order = [];
      for (let pos = 0; pos < count; pos++) order.push(`p${positions.indexOf(pos)}`);
      return `(function() ${lines.join('')}return ${order.join('..')} end)()`;
    },
    /** The two payload literals of the lazily built name table. */
    pair(bytes) {
      if (bytes.length === 0) return `{${encodePayload([], first.cipher, link0)},false}`;
      const sealed = seal(bytes, [0, 1]);
      return `{${sealed[0].payload},${sealed[1].payload}}`;
    },
  };
}

function encodeInteger(text, hideText) {
  // Separators, binary and hex-float literals are carried through unchanged:
  // re-spelling them would be the only thing that could change their meaning.
  if (text.includes('_') || /^0[bB]/.test(text) || /[pP]/.test(text)) return null;
  if (!/^0[xX][0-9a-fA-F]+$/.test(text) && !/^[0-9]+$/.test(text)) {
    // A decimal or exponent literal: carry it as an encrypted string and parse
    // it at run time, so prices and multipliers stop being searchable.
    if (/^(?:[0-9]+\.[0-9]*|\.[0-9]+|[0-9]+(?:\.[0-9]*)?[eE][+-]?[0-9]+)$/.test(text)) {
      return `tonumber(${hideText(text)})`;
    }
    return null;
  }

  let value;
  if (/^0[xX]/.test(text)) value = parseInt(text.slice(2), 16);
  else value = parseInt(text, 10);
  if (!Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER - 0xfffff) return null;
  if (value === 0) return '0';

  // The number itself must never appear in the output, or a search for a price
  // finds it straight away. Some become a decrypted string parsed at run time,
  // the rest a sum or difference of two unrelated numbers.
  const roll = randInt(3);
  if (roll === 0) return `tonumber(${hideText(String(value))})`;
  if (roll === 1 && value > 2) {
    const pad = 1 + randInt(Math.min(value - 1, 999999));
    return `(${pad}+${value - pad})`;
  }
  const r = 1 + randInt(999999);
  return `(${value + r}-${r})`;
}

/* ------------------------------------------------------------------ */
/* instance properties, methods and services                            */
/* ------------------------------------------------------------------ */

/**
 * Indices of tokens that belong to a Luau type annotation. Members are never
 * rewritten there: `local p: Instance` or `local x: Types.Foo` is a type, not a
 * property read, and `Types[dec("Foo")]` would not parse.
 */
function markTypeAnnotations(tokens) {
  const marked = new Set();
  const typeKeyword = new Set(['nil', 'true', 'false', 'typeof', 'function']);

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (!isOp(tk, ':', '::')) continue;

    if (isOp(tk, ':')) {
      const n = nextSig(tokens, i);
      const nameTok = tokens[n];
      if (!nameTok || nameTok.t !== 'name') continue;
      if (isOp(tokens[nextSig(tokens, n)], '(')) continue; // obj:method(...)
    }

    let depth = 0;
    for (let k = i + 1; k < tokens.length; k++) {
      const t = tokens[k];
      if (t.t === 'comment') continue;
      if (t.t === 'ws') {
        if (depth === 0 && t.text.includes('\n')) break;
        continue;
      }
      if (t.t === 'name') {
        if (depth === 0 && KEYWORDS.has(t.text) && !typeKeyword.has(t.text)) break;
        marked.add(k);
        continue;
      }
      if (t.t === 'number' || t.t === 'string' || t.t === 'longstring') {
        marked.add(k);
        continue;
      }
      if (isOp(t, '{', '(', '[')) {
        depth++;
        marked.add(k);
        continue;
      }
      if (isOp(t, '}', ')', ']')) {
        if (depth === 0) break;
        depth--;
        marked.add(k);
        continue;
      }
      if (depth === 0 && isOp(t, '=', ',', ';', '..', '+', '*', '/')) break;
      marked.add(k);
    }
  }
  return marked;
}

/** The `(`/`[`/`{` that matches the closer at `i`. */
function matchingOpen(tokens, i) {
  const close = tokens[i].text;
  const open = close === ')' ? '(' : close === ']' ? '[' : '{';
  let depth = 0;
  for (let k = i; k >= 0; k--) {
    const tk = tokens[k];
    if (tk.t !== 'op') continue;
    if (tk.text === close) depth++;
    else if (tk.text === open) {
      depth--;
      if (depth === 0) return k;
    }
  }
  return -1;
}

/**
 * First token of the expression that ends at `endIdx`. Walks back over calls,
 * indexes and `.` chains, so `game:GetService("X")` or `(a or b)` can be used
 * as a receiver.
 */
function exprStart(tokens, endIdx) {
  let j = endIdx;
  for (let hop = 0; hop < 128; hop++) {
    const tk = tokens[j];
    if (!tk) return -1;
    if (tk.t === 'name' || tk.t === 'string' || tk.t === 'longstring' || tk.t === 'number') {
      if (tk.t === 'name' && (tk.text === 'end' || tk.text === 'function')) return -1;
      const dot = prevSig(tokens, j);
      if (isOp(tokens[dot], '.', ':')) {
        const prev = prevSig(tokens, dot);
        const p = tokens[prev];
        if (p && (p.t === 'name' || p.t === 'string' || p.t === 'longstring' || isOp(p, ')', ']', '}'))) {
          j = prev;
          continue;
        }
      }
      return j;
    }
    if (isOp(tk, ')') || isOp(tk, ']') || isOp(tk, '}')) {
      const open = matchingOpen(tokens, j);
      if (open < 0) return -1;
      if (isOp(tokens[open], '{')) return open;
      const before = prevSig(tokens, open);
      const b = tokens[before];
      if (b && (b.t === 'name' || b.t === 'string' || b.t === 'longstring' || isOp(b, ')', ']', '}'))) {
        j = before;
        continue;
      }
      return open;
    }
    return -1;
  }
  return -1;
}

/** How the name at `idx` is emitted: through the env lookup, or spelled out. */
function renderName(tokens, idx, opts, ctx) {
  const tk = tokens[idx];
  if (!tk || tk.t !== 'name') return '';
  if (!opts.hideGlobals || !HIDABLE_GLOBALS.has(tk.text)) return tk.text;
  if (ctx.declarations.declared.has(idx)) return tk.text;
  if (ctx.declarations.localNames.has(tk.text)) return tk.text;

  const pt = tokens[prevSig(tokens, idx)];
  const nt = tokens[nextSig(tokens, idx)];
  if (isOp(pt, '.', ':', '::') || isTok(pt, 'local', 'function', 'goto')) return tk.text;
  if (isOp(nt, '=', '::')) return tk.text;
  return `${ctx.envName}(${ctx.hideKey(tk.text)})`;
}

/**
 * Member access becomes encoded bracket access, so no Roblox property, method
 * or service name is spelled out:
 *
 *   part.Parent             -> part[dec("...")]
 *   game:GetService("X")    -> C((game),dec("..."),"X")
 *   hs:JSONEncode(t)        -> C((hs),dec("..."),t)
 *   game:GetService("HttpService"):JSONEncode(t)
 *                           -> C((C((game),dec("..."),"H...")),dec("..."),t)
 *
 * `C(obj, key, ...)` is a one-line helper that looks the method up and passes
 * the receiver on as the first argument, so the receiver is written once and
 * may itself be any expression, including the result of another call.
 */
function planMembers(tokens, opts, ctx) {
  const plan = {
    prefixes: new Map(),
    replacements: new Map(),
    skips: new Set(),
    count: 0,
    usesCall: false,
  };
  if (!opts.hideMembers) return plan;

  const annotations = markTypeAnnotations(tokens);

  // `function a.b.c()` / `function a:m()` names cannot be bracket syntax.
  const declPath = new Set();
  for (let i = 0; i < tokens.length; i++) {
    if (!isTok(tokens[i], 'function')) continue;
    const paren = paramsStart(tokens, i);
    if (paren < 0) continue;
    for (let k = nextSig(tokens, i); k < paren; k++) declPath.add(k);
  }

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (!isOp(tk, '.', ':')) continue;
    if (annotations.has(i) || declPath.has(i)) continue;

    const nameIdx = nextSig(tokens, i);
    const nameTok = tokens[nameIdx];
    if (!nameTok || nameTok.t !== 'name' || KEYWORDS.has(nameTok.text)) continue;
    if (declPath.has(nameIdx)) continue;
    if (ctx.skip && (ctx.skip.has(i) || ctx.skip.has(nameIdx))) continue;

    if (isOp(tk, '.')) {
      plan.count++;
      plan.replacements.set(i, `[${ctx.hideKey(nameTok.text)}]`);
      for (let k = i + 1; k < nameIdx; k++) plan.skips.add(k);
      plan.skips.add(nameIdx);
      continue;
    }

    // `obj:Method(` is a call; `obj: Type` is an annotation.
    const openIdx = nextSig(tokens, nameIdx);
    if (!isOp(tokens[openIdx], '(')) continue;

    const start = exprStart(tokens, prevSig(tokens, i));
    if (start < 0) continue;

    // `obj:m(a, b)` -> `C((obj),key,a, b)`: the receiver is handed to the helper
    // as the first argument, so nested receivers simply stack their prefixes.
    plan.prefixes.set(start, `${ctx.callName}((` + (plan.prefixes.get(start) || ''));
    plan.usesCall = true;
    plan.count++;
    for (let skip = i + 1; skip <= nameIdx; skip++) plan.skips.add(skip);

    const closeIdx = nextSig(tokens, openIdx);
    if (isOp(tokens[closeIdx], ')')) {
      // obj:m()  ->  C((obj),key)
      plan.replacements.set(i, `),${ctx.hideKey(nameTok.text)})`);
      for (let skip = openIdx; skip <= closeIdx; skip++) plan.skips.add(skip);
    } else {
      plan.replacements.set(i, `),${ctx.hideKey(nameTok.text)},`);
      plan.replacements.set(openIdx, '');
    }
  }

  return plan;
}

/* ------------------------------------------------------------------ */
/* payload cipher: byte keystream driven by the S-box and a seed that   */
/* only the private RSA exponent can unwrap                            */
/* ------------------------------------------------------------------ */

function gfMultiply(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

/** The S-box for the byte substitution, derived once so it never has to be
 * typed out by hand. */
function buildSBox() {
  const inverse = new Uint8Array(256);
  for (let a = 1; a < 256; a++) {
    for (let b = 1; b < 256; b++) {
      if (gfMultiply(a, b) === 1) {
        inverse[a] = b;
        break;
      }
    }
  }
  const rotl = (x, n) => ((x << n) | (x >> (8 - n))) & 0xff;
  const box = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const x = inverse[i];
    box[i] = (x ^ rotl(x, 1) ^ rotl(x, 2) ^ rotl(x, 3) ^ rotl(x, 4) ^ 0x63) & 0xff;
  }
  return box;
}

const SBOX = buildSBox();
const PM_MOD = 2147483647;

const SMALL_PRIMES = [
  3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
  101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193,
  197, 199, 211, 223, 227, 229, 233, 239, 241, 251,
];

function modpowBig(base, exp, mod) {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

function isPrime(n) {
  if (n < 2) return false;
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0) return false;
  }
  let d = n - 1;
  let s = 0;
  while (d % 2 === 0) {
    d /= 2;
    s++;
  }
  for (const a of [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]) {
    if (a % n === 0) continue;
    let x = Number(modpowBig(BigInt(a), BigInt(d), BigInt(n)));
    if (x === 1 || x === n - 1) continue;
    let ok = false;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}

function randomPrime() {
  for (;;) {
    const buf = new Uint16Array(1);
    crypto.getRandomValues(buf);
    const n = (buf[0] | 1 | 0x8000) & 0xffff;
    if (isPrime(n)) return n;
  }
}

function modInverse(a, m) {
  let oldR = a % m;
  let r = m;
  let oldS = 1n;
  let s = 0n;
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return ((oldS % m) + m) % m;
}

/**
 * Real RSA maths with a 31-32 bit modulus: the keystream seed is encrypted with
 * the public exponent and the script carries only the private exponent, so the
 * seed never appears in the output as a plain number.
 */
function wrapSeedKey() {
  for (;;) {
    const p = randomPrime();
    const q = randomPrime();
    const n = p * q;
    const phi = (p - 1) * (q - 1);
    if (p === q || n < 1 << 30 || n >= 2 ** 32) continue;
    if (phi % 65537 === 0) continue;
    const e = 65537n;
    const d = modInverse(e, BigInt(phi));
    const seed = 1 + randInt(Math.min(n - 1, PM_MOD - 1));
    const c = Number(modpowBig(BigInt(seed), e, BigInt(n)));
    return { n, d: Number(d), c, seed };
  }
}

/** Bytes as two characters per byte, using only the random alphabet. */
function packBytes(bytes, alphabet) {
  let out = '';
  for (const b of bytes) out += alphabet[b >> 4] + alphabet[b & 15];
  return out;
}

/**
 * The payload cipher: every byte is substituted through the S-box with an index
 * that depends on the seed, the byte position and a fresh 8 byte nonce. The
 * mirror of this function is not written out as code in the output; it is
 * assembled into an instruction stream and run by the small virtual machine
 * from vmPrelude(), so nothing in the file reads like a cipher routine.
 */
function makeCipher(alphabet) {
  const { n, d, c, seed } = wrapSeedKey();
  // Each machine carries its own keystream constants, so two payloads from two
  // machines are undone by two different formulas.
  const mult = [3, 5, 9, 11, 13, 17, 19, 21, 25, 27][randInt(10)];
  const shift = [15, 17, 19, 23, 27, 31][randInt(6)];
  const salt = randInt(256);

  const encrypt = (bytes, link = 0) => {
    // Pad to a whole number of 16 byte blocks, so two strings of different
    // lengths do not give their lengths away. The first plaintext byte says how
    // much padding to drop again.
    const padLen = (16 - ((bytes.length + 1) % 16)) % 16;
    const data = [padLen, ...bytes];
    for (let k = 0; k < padLen; k++) data.push(randInt(256));

    const nonce = new Uint8Array(8);
    crypto.getRandomValues(nonce);

    const payload = [...nonce];
    for (let j = 1; j <= data.length; j++) {
      const key =
        (((seed + j * mult) & 255) ^
          nonce[(j - 1) % 8] ^
          (seed >>> (j & shift)) ^
          salt ^
          (link & 255)) &
        255;
      payload.push(data[j - 1] ^ SBOX[key]);
    }
    return packBytes(payload, alphabet);
  };

  return { n, d, c, seed, mult, shift, salt, encrypt };
}

/**
 * Every hidden word is decrypted on first use, into one table, but each word
 * goes into a random slot and the payloads are written in random order. The
 * body only ever mentions a slot number, so a name and the place it is used are
 * never next to each other in the file, and the junk slots are never decrypted
 * at all because nothing ever asks for them.
 */
function buildNameTable(codec, decoders, hiddenKeys, seen) {
  const [T, R] = preludeNames(seen + 'nameTable', 2);
  const words = [...hiddenKeys.keys()];
  const span = words.length * 3 + 9;
  const used = new Set();
  const pickSlot = () => {
    let slot = 1 + randInt(span);
    for (let tries = 0; used.has(slot) && tries < 64; tries++) slot = 1 + randInt(span);
    while (used.has(slot)) slot++;
    used.add(slot);
    return slot;
  };

  const slots = new Map();
  const lines = [];
  for (const word of words) {
    const slot = pickSlot();
    slots.set(word, slot);
    lines.push(`${R}[${slot}]=${codec.pair([...encoder.encode(word)])} `);
  }

  // A few junk slots, so the table does not read like a tidy list of names.
  const junk = 2 + randInt(3);
  for (let i = 0; i < junk; i++) {
    const slot = pickSlot();
    const bytes = [];
    const len = 2 + randInt(9);
    for (let k = 0; k < len; k++) bytes.push(33 + randInt(90));
    lines.push(`${R}[${slot}]=${codec.pair(bytes)} `);
  }

  lines.sort(() => Math.random() - 0.5);

  return {
    text:
      `local ${R}={} ` + lines.join('') +
      `local ${T}=setmetatable({},{__index=function(t,k) local v=${R}[k] ` +
      `if v then local a=${decoders[0]}(v[1],${codec.link0}) local b="" ` +
      `if v[2] then b=${decoders[1]}(v[2],string.byte(a,-1) or ${codec.link0}) end ` +
      `v=a..b ${R}[k]=v rawset(t,k,v) end return v end}) `,
    substitute: (text) =>
      text.replace(/\u0001(\d+)\u0001/g, (_, n) => `${T}[${slots.get(words[Number(n)])}]`),
  };
}

/**
 * The body goes inside a test that is always true but is written as arithmetic
 * on unrelated numbers, with a dead branch that looks like a real check.
 */
function opaqueWrap(body, seen) {
  const [A, B, D] = preludeNames(seen + body, 3);
  const k = 2 + randInt(99991);
  const m = 2 + randInt(9999);
  return (
    `local ${A}=bit32.bxor(${k},${k}) local ${B}=math.floor(${m}/${m})-1 ` +
    `if ${A}+${B}==0 and ${A}<=${B} then ` +
    body +
    ` else local ${D}=${A}+${B} if ${D}>0 then return end end `
  );
}

/**
 * A canary payload plus a shape check on the decoder: a random token must come
 * back with the right length and the right weighted byte sum. If someone swapped
 * the decoder out, the check fails and the chunk returns quietly instead of
 * running under their hook.
 */
function tamperGuard(codec, seen) {
  const len = 6 + randInt(6);
  const bytes = [];
  for (let i = 0; i < len; i++) bytes.push(33 + randInt(90));
  let sum = 0;
  for (let i = 0; i < len; i++) sum = (sum + ((bytes[i] * (i + 1)) % 251)) % 251;

  const call = codec.call(bytes);
  const [T, V, N] = preludeNames(seen + call, 3);

  // Both numbers are carried as a sum of two unrelated parts.
  const lenA = 1 + randInt(len - 1);
  const lenExpr = `(${lenA}+${len - lenA})`;
  let sumExpr = String(sum);
  if (sum > 2) {
    const sumA = 1 + randInt(sum - 1);
    sumExpr = `(${sumA}+${sum - sumA})`;
  }

  return (
    `local ${V}=${call} ` +
    `local ${T}=(function(v)local ${N}=0 for i=1,#v do ${N}=(${N}+(string.byte(v,i)*i)%251)%251 end return ${N} end)(${V}) ` +
    `if #${V}~=${lenExpr} or ${T}~=${sumExpr} then return end `
  );
}

/**
 * Real decryptions that nothing ever reads: extra payloads of random lengths,
 * so the number and shape of the payloads in the output tells a reader nothing.
 */
function decoyPayloads(codec) {
  const count = 5 + randInt(5);
  const holes = [];
  for (let i = 0; i < count; i++) {
    const bytes = [];
    const len = 3 + randInt(22);
    for (let k = 0; k < len; k++) bytes.push(randInt(256));
    holes.push(codec.call(bytes));
  }
  const names = holes.map((_, i) => '_' + MANGLED_POOL[randInt(MANGLED_POOL.length)] + i);
  return (
    `;(function()local ${names.join(',')}=${holes.join(',')} ` +
    `if #${names[0]}<0 then return ${names[0]} end end)() `
  );
}

/** A few distinct, name-mangled identifiers that never occur in the script. */
function preludeNames(source, count) {
  const names = [];
  for (let i = 0; i < count; i++) {
    let name = randomName(source);
    while (names.includes(name)) name = randomName(source + names.join(''));
    names.push(name);
  }
  return names;
}

/* ------------------------------------------------------------------ */
/* the decoder VM: a custom instruction set with shuffled opcodes      */
/* ------------------------------------------------------------------ */

const VM_OPS = [
  'PUSH', 'K', 'LOAD', 'STORE', 'ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'BAND',
  'BXOR', 'RSH', 'LSH', 'IDX', 'SIDX', 'NEW', 'LEN', 'LT', 'LE', 'EQ',
  'JMP', 'JZ', 'BYTE', 'SUBSTR', 'CHR', 'CAT', 'TC', 'RET', 'NOP',
];

/**
 * The instruction stream that turns one payload back into bytes: parse the two
 * digit characters per byte, then walk the body and undo the S-box keystream,
 * then strip the padding. Instructions are (opcode, operand) pairs with
 * symbolic labels; vmPrelude() renumbers the opcodes and packs the numbers into
 * a string, so in the output the algorithm exists only as data.
 */
function decoderProgram() {
  const prog = [];
  const labels = {};
  const pending = [];
  const emit = (op, a = 0) => prog.push([op, a]);
  const label = (name) => {
    labels[name] = prog.length + 1;
  };
  const jump = (op, name) => {
    pending.push([prog.length, name]);
    emit(op, 0);
  };

  // value of one payload digit: digit(2i-1) or digit(2i), i being local 5
  const digit = (low) => {
    emit('K', 2); // the digit table
    emit('K', 1); // the payload itself
    emit('LOAD', 5);
    emit('PUSH', 2);
    emit('MUL');
    if (low) {
      emit('PUSH', 1);
      emit('SUB');
    }
    emit('BYTE');
    emit('IDX');
  };

  // n = #payload / 2 ; bytes = {} ; out = {} ; i = 1
  emit('K', 1);
  emit('LEN');
  emit('PUSH', 2);
  emit('DIV');
  emit('STORE', 2);
  emit('NEW');
  emit('STORE', 3);
  emit('NEW');
  emit('STORE', 4);
  emit('PUSH', 1);
  emit('STORE', 5);

  label('parse');
  emit('LOAD', 5);
  emit('LOAD', 2);
  emit('LE');
  jump('JZ', 'keyed');
  emit('LOAD', 3);
  emit('LOAD', 5);
  digit(true);
  emit('PUSH', 16);
  emit('MUL');
  digit(false);
  emit('ADD');
  emit('SIDX');
  emit('LOAD', 5);
  emit('PUSH', 1);
  emit('ADD');
  emit('STORE', 5);
  jump('JMP', 'parse');

  // j = 1 ; i = 9, the first 8 bytes are the nonce
  label('keyed');
  emit('PUSH', 1);
  emit('STORE', 7);
  emit('PUSH', 9);
  emit('STORE', 5);

  label('each');
  emit('LOAD', 5);
  emit('LOAD', 2);
  emit('LE');
  jump('JZ', 'finish');
  // key = sbox[band(bxor(bxor(band(seed + j*7, 255), nonce[j]), rshift(seed, j%16)), 255) + 1]
  emit('K', 3);
  emit('K', 4);
  emit('LOAD', 7);
  emit('K', 5);
  emit('MUL');
  emit('ADD');
  emit('PUSH', 255);
  emit('BAND');
  emit('LOAD', 3);
  emit('LOAD', 7);
  emit('PUSH', 1);
  emit('SUB');
  emit('PUSH', 8);
  emit('MOD');
  emit('PUSH', 1);
  emit('ADD');
  emit('IDX');
  emit('BXOR');
  emit('K', 4);
  emit('LOAD', 7);
  emit('K', 6);
  emit('BAND');
  emit('RSH');
  emit('BXOR');
  emit('K', 7);
  emit('BXOR');
  emit('LOAD', 11);
  emit('BXOR');
  emit('PUSH', 255);
  emit('BAND');
  emit('PUSH', 1);
  emit('ADD');
  emit('IDX');
  emit('STORE', 8);
  // out[j] = string.char(bxor(bytes[i], key))
  emit('LOAD', 4);
  emit('LOAD', 7);
  emit('LOAD', 3);
  emit('LOAD', 5);
  emit('IDX');
  emit('LOAD', 8);
  emit('BXOR');
  emit('CHR');
  emit('SIDX');
  emit('LOAD', 7);
  emit('PUSH', 1);
  emit('ADD');
  emit('STORE', 7);
  emit('LOAD', 5);
  emit('PUSH', 1);
  emit('ADD');
  emit('STORE', 5);
  jump('JMP', 'each');

  // v = concat(out) ; pad = byte(v,1) or 0 ; return v:sub(2, #v - pad)
  label('finish');
  emit('LOAD', 4);
  emit('TC');
  emit('STORE', 9);
  emit('LOAD', 9);
  emit('PUSH', 1);
  emit('BYTE');
  emit('STORE', 10);
  emit('LOAD', 9);
  emit('PUSH', 2);
  emit('LOAD', 9);
  emit('LEN');
  emit('LOAD', 10);
  emit('SUB');
  emit('SUBSTR');
  emit('RET');

  for (const [at, name] of pending) prog[at][1] = labels[name];
  return prog;
}

/**
 * The Lua side of the decoder: a stack machine whose opcodes are renumbered for
 * every output, whose handlers are defined in a random order with dead ones
 * mixed in, and which reads its program from a packed string. Payloads are
 * decrypted on first use and remembered afterwards.
 */
function vmPrelude(source, decoder, alphabet, sboxPack, cipher, variant) {
  const prog = decoderProgram();
  const seen = source + decoder + alphabet + sboxPack + cipher.c + cipher.d + cipher.n;
  const [A, AM, PH, C, SP, SB, MM, SD, S, T, sp, pc, H, K, Q, P, CACHE, RUN] = preludeNames(
    seen,
    18
  );

  const order = VM_OPS.slice().sort(() => Math.random() - 0.5);
  const opcode = new Map(order.map((name, i) => [name, i + 1]));

  const stride = variant.stride;
  const cells = variant.cells; // n words per instruction cell
  const words = [];
  // Every instruction is a fixed cell: opcode, operand, then filler words.
  for (const [op, a] of prog) {
    words.push(opcode.get(op), a);
    while (words.length % stride !== 0) words.push(randInt(16));
  }
  let packed = '';
  for (const w of words) {
    const nibbles =
      cells === 3
        ? [(w >> 8) & 15, (w >> 4) & 15, w & 15]
        : [w & 15, (w >> 4) & 15, (w >> 8) & 15, (w >> 12) & 15];
    for (const d of nibbles) packed += alphabet[d];
  }

  const BODIES = {
    PUSH: `${P}(a)`,
    K: `${P}(${K}[a])`,
    LOAD: `${P}(${S}[a])`,
    STORE: `${S}[a]=${Q}()`,
    ADD: `local y=${Q}() ${P}(${Q}()+y)`,
    SUB: `local y=${Q}() ${P}(${Q}()-y)`,
    MUL: `local y=${Q}() ${P}(${Q}()*y)`,
    DIV: `local y=${Q}() ${P}(math.floor(${Q}()/y))`,
    MOD: `local y=${Q}() ${P}(${Q}()%y)`,
    BAND: `local y=${Q}() ${P}(bit32.band(${Q}(),y))`,
    BXOR: `local y=${Q}() ${P}(bit32.bxor(${Q}(),y))`,
    RSH: `local y=${Q}() ${P}(bit32.rshift(${Q}(),y))`,
    LSH: `local y=${Q}() ${P}(bit32.lshift(${Q}(),y))`,
    IDX: `local k=${Q}() local t=${Q}() ${P}(t[k])`,
    SIDX: `local v=${Q}() local k=${Q}() local t=${Q}() t[k]=v`,
    NEW: `${P}({})`,
    LEN: `local v=${Q}() ${P}(#v)`,
    LT: `local y=${Q}() local x=${Q}() ${P}(x<y)`,
    LE: `local y=${Q}() local x=${Q}() ${P}(x<=y)`,
    EQ: `local y=${Q}() local x=${Q}() ${P}(x==y)`,
    JMP: `${pc}=(a-1)*${stride}+1`,
    JZ: `if not ${Q}() then ${pc}=(a-1)*${stride}+1 end`,
    BYTE: `local i=${Q}() local s=${Q}() ${P}(string.byte(s,i) or 0)`,
    SUBSTR: `local j=${Q}() local i=${Q}() local s=${Q}() ${P}(string.sub(s,i,j))`,
    CHR: `${P}(string.char(bit32.band(${Q}(),255)))`,
    CAT: `local y=${Q}() ${P}(${Q}()..y)`,
    TC: `${P}(table.concat(${Q}()))`,
    RET: `${S}[0]=${Q}() ${pc}=0`,
    NOP: '',
  };

  const defs = [];
  for (const name of order.slice().sort(() => Math.random() - 0.5)) {
    const body = `function(a,b) ${BODIES[name]} end`;
    const wrapped = Math.random() < 0.3 ? `(function() return ${body} end)()` : body;
    defs.push(`${H}[${opcode.get(name)}]=${wrapped} `);
  }
  // A couple of dead handlers on opcodes the program never uses.
  for (let i = 0; i < 2 + randInt(2); i++) {
    const at = 1 + randInt(defs.length);
    defs.splice(at, 0, `${H}[${order.length + 1 + i}]=function(a,b) local v=${Q}() ${P}(v) end `);
  }

  const body =
    `local ${A}="${alphabet}" ` +
    `local ${AM}={} for i=1,#${A} do ${AM}[string.byte(${A},i)]=i-1 end ` +
    `local ${PH}="${packed}" ` +
    `local ${C}={} for i=1,#${PH},${cells} do ${C}[#${C}+1]=` +
    (cells === 3
      ? `${AM}[string.byte(${PH},i)]*256+${AM}[string.byte(${PH},i+1)]*16` +
        `+${AM}[string.byte(${PH},i+2)] end `
      : `${AM}[string.byte(${PH},i)]+${AM}[string.byte(${PH},i+1)]*16` +
        `+${AM}[string.byte(${PH},i+2)]*256+${AM}[string.byte(${PH},i+3)]*4096 end `) +
    `local ${SP}="${sboxPack}" local ${SB}={} for i=1,#${SP},2 do ` +
    `${SB}[#${SB}+1]=${AM}[string.byte(${SP},i)]*16+${AM}[string.byte(${SP},i+1)] end ` +
    `local ${MM}=function(a,b,m) local r=0 while b>0 do if b%2==1 then r=(r+a)%m end ` +
    `a=(a*2)%m b=math.floor(b/2) end return r end ` +
    `local ${SD}=(function(c,d,n) local r=1 c=c%n while d>0 do if d%2==1 then ` +
    `r=${MM}(r,c,n) end c=${MM}(c,c,n) d=math.floor(d/2) end ` +
    `local x=r%2147483647 if x<=0 then x=x+2147483646 end return x end)` +
    `(${cipher.c},${cipher.d},${cipher.n}) ` +
    `local ${S}={} local ${T}={} local ${CACHE}={} ` +
    `local ${sp}=0 local ${pc}=1 local ${K}={false,${AM},${SB},${SD},` +
    `${cipher.mult},${cipher.shift},${cipher.salt}} ` +
    `local ${Q}=function() local v=${T}[${sp}] ${T}[${sp}]=nil ${sp}=${sp}-1 return v end ` +
    `local ${P}=function(v) ${sp}=${sp}+1 ${T}[${sp}]=v end ` +
    `local ${H}={} ` +
    defs.join('') +
    `local ${RUN}=function(s,l) ` +
    `if type(s)=="table" then local r={} for u=#s,1,-1 do r[#r+1]=s[u] end s=table.concat(r) end ` +
    `local hit=${CACHE}[s] if hit then return hit end ` +
    `${S}[11]=l or 0 ${K}[1]=s ${sp}=0 ${pc}=1 ` +
    `while ${pc}~=0 do local h=${H}[${C}[${pc}]] if h==nil then break end ` +
    `${pc}=${pc}+${stride} h(${C}[${pc}-${stride - 1}],${C}[${pc}-${stride - 2}]) end ` +
    `local v=${S}[0] ${CACHE}[s]=v return v end ` +
    `local ${decoder}=${RUN} `;
  // The interpreter's tables and counters only ever serve the decoder, so they
  // live in their own function: otherwise they would sit in the chunk's scope
  // and eat into the 200 locals Luau allows per function, which large scripts
  // need for themselves.
  return `local ${decoder}=(function() ${body} return ${decoder} end)() `;
}

/* ------------------------------------------------------------------ */
/* the obfuscator                                                      */
/* ------------------------------------------------------------------ */

/* ================================================================== */
/* whole-program virtual machine                                       */
/*                                                                     */
/* A narrow Luau compiler. Everything it understands is turned into     */
/* register bytecode and executed by an interpreter whose instruction   */
/* stream is decrypted one instruction at a time, keyed by the previous */
/* instruction and seeded by the integrity gate. Anything it does not   */
/* understand throws VmUnsupported and the caller falls back to the      */
/* plain token pipeline, so behaviour is never at risk.                 */
/* ================================================================== */

class VmUnsupported extends Error {}

function vfail(what) {
  throw new VmUnsupported(what);
}

function latin1(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

const LUA_MULTI_OPS = ['..=', '//=', '...', '..', '==', '~=', '<=', '>=', '//', '::', '+=', '-=', '*=', '/=', '%=', '^='];

/** `x op= y` operators, longest first so `//=` never reads as `//` + `=`. */
const COMPOUND_ASSIGN_OPS = ['+=', '-=', '*=', '/=', '//=', '%=', '^=', '..='];

/** Significant tokens with decoded string bytes. */
function luaTokens(src) {
  const out = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (WS_CHARS.includes(ch)) {
      i++;
      continue;
    }
    if (ch === '-' && src[i + 1] === '-') {
      const long = matchLongBracket(src, i + 2);
      if (long) {
        i = long.end;
        continue;
      }
      const e = src.indexOf('\n', i);
      i = e < 0 ? n : e;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const parsed = parseShortString(src, i);
      if (!parsed || typeof parsed.end !== 'number') vfail('string');
      out.push({ k: 'str', bytes: parsed.bytes, v: latin1(parsed.bytes) });
      i = parsed.end;
      continue;
    }
    if (ch === '[') {
      const long = matchLongBracket(src, i);
      if (long) {
        let content = src.slice(long.contentStart, long.contentEnd);
        if (content.startsWith('\r\n')) content = content.slice(2);
        else if (content.startsWith('\n')) content = content.slice(1);
        out.push({ k: 'str', bytes: [...encoder.encode(content)], v: content });
        i = long.end;
        continue;
      }
    }
    if (ch === '`') vfail('interpolation');
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = NUMBER_LITERAL.exec(src.slice(i));
      if (!m) vfail('number');
      out.push({ k: 'num', v: m[0] });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      out.push({ k: 'name', v: src.slice(i, j) });
      i = j;
      continue;
    }
    const three = src.slice(i, i + 3);
    if (LUA_MULTI_OPS.includes(three)) {
      out.push({ k: 'op', v: three });
      i += 3;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (LUA_MULTI_OPS.includes(two)) {
      out.push({ k: 'op', v: two });
      i += 2;
      continue;
    }
    out.push({ k: 'op', v: ch });
    i += 1;
  }
  out.push({ k: 'eof', v: '<eof>' });
  return out;
}

const VM_BIN = {
  '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '//': 'IDIV', '%': 'MOD', '^': 'POW', '..': 'CAT',
  '==': 'EQ', '~=': 'NE', '<': 'LT', '<=': 'LE', '>': 'GT', '>=': 'GE',
};

const VM_PREC = {
  or: 1, and: 2, '==': 3, '~=': 3, '<': 3, '>': 3, '<=': 3, '>=': 3,
  '..': 4, '+': 5, '-': 5, '*': 6, '/': 6, '//': 6, '%': 6, '^': 8,
};

const STOP_WORDS = new Set(['end', 'else', 'elseif', 'until']);

// Keywords that can never be part of a type, so a type annotation ends there.
const TYPE_STOP = new Set([
  'end', 'else', 'elseif', 'until', 'return', 'local', 'if', 'for', 'while',
  'repeat', 'do', 'break', 'continue', 'function', 'goto',
]);

class LuaParser {
  constructor(tokens, onFunction) {
    this.t = tokens;
    this.i = 0;
    this.onFunction = onFunction;
  }
  tok(o = 0) {
    const j = this.i + o;
    return j < this.t.length ? this.t[j] : this.t[this.t.length - 1];
  }
  at(op) {
    const t = this.tok();
    return t.k === 'op' && t.v === op;
  }
  atKw(w) {
    const t = this.tok();
    return t.k === 'name' && t.v === w;
  }
  next() {
    const t = this.tok();
    if (this.i < this.t.length) this.i++;
    return t;
  }
  need(op) {
    if (!this.at(op)) vfail('expected ' + op + ' near ' + this.tok().v);
    this.i++;
  }
  needKw(w) {
    if (!this.atKw(w)) vfail('expected ' + w);
    this.i++;
  }
  needName() {
    const t = this.tok();
    if (t.k !== 'name' || KEYWORDS.has(t.v)) vfail('expected a name');
    this.i++;
    return t.v;
  }
  /** Type annotations: consume without understanding them. */
  skipType() {
    let depth = 0;
    for (;;) {
      const t = this.tok();
      if (t.k === 'eof') vfail('type');
      if (depth === 0) {
        if (t.k === 'op' && [',', ')', '=', ';', ']', '}'].includes(t.v)) return;
        if (t.k === 'name' && TYPE_STOP.has(t.v)) return;
      }
      if (t.k === 'op' && ['{', '(', '[', '<'].includes(t.v)) depth++;
      if (t.k === 'op' && ['}', ')', ']', '>'].includes(t.v)) depth--;
      this.i++;
    }
  }
  skipAngles() {
    let depth = 0;
    for (;;) {
      const t = this.tok();
      if (t.k === 'eof') vfail('generics');
      if (t.k === 'op' && t.v === '<') depth++;
      if (t.k === 'op' && t.v === '>') {
        depth--;
        this.i++;
        if (depth === 0) return;
        continue;
      }
      this.i++;
    }
  }
  nameList() {
    const names = [];
    for (;;) {
      const name = this.needName();
      if (this.at('<')) this.skipAngles();
      if (this.at(':')) {
        this.i++;
        this.skipType();
      }
      names.push(name);
      if (this.at(',')) {
        this.i++;
        continue;
      }
      return names;
    }
  }
  exprList() {
    const list = [this.expr()];
    while (this.at(',')) {
      this.i++;
      list.push(this.expr());
    }
    return list;
  }
  block() {
    const stmts = [];
    for (;;) {
      const t = this.tok();
      if (t.k === 'eof') break;
      if (t.k === 'op' && t.v === ';') {
        this.i++;
        continue;
      }
      if (t.k === 'name' && STOP_WORDS.has(t.v)) break;
      const st = this.statement();
      stmts.push(st);
      if (st.type === 'Return' || st.type === 'Break' || st.type === 'Continue') break;
    }
    return stmts;
  }
  funcBody(isMethod) {
    if (this.at('<')) this.skipAngles();
    this.need('(');
    const params = [];
    let isVararg = false;
    if (!this.at(')')) {
      for (;;) {
        if (this.at('...')) {
          this.i++;
          isVararg = true;
          break;
        }
        const name = this.needName();
        if (this.at(':')) {
          this.i++;
          this.skipType();
        }
        params.push(name);
        if (this.at(',')) {
          this.i++;
          continue;
        }
        break;
      }
    }
    this.need(')');
    if (this.at(':')) {
      this.i++;
      this.skipType();
    }
    if (isMethod) params.unshift('self');
    const body = this.block();
    this.needKw('end');
    return this.onFunction({ params, isVararg, body });
  }
  statement() {
    const t = this.tok();
    if (t.k === 'name') {
      if (t.v === 'local') {
        this.i++;
        if (this.atKw('function')) {
          this.i++;
          const name = this.needName();
          return { type: 'LocalFunc', name, func: this.funcBody(false) };
        }
        const names = this.nameList();
        let exprs = [];
        if (this.at('=')) {
          this.i++;
          exprs = this.exprList();
        }
        return { type: 'Local', names, exprs };
      }
      if (t.v === 'if') {
        this.i++;
        const clauses = [{ cond: this.expr(), body: null }];
        this.needKw('then');
        clauses[0].body = this.block();
        let elseBody = null;
        for (;;) {
          if (this.atKw('elseif')) {
            this.i++;
            const cond = this.expr();
            this.needKw('then');
            clauses.push({ cond, body: this.block() });
            continue;
          }
          if (this.atKw('else')) {
            this.i++;
            elseBody = this.block();
          }
          break;
        }
        this.needKw('end');
        return { type: 'If', clauses, elseBody };
      }
      if (t.v === 'while') {
        this.i++;
        const cond = this.expr();
        this.needKw('do');
        const body = this.block();
        this.needKw('end');
        return { type: 'While', cond, body };
      }
      if (t.v === 'repeat') {
        this.i++;
        const body = this.block();
        this.needKw('until');
        return { type: 'Repeat', body, cond: this.expr() };
      }
      if (t.v === 'for') {
        this.i++;
        const first = this.needName();
        if (this.at('=')) {
          this.i++;
          const start = this.expr();
          this.need(',');
          const limit = this.expr();
          let step = null;
          if (this.at(',')) {
            this.i++;
            step = this.expr();
          }
          this.needKw('do');
          const body = this.block();
          this.needKw('end');
          return { type: 'NumFor', name: first, start, limit, step, body };
        }
        const names = [first];
        while (this.at(',')) {
          this.i++;
          names.push(this.needName());
        }
        this.needKw('in');
        const exprs = this.exprList();
        this.needKw('do');
        const body = this.block();
        this.needKw('end');
        return { type: 'GenFor', names, exprs, body };
      }
      if (t.v === 'do') {
        this.i++;
        const body = this.block();
        this.needKw('end');
        return { type: 'Do', body };
      }
      if (t.v === 'function') {
        this.i++;
        const path = [this.needName()];
        let isMethod = false;
        for (;;) {
          if (this.at('.')) {
            this.i++;
            path.push(this.needName());
            continue;
          }
          if (this.at(':')) {
            this.i++;
            path.push(this.needName());
            isMethod = true;
          }
          break;
        }
        const func = this.funcBody(isMethod);
        return { type: 'FuncStat', path, isMethod, func };
      }
      if (t.v === 'return') {
        this.i++;
        let exprs = [];
        const nt = this.tok();
        const ends =
          nt.k === 'eof' ||
          (nt.k === 'op' && [';', ')', ']', '}'].includes(nt.v)) ||
          (nt.k === 'name' && STOP_WORDS.has(nt.v));
        if (!ends) exprs = this.exprList();
        if (this.at(';')) this.i++;
        return { type: 'Return', exprs };
      }
      if (t.v === 'break') {
        this.i++;
        return { type: 'Break' };
      }
      if (t.v === 'continue') {
        this.i++;
        return { type: 'Continue' };
      }
      if (t.v === 'goto') vfail('goto');
    }
    if (t.k === 'op' && t.v === '::') vfail('label');
    const first = this.suffixed();
    const targets = [first];
    while (this.at(',')) {
      this.i++;
      targets.push(this.suffixed());
    }
    const op = this.tok();
    if (op.k === 'op' && op.v === '=') {
      this.i++;
      return { type: 'Assign', targets, exprs: this.exprList() };
    }
    if (op.k === 'op' && COMPOUND_ASSIGN_OPS.includes(op.v)) {
      if (targets.length !== 1) vfail('compound assignment');
      this.i++;
      const value = this.expr();
      // Kept as its own node: `x op= y` evaluates the target (and any index
      // expression) exactly once, which desugaring to `x = x op y` would not.
      return { type: 'Compound', target: targets[0], op: op.v.slice(0, -1), value };
    }
    if (first.type !== 'Call') vfail('statement');
    return { type: 'CallStat', call: first };
  }
  expr() {
    return this.binary(1);
  }
  binary(minPrec) {
    let left = this.unary();
    for (;;) {
      const t = this.tok();
      let op = null;
      if (t.k === 'op' && VM_PREC[t.v]) op = t.v;
      else if (t.k === 'name' && (t.v === 'and' || t.v === 'or')) op = t.v;
      if (!op) return left;
      const prec = VM_PREC[op];
      if (prec < minPrec) return left;
      this.i++;
      const right = this.binary(op === '^' || op === '..' ? prec : prec + 1);
      left = { type: 'Bin', op, l: left, r: right };
    }
  }
  unary() {
    const t = this.tok();
    if (t.k === 'op' && (t.v === '-' || t.v === '#')) {
      this.i++;
      return { type: 'Un', op: t.v, e: this.binary(7) };
    }
    if (t.k === 'name' && t.v === 'not') {
      this.i++;
      return { type: 'Un', op: 'not', e: this.binary(7) };
    }
    return this.suffixed();
  }
  primary() {
    const t = this.tok();
    if (t.k === 'num') {
      this.i++;
      return { type: 'Number', text: t.v };
    }
    if (t.k === 'str') {
      this.i++;
      return { type: 'String', bytes: t.bytes, v: t.v };
    }
    if (t.k === 'name') {
      if (t.v === 'nil') {
        this.i++;
        return { type: 'Nil' };
      }
      if (t.v === 'true' || t.v === 'false') {
        this.i++;
        return { type: t.v === 'true' ? 'True' : 'False' };
      }
      if (t.v === 'function') {
        this.i++;
        return { type: 'Function', func: this.funcBody(false) };
      }
      if (t.v === 'if') vfail('if expression');
      if (t.v === 'not' || KEYWORDS.has(t.v)) vfail('keyword ' + t.v);
      this.i++;
      return { type: 'Name', name: t.v };
    }
    if (t.k === 'op') {
      if (t.v === '(') {
        this.i++;
        const e = this.expr();
        this.need(')');
        return { type: 'Paren', e };
      }
      if (t.v === '...') {
        this.i++;
        return { type: 'Vararg' };
      }
      if (t.v === '{') return this.table();
    }
    vfail('expression near ' + t.v);
  }
  callArgs() {
    if (this.at('(')) {
      this.i++;
      const args = this.at(')') ? [] : this.exprList();
      this.need(')');
      return args;
    }
    const t = this.tok();
    if (t.k === 'str') {
      this.i++;
      return [{ type: 'String', bytes: t.bytes, v: t.v }];
    }
    if (this.at('{')) return [this.table()];
    vfail('call arguments');
  }
  suffixed() {
    let e = this.primary();
    for (;;) {
      if (this.at('.')) {
        this.i++;
        const name = this.needName();
        e = {
          type: 'Index',
          obj: e,
          key: { type: 'String', bytes: [...encoder.encode(name)], v: name },
        };
        continue;
      }
      if (this.at('[')) {
        this.i++;
        const key = this.expr();
        this.need(']');
        e = { type: 'Index', obj: e, key };
        continue;
      }
      if (this.at(':')) {
        this.i++;
        const name = this.needName();
        const args = this.callArgs();
        const fn = {
          type: 'Index',
          obj: e,
          key: { type: 'String', bytes: [...encoder.encode(name)], v: name },
        };
        e = { type: 'Call', fn, args, recv: e, method: true };
        continue;
      }
      if (this.at('(') || this.at('{') || this.tok().k === 'str') {
        const args = this.callArgs();
        e = { type: 'Call', fn: e, args, method: false };
        continue;
      }
      if (this.at('::')) {
        this.i++;
        this.skipType();
        continue;
      }
      return e;
    }
  }
  table() {
    this.need('{');
    const fields = [];
    while (!this.at('}')) {
      if (this.at('[')) {
        this.i++;
        const key = this.expr();
        this.need(']');
        this.need('=');
        fields.push({ kind: 'keyed', key, value: this.expr() });
      } else if (this.tok().k === 'name' && this.tok(1).k === 'op' && this.tok(1).v === '=') {
        const name = this.next().v;
        this.i++;
        fields.push({
          kind: 'keyed',
          key: { type: 'String', bytes: [...encoder.encode(name)], v: name },
          value: this.expr(),
        });
      } else {
        fields.push({ kind: 'pos', value: this.expr() });
      }
      if (this.at(',') || this.at(';')) {
        this.i++;
        continue;
      }
      break;
    }
    this.need('}');
    return { type: 'Table', fields };
  }
}

const isMultret = (node) => node.type === 'Call' || node.type === 'Vararg';

/** One compiled function: instruction list plus its locals, upvalues and constants. */
class ProtoBuilder {
  constructor(root, parent, params, isVararg) {
    this.root = root;
    this.parent = parent;
    this.params = params;
    this.isVararg = isVararg;
    this.code = [];
    this.k = [];
    this.kmap = new Map();
    this.ups = [];
    this.upIndex = new Map();
    this.scopes = [new Map()];
    this.nslots = 1;
    this.maxSlot = 1;
    this.tmpBase = 1;
    this.tmpUsed = 0;
    this.breaks = [];
    this.continues = [];
    for (const p of params) this.scopes[0].set(p, this.newSlot());
  }
  emit(op, a = 0, b = 0, c = 0) {
    this.code.push({ op, a, b, c });
    return this.code.length;
  }
  here() {
    return this.code.length + 1;
  }
  allocBlock(n) {
    const s = Math.max(this.tmpBase, this.nslots) + this.tmpUsed;
    this.tmpUsed += n;
    const last = s + n - 1;
    if (last > 240) vfail('too many registers');
    if (last > this.maxSlot) this.maxSlot = last;
    return s;
  }
  allocTmp() {
    return this.allocBlock(1);
  }
  newSlot() {
    const s = this.nslots++;
    if (s > 200) vfail('too many locals');
    if (s > this.maxSlot) this.maxSlot = s;
    return s;
  }
  temps() {
    this.tmpBase = this.nslots;
    this.tmpUsed = 0;
  }
  constStr(bytes) {
    const key = 's' + latin1(bytes);
    if (this.kmap.has(key)) return this.kmap.get(key);
    const idx = this.k.length + 1;
    this.k.push({ kind: 'str', bytes });
    this.kmap.set(key, idx);
    return idx;
  }
  constNum(text) {
    const key = 'n' + text;
    if (this.kmap.has(key)) return this.kmap.get(key);
    const idx = this.k.length + 1;
    if (idx > 16383) vfail('too many constants');
    this.k.push({ kind: 'num', text });
    this.kmap.set(key, idx);
    return idx;
  }
  findLocal(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const m = this.scopes[i];
      if (m.has(name)) return m.get(name);
    }
    return 0;
  }
  /**
   * Makes sure this function holds an upvalue for `name`, threading it through
   * every function in between, and returns its 1-based slot or 0.
   */
  capture(name) {
    if (!this.upIndex) this.upIndex = new Map();
    if (this.upIndex.has(name)) return this.upIndex.get(name) + 1;
    if (!this.parent) return 0;
    const local = this.parent.findLocal(name);
    if (local) {
      this.ups.push(local);
      this.upIndex.set(name, this.ups.length - 1);
      return this.ups.length;
    }
    const deep = this.parent.capture(name);
    if (!deep) return 0;
    this.ups.push(-deep);
    this.upIndex.set(name, this.ups.length - 1);
    return this.ups.length;
  }
  resolve(name) {
    const local = this.findLocal(name);
    if (local) return { kind: 'local', slot: local };
    if (this.parent) {
      const up = this.capture(name);
      if (up) return { kind: 'up', index: up - 1 };
    }
    return { kind: 'global' };
  }
  pushScope() {
    this.scopes.push(new Map());
  }
  popScope() {
    this.scopes.pop();
  }
  declare(name, slot) {
    this.scopes[this.scopes.length - 1].set(name, slot);
  }
  compileChild(fnNode) {
    const child = new ProtoBuilder(
      this.root,
      this,
      fnNode.params,
      fnNode.isVararg,
    );
    for (const st of fnNode.body) child.stmt(st);
    return child.finish();
  }
  finish() {
    // Falling off the end of a body returns nothing; a jump to the end of the
    // body lands here too.
    this.code.push({ op: 'RET0', a: 0, b: 0, c: 0 });
    const proto = {
      code: this.code,
      k: this.k,
      nslots: this.maxSlot,
      nparams: this.params.length,
      vararg: this.isVararg,
      ups: this.ups,
    };
    // 1-based, because the generated Lua table is indexed from 1.
    return this.root.protos.push(proto);
  }
  /* ---------------------------- statements --------------------------- */
  stmt(node) {
    this.temps();
    switch (node.type) {
      case 'Local':
        return this.localStat(node);
      case 'Assign':
        return this.assignStat(node);
      case 'Compound':
        return this.compoundStat(node);
      case 'CallStat': {
        const t = this.allocTmp();
        this.expr(node.call, t);
        return;
      }
      case 'Do':
        this.pushScope();
        for (const st of node.body) this.stmt(st);
        this.popScope();
        return;
      case 'If':
        return this.ifStat(node);
      case 'While':
        return this.whileStat(node);
      case 'Repeat':
        return this.repeatStat(node);
      case 'NumFor':
        return this.numForStat(node);
      case 'GenFor':
        return this.genForStat(node);
      case 'Return':
        return this.returnStat(node);
      case 'Break': {
        if (!this.breaks.length) vfail('break');
        this.emit('JMP', -1);
        this.breaks[this.breaks.length - 1].push(this.code.length - 1);
        return;
      }
      case 'Continue': {
        if (!this.continues.length) vfail('continue');
        this.emit('JMP', -1);
        this.continues[this.continues.length - 1].push(this.code.length - 1);
        return;
      }
      case 'LocalFunc': {
        const slot = this.newSlot();
        this.emit('NEWC', slot);
        this.declare(node.name, slot);
        const idx = this.compileChild(node.func);
        const t = this.allocTmp();
        this.emit('CLOSURE', t, idx);
        this.emit('LSET', slot, t);
        return;
      }
      case 'FuncStat': {
        const func = node.func;
        const idx = this.compileChild(func);
        const t = this.allocTmp();
        this.emit('CLOSURE', t, idx);
        if (node.path.length === 1) {
          const r = this.resolve(node.path[0]);
          if (r.kind === 'local') this.emit('LSET', r.slot, t);
          else if (r.kind === 'up') this.emit('USET', r.index, t);
          else this.emit('SETG', this.constStr([...encoder.encode(node.path[0])]), t);
          return;
        }
        let objTmp = this.allocTmp();
        this.expr({ type: 'Name', name: node.path[0] }, objTmp);
        for (let i = 1; i < node.path.length - 1; i++) {
          const next = this.allocTmp();
          this.emit('GETS', next, objTmp, this.constStr([...encoder.encode(node.path[i])]));
          objTmp = next;
        }
        this.emit(
          'SETS',
          objTmp,
          this.constStr([...encoder.encode(node.path[node.path.length - 1])]),
          t,
        );
        return;
      }
      default:
        vfail('statement ' + node.type);
    }
  }
  localStat(node) {
    const slots = node.names.map(() => this.newSlot());
    this.temps();
    const vals = [];
    const exprs = node.exprs;
    for (let i = 0; i < exprs.length; i++) {
      const isLast = i === exprs.length - 1;
      const t = this.allocTmp();
      if (isLast && isMultret(exprs[i]) && i < slots.length) {
        this.multi(exprs[i], t);
        vals.push({ packed: t, at: i });
      } else {
        this.expr(exprs[i], t);
        vals.push({ t });
      }
    }
    let spread = null;
    for (const v of vals) if (v && v.packed !== undefined) spread = v;
    for (let i = 0; i < slots.length; i++) {
      this.emit('NEWC', slots[i]);
      const v = vals[i];
      if (v) {
        if (v.packed !== undefined) {
          const one = this.allocTmp();
          this.emit('IDXK', one, v.packed, 1);
          this.emit('LSET', slots[i], one);
        } else {
          this.emit('LSET', slots[i], v.t);
        }
      } else if (spread && i > spread.at) {
        const one = this.allocTmp();
        this.emit('IDXK', one, spread.packed, i - spread.at + 1);
        this.emit('LSET', slots[i], one);
      }
    }
    for (let i = 0; i < node.names.length; i++) this.declare(node.names[i], slots[i]);
  }
  targetRef(t) {
    if (t.type === 'Name') {
      const r = this.resolve(t.name);
      if (r.kind === 'local') return { kind: 'local', slot: r.slot };
      if (r.kind === 'up') return { kind: 'up', index: r.index };
      return { kind: 'global', kidx: this.constStr([...encoder.encode(t.name)]) };
    }
    if (t.type === 'Index') {
      const obj = this.allocTmp();
      this.expr(t.obj, obj);
      if (t.key.type === 'String') {
        return { kind: 'indexS', obj, kidx: this.constStr(t.key.bytes) };
      }
      const key = this.allocTmp();
      this.expr(t.key, key);
      return { kind: 'index', obj, key };
    }
    vfail('assignment target');
  }
  /** `x op= y`: the target is resolved once, read, combined, then written. */
  compoundStat(node) {
    const ref = this.targetRef(node.target);
    const cur = this.allocTmp();
    if (ref.kind === 'local') this.emit('LGET', cur, ref.slot);
    else if (ref.kind === 'up') this.emit('UGET', cur, ref.index);
    else if (ref.kind === 'global') this.emit('GETG', cur, ref.kidx);
    else if (ref.kind === 'indexS') this.emit('GETS', cur, ref.obj, ref.kidx);
    else this.emit('GET', cur, ref.obj, ref.key);
    const rhs = this.allocTmp();
    this.expr(node.value, rhs);
    const out = this.allocTmp();
    const opName = VM_BIN[node.op];
    if (!opName) vfail('compound operator ' + node.op);
    this.emit(opName, out, cur, rhs);
    if (ref.kind === 'local') this.emit('LSET', ref.slot, out);
    else if (ref.kind === 'up') this.emit('USET', ref.index, out);
    else if (ref.kind === 'global') this.emit('SETG', ref.kidx, out);
    else if (ref.kind === 'indexS') this.emit('SETS', ref.obj, ref.kidx, out);
    else this.emit('SET', ref.obj, ref.key, out);
  }
  assignStat(node) {
    const refs = node.targets.map((t) => this.targetRef(t));
    const vals = [];
    const exprs = node.exprs;
    for (let i = 0; i < exprs.length; i++) {
      const isLast = i === exprs.length - 1;
      const t = this.allocTmp();
      if (isLast && isMultret(exprs[i]) && i < refs.length) {
        this.multi(exprs[i], t);
        vals.push({ packed: t });
      } else {
        this.expr(exprs[i], t);
        vals.push({ t });
      }
    }
    let spread = null;
    for (let k = 0; k < vals.length; k++) if (vals[k] && vals[k].packed !== undefined) spread = { ...vals[k], at: k };
    for (let i = 0; i < refs.length; i++) {
      const v = vals[i];
      let src;
      if (v) {
        if (v.packed !== undefined) {
          const one = this.allocTmp();
          this.emit('IDXK', one, v.packed, 1);
          src = one;
        } else {
          src = v.t;
        }
      } else if (spread && i > spread.at) {
        const one = this.allocTmp();
        this.emit('IDXK', one, spread.packed, i - spread.at + 1);
        src = one;
      } else {
        continue;
      }
      const ref = refs[i];
      if (ref.kind === 'local') this.emit('LSET', ref.slot, src);
      else if (ref.kind === 'up') this.emit('USET', ref.index, src);
      else if (ref.kind === 'global') this.emit('SETG', ref.kidx, src);
      else if (ref.kind === 'indexS') this.emit('SETS', ref.obj, ref.kidx, src);
      else this.emit('SET', ref.obj, ref.key, src);
    }
  }
  ifStat(node) {
    const endJumps = [];
    for (const clause of node.clauses) {
      const c = this.allocTmp();
      this.expr(clause.cond, c);
      this.emit('JF', c, -2);
      const skip = this.code.length - 1;
      this.pushScope();
      for (const st of clause.body) this.stmt(st);
      this.popScope();
      this.emit('JMP', -1);
      endJumps.push(this.code.length - 1);
      this.code[skip].b = this.here();
    }
    if (node.elseBody) {
      this.pushScope();
      for (const st of node.elseBody) this.stmt(st);
      this.popScope();
    }
    const end = this.here();
    for (const j of endJumps) this.code[j].a = end;
  }
  loopBody(body) {
    this.breaks.push([]);
    this.continues.push([]);
    this.pushScope();
    for (const st of body) this.stmt(st);
    this.popScope();
    return { breaks: this.breaks.pop(), continues: this.continues.pop() };
  }
  whileStat(node) {
    const top = this.here();
    const c = this.allocTmp();
    this.expr(node.cond, c);
    this.emit('JF', c, -2);
    const exit = this.code.length - 1;
    const loop = this.loopBody(node.body);
    const cont = this.here();
    this.emit('JMP', top);
    const end = this.here();
    this.code[exit].b = end;
    for (const j of loop.breaks) this.code[j].a = end;
    for (const j of loop.continues) this.code[j].a = cont;
  }
  repeatStat(node) {
    const top = this.here();
    this.pushScope();
    this.breaks.push([]);
    this.continues.push([]);
    for (const st of node.body) this.stmt(st);
    this.temps();
    const cont = this.here();
    const c = this.allocTmp();
    this.expr(node.cond, c);
    this.emit('JF', c, top);
    const end = this.here();
    this.popScope();
    for (const j of this.breaks.pop()) this.code[j].a = end;
    for (const j of this.continues.pop()) this.code[j].a = cont;
  }
  numForStat(node) {
    this.pushScope();
    // Loop state lives in slots, not temporaries: temporaries are reused by
    // every statement and would be clobbered by the body.
    const slot = this.newSlot();
    const limS = this.newSlot();
    const stepS = this.newSlot();
    const start = this.allocTmp();
    this.expr(node.start, start);
    const limT = this.allocTmp();
    this.expr(node.limit, limT);
    const stepT = this.allocTmp();
    if (node.step) this.expr(node.step, stepT);
    else this.emit('KON', stepT, this.constNum('1'));
    this.emit('NEWC', slot);
    this.emit('LSET', slot, start);
    this.emit('NEWC', limS);
    this.emit('LSET', limS, limT);
    this.emit('NEWC', stepS);
    this.emit('LSET', stepS, stepT);
    this.declare(node.name, slot);
    this.emit('JMP', -1);
    const checkJump = this.code.length - 1;
    const bodyTop = this.here();
    const loop = this.loopBody(node.body);
    const cont = this.here();
    const iv = this.allocTmp();
    this.emit('LGET', iv, slot);
    const stv = this.allocTmp();
    this.emit('LGET', stv, stepS);
    const sum = this.allocTmp();
    this.emit('ADD', sum, iv, stv);
    this.emit('LSET', slot, sum);
    const check = this.here();
    this.code[checkJump].a = check;
    const stv2 = this.allocTmp();
    this.emit('LGET', stv2, stepS);
    const zero = this.allocTmp();
    this.emit('KON', zero, this.constNum('0'));
    const pos = this.allocTmp();
    this.emit('GT', pos, stv2, zero);
    this.emit('JF', pos, -2);
    const negAt = this.code.length - 1;
    const iv2 = this.allocTmp();
    this.emit('LGET', iv2, slot);
    const limA = this.allocTmp();
    this.emit('LGET', limA, limS);
    const le = this.allocTmp();
    this.emit('LE', le, iv2, limA);
    this.emit('JT', le, bodyTop);
    this.emit('JMP', -1);
    const doneAt = this.code.length - 1;
    this.code[negAt].b = this.here();
    const iv3 = this.allocTmp();
    this.emit('LGET', iv3, slot);
    const limB = this.allocTmp();
    this.emit('LGET', limB, limS);
    const ge = this.allocTmp();
    this.emit('GE', ge, iv3, limB);
    this.emit('JT', ge, bodyTop);
    const end = this.here();
    this.code[doneAt].a = end;
    for (const j of loop.breaks) this.code[j].a = end;
    for (const j of loop.continues) this.code[j].a = cont;
    this.popScope();
  }
  constZeroTmp() {
    const t = this.allocTmp();
    this.emit('KON', t, this.constNum('0'));
    return t;
  }
  genForStat(node) {
    this.pushScope();
    const itS = this.newSlot();
    const stS = this.newSlot();
    const ctrlSlot = this.newSlot();
    const slots = node.names.map(() => this.newSlot());
    const exprs = node.exprs;
    // The explist is adjusted to three values, and a call in it contributes up
    // to three of them: `for k, v in pairs(t)` relies on that.
    const three = [];
    if (exprs.length === 1 && isMultret(exprs[0])) {
      const m = this.allocTmp();
      this.multi(exprs[0], m);
      for (let i = 0; i < 3; i++) {
        const t = this.allocTmp();
        this.emit('GET', t, m, this.constNumTmp(i + 1));
        three.push(t);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const t = this.allocTmp();
        if (i < exprs.length) this.expr(exprs[i], t);
        else this.emit('LNIL', t);
        three.push(t);
      }
    }
    this.emit('NEWC', itS);
    this.emit('LSET', itS, three[0]);
    this.emit('NEWC', stS);
    this.emit('LSET', stS, three[1]);
    this.emit('NEWC', ctrlSlot);
    this.emit('LSET', ctrlSlot, three[2]);
    const top = this.here();
    const base = this.allocBlock(3);
    const itv = this.allocTmp();
    this.emit('LGET', itv, itS);
    this.emit('MOV', base, itv);
    const stv = this.allocTmp();
    this.emit('LGET', stv, stS);
    this.emit('MOV', base + 1, stv);
    const ctv = this.allocTmp();
    this.emit('LGET', ctv, ctrlSlot);
    this.emit('MOV', base + 2, ctv);
    this.emit('CALL', base, 2);
    const m = base;
    const k0 = this.allocTmp();
    this.emit('ONE', k0, m);
    const nul = this.allocTmp();
    this.emit('LNIL', nul);
    const isNil = this.allocTmp();
    this.emit('EQ', isNil, k0, nul);
    this.emit('JT', isNil, -2);
    const exit = this.code.length - 1;
    this.emit('LSET', ctrlSlot, k0);
    for (let i = 0; i < slots.length; i++) {
      const v = this.allocTmp();
      this.emit('GET', v, m, this.constNumTmp(i + 1));
      this.emit('NEWC', slots[i]);
      this.emit('LSET', slots[i], v);
      this.declare(node.names[i], slots[i]);
    }
    const loop = this.loopBody(node.body);
    const cont = this.here();
    this.emit('JMP', top);
    const end = this.here();
    this.code[exit].b = end;
    for (const j of loop.breaks) this.code[j].a = end;
    for (const j of loop.continues) this.code[j].a = cont;
    this.popScope();
  }
  returnStat(node) {
    const exprs = node.exprs;
    if (!exprs.length) {
      this.emit('RET0');
      return;
    }
    const base = this.allocBlock(exprs.length);
    let packedAt = -1;
    for (let i = 0; i < exprs.length; i++) {
      const t = base + i;
      if (i === exprs.length - 1 && isMultret(exprs[i])) {
        this.multi(exprs[i], t);
        packedAt = i;
      } else {
        this.expr(exprs[i], t);
      }
    }
    if (packedAt === exprs.length - 1 && exprs.length === 1) {
      this.emit('RETM', base);
      return;
    }
    if (packedAt >= 0) vfail('mixed multi-return');
    this.emit('RET', base, exprs.length);
  }
  /* --------------------------- expressions --------------------------- */
  expr(node, dest) {
    switch (node.type) {
      case 'Nil':
        this.emit('LNIL', dest);
        return;
      case 'True':
        this.emit('LTRUE', dest);
        return;
      case 'False':
        this.emit('LFALSE', dest);
        return;
      case 'Number':
        this.emit('KON', dest, this.constNum(node.text));
        return;
      case 'String':
        this.emit('KON', dest, this.constStr(node.bytes));
        return;
      case 'Vararg': {
        if (!this.isVararg) vfail('vararg outside a vararg function');
        this.emit('VARARG', dest);
        this.emit('ONE', dest, dest);
        return;
      }
      case 'Name': {
        const r = this.resolve(node.name);
        if (r.kind === 'local') this.emit('LGET', dest, r.slot);
        else if (r.kind === 'up') this.emit('UGET', dest, r.index);
        else this.emit('GETG', dest, this.constStr([...encoder.encode(node.name)]));
        return;
      }
      case 'Paren':
        this.expr(node.e, dest);
        return;
      case 'Index': {
        const obj = this.allocTmp();
        this.expr(node.obj, obj);
        if (node.key.type === 'String') {
          this.emit('GETS', dest, obj, this.constStr(node.key.bytes));
        } else {
          const key = this.allocTmp();
          this.expr(node.key, key);
          this.emit('GET', dest, obj, key);
        }
        return;
      }
      case 'Un': {
        this.expr(node.e, dest);
        if (node.op === '-') this.emit('UNM', dest, dest);
        else if (node.op === 'not') this.emit('NOT', dest, dest);
        else if (node.op === '#') this.emit('LEN', dest, dest);
        else vfail('unary ' + node.op);
        return;
      }
      case 'Bin':
        return this.binExpr(node, dest);
      case 'Table':
        return this.tableExpr(node, dest);
      case 'Call':
        // A call leaves every result packed in one table; a plain expression
        // context only wants the first.
        this.callExpr(node, dest);
        this.emit('ONE', dest, dest);
        return;
      case 'Function': {
        const idx = this.compileChild(node.func);
        this.emit('CLOSURE', dest, idx);
        return;
      }
      default:
        vfail('expression ' + node.type);
    }
  }
  binExpr(node, dest) {
    if (node.op === 'and' || node.op === 'or') {
      // `a and b` keeps a when a is falsy; `a or b` keeps a when a is truthy.
      this.expr(node.l, dest);
      this.emit(node.op === 'and' ? 'JF' : 'JT', dest, -1);
      const patch = this.code.length - 1;
      this.expr(node.r, dest);
      this.code[patch].b = this.here();
      return;
    }
    const t = this.allocTmp();
    this.expr(node.l, dest);
    this.expr(node.r, t);
    const op = VM_BIN[node.op];
    if (!op) vfail('operator ' + node.op);
    this.emit(op, dest, dest, t);
    // Commutative operations are emitted with a random operand order, so two
    // builds do not even produce the same instruction sequence for `a + b`.
    if (op === 'ADD' || op === 'MUL' || op === 'EQ' || op === 'NE') {
      if (randInt(2)) {
        const ins = this.code[this.code.length - 1];
        const swap = ins.b;
        ins.b = ins.c;
        ins.c = swap;
      }
    }
  }
  tableExpr(node, dest) {
    this.emit('NEWT', dest);
    const fields = node.fields;
    let pos = 0;
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (f.kind === 'pos') {
        pos++;
        const t = this.allocTmp();
        if (i === fields.length - 1 && isMultret(f.value)) this.multi(f.value, t);
        else this.expr(f.value, t);
        if (i === fields.length - 1 && isMultret(f.value)) {
          const q = this.allocTmp();
          this.emit('NEWT', q);
          this.emit('APP', q, t);
          const n = this.allocTmp();
          this.emit('LEN', n, q);
          const j = this.allocTmp();
          this.emit('KON', j, this.constNum('0'));
          const top = this.here();
          const cond = this.allocTmp();
          this.emit('LT', cond, j, n);
          this.emit('JF', cond, -2);
          const exit = this.code.length - 1;
          const jj = this.allocTmp();
          this.emit('ADD', jj, j, this.constOneTmp());
          this.emit('MOV', j, jj);
          const src = this.allocTmp();
          this.emit('GET', src, q, j);
          const at = this.allocTmp();
          this.emit('ADD', at, j, this.constNumTmp(pos - 1));
          this.emit('SET', dest, at, src);
          this.emit('JMP', top);
          this.code[exit].b = this.here();
        } else {
          this.emit('SI', dest, pos, t);
        }
      } else {
        const k = this.allocTmp();
        this.expr(f.key, k);
        const v = this.allocTmp();
        this.expr(f.value, v);
        this.emit('SET', dest, k, v);
      }
    }
  }
  constOneTmp() {
    const t = this.allocTmp();
    this.emit('KON', t, this.constNum('1'));
    return t;
  }
  constNumTmp(n) {
    const t = this.allocTmp();
    this.emit('KON', t, this.constNum(String(n)));
    return t;
  }
  /** All the values of a call or `...`, packed into one table. */
  multi(node, dest) {
    if (node.type === 'Call') return this.callExpr(node, dest);
    if (node.type === 'Vararg') {
      if (!this.isVararg) vfail('vararg outside a vararg function');
      return this.emit('VARARG', dest);
    }
    return this.expr(node, dest);
  }
  callExpr(node, dest) {
    const args = node.args;
    const n = args.length;
    const tail = n > 0 && isMultret(args[n - 1]);
    const fixed = tail ? n - 1 : n;
    const pre = node.method ? 1 : 0;
    // Reserve [function, self?, args...] as one contiguous run first, then fill
    // it, so anything the arguments compile to lands above it.
    const base = this.allocBlock(1 + pre + fixed);
    let argAt;
    if (node.method) {
      const obj = this.allocTmp();
      this.expr(node.recv, obj);
      this.emit('SELF', base, obj, this.constStr(node.fn.key.bytes));
      argAt = base + 2;
    } else {
      const fnTmp = this.allocTmp();
      this.expr(node.fn, fnTmp);
      this.emit('MOV', base, fnTmp);
      argAt = base + 1;
    }
    for (let i = 0; i < fixed; i++) this.expr(args[i], argAt + i);
    if (!tail) {
      this.emit('CALL', base, pre + fixed);
      this.emit('MOV', dest, base);
      return;
    }
    const packed = this.allocTmp();
    this.multi(args[n - 1], packed);
    const q = this.allocTmp();
    this.emit('NEWA', q);
    let idx = 0;
    if (pre) {
      this.emit('SIA', q, 1, base + 1);
      idx = 1;
    }
    for (let i = 0; i < fixed; i++) this.emit('SIA', q, idx + i + 1, argAt + i);
    this.emit('APPA', q, packed);
    this.emit('CALLT', base, q);
    this.emit('MOV', dest, base);
  }
}

function compileToProtos(source) {
  const tokens = luaTokens(source);
  const parser = new LuaParser(tokens, (fn) => fn);
  const body = parser.block();
  if (parser.tok().k !== 'eof') vfail('trailing tokens near ' + parser.tok().v);
  const root = { protos: [] };
  const chunk = new ProtoBuilder(root, null, [], true);
  for (const st of body) chunk.stmt(st);
  const entry = chunk.finish();
  return { protos: root.protos, entry };
}

const VM_ALPHABET_POOL = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!~';
const VM_GROUP_OFFSETS = [0, 7, 14, 21, 28, 35, 42, 49];
const VM_CODEGEN_OPS = [
  'MOV', 'LGET', 'LSET', 'UGET', 'USET', 'NEWC', 'LNIL', 'LTRUE', 'LFALSE', 'NEWT',
  'KON', 'GET', 'SET', 'GETS', 'SETS', 'SI', 'APP', 'CALL', 'CALLT', 'ONE', 'IDXK', 'NEWA', 'SIA', 'APPA',
  'LEN', 'UNM', 'NOT', 'ADD', 'SUB', 'MUL', 'DIV', 'IDIV', 'MOD', 'POW',
  'CAT', 'EQ', 'NE', 'LT', 'LE', 'GT', 'GE', 'JMP', 'JT', 'JF',
  'SELF', 'VARARG', 'CLOSURE', 'RET', 'RETM', 'RET0', 'GETG', 'SETG',
];
// The superoperators sit after the base set; a build only carries the handlers
// for the operations its own program contains.
const ALL_VM_OPS = [...VM_CODEGEN_OPS, 'CALLMOV', 'CALLTMOV'];

function vmAlphabet() {
  const chars = VM_ALPHABET_POOL.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function randPerm(n) {
  const a = [];
  for (let i = 0; i < n; i++) a.push(i);
  for (let i = n - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/**
 * Packs every proto into one encrypted character stream. Each instruction is 48
 * bits in eight 6-bit groups; the eight characters of one instruction are
 * written in a per-build shuffled order, group g carries a random offset, and
 * the key rolls per physical block from the previous ciphertext character. This
 * build also stores the instructions in a shuffled physical order (with dead
 * blocks mixed in) and records the mapping in a position table, so reading the
 * string from left to right does not produce the program.
 */
/**
 * Packs every proto into one encrypted character stream.
 *
 * The physical shape of an instruction is decided per build: it is `wc` symbols
 * wide, the opcode lives in one random group, the three operands occupy six
 * further groups in a random pairing and byte order, and any leftover groups
 * hold throwaway digits. The characters of one instruction are written in a
 * shuffled order with a random per-group offset, the key rolls per physical
 * block from the previous symbol, and instructions are stored in a shuffled
 * physical order (mixed with dead blocks) recorded in a position table. Every
 * opcode also has one or more numbers, picked per instruction, so the same
 * operation does not always look the same in the stream.
 */
/**
 * Modular inverse of an odd number modulo 2^12. Used to hide jump targets: the
 * bytecode stores them through a per-build affine map, so a branch operand no
 * longer looks like a position in the instruction stream.
 */
function modInv12(a) {
  let t = 0n;
  let newT = 1n;
  let r = 4096n;
  let newR = BigInt(a % 4096);
  while (newR !== 0n) {
    const q = r / newR;
    const t2 = newT;
    newT = t - q * newT;
    t = t2;
    const r2 = newR;
    newR = r - q * newR;
    r = r2;
  }
  return Number(((t % 4096n) + 4096n) % 4096n);
}

/**
 * Superoperators. A call immediately followed by the move that copies its
 * result into another register becomes a single instruction with its own
 * handler, so the bytecode never shows the uniform "call, then copy the result"
 * shape. The fused handler still writes both registers, so behaviour is
 * unchanged. The second half of a pair is never a jump target, so removing it
 * only requires remapping the remaining jump targets.
 */
function fuseCalls(protos) {
  let fused = 0;
  for (const proto of protos) {
    const code = proto.code;
    const targets = new Set();
    for (const ins of code) {
      if (ins.op === 'JMP') targets.add(ins.a);
      else if (ins.op === 'JT' || ins.op === 'JF') targets.add(ins.b);
    }
    const out = [];
    const map = new Map();
    for (let i = 0; i < code.length; i++) {
      const ins = code[i];
      const next = code[i + 1];
      if (
        next &&
        next.op === 'MOV' &&
        (ins.op === 'CALL' || ins.op === 'CALLT') &&
        next.b === ins.a &&
        !targets.has(i + 2)
      ) {
        if (next.a !== ins.a) {
          out.push({
            op: ins.op === 'CALL' ? 'CALLMOV' : 'CALLTMOV',
            a: ins.a,
            b: ins.b,
            c: next.a,
          });
          fused++;
        } else {
          out.push(ins);
        }
        map.set(i + 1, out.length);
        map.set(i + 2, out.length);
        i++;
        continue;
      }
      out.push(ins);
      map.set(i + 1, out.length);
    }
    const mapPc = (pc) => (pc > code.length ? out.length + 1 : map.get(pc) ?? pc);
    for (const ins of out) {
      if (ins.op === 'JMP') ins.a = mapPc(ins.a);
      else if (ins.op === 'JT' || ins.op === 'JF') ins.b = mapPc(ins.b);
    }
    proto.code = out;
  }
  return fused;
}

// Pure operations that read b (and maybe c) and write a, with no other effect,
// so they can be cut into "compute into a scratch register" + "copy in place".
const VM_SPLIT_OPS = [
  'ADD', 'SUB', 'MUL', 'DIV', 'IDIV', 'MOD', 'POW', 'CAT',
  'EQ', 'NE', 'LT', 'LE', 'GT', 'GE', 'LEN', 'UNM', 'NOT',
];

/**
 * Splits some of the pure instructions into two. The first half computes into a
 * scratch register the rest of the program never names, the second copies that
 * value into the destination, so the result is identical while no opcode number
 * any more stands for a whole operation. The first half keeps the original
 * position (jump targets land on it) and its copy follows it, so jump targets
 * are remapped the same way the fusion pass does.
 */
function splitInstructions(protos, chosen, scratch) {
  let count = 0;
  for (const proto of protos) {
    const code = proto.code;
    const out = [];
    const map = new Map();
    for (let i = 0; i < code.length; i++) {
      const ins = code[i];
      if (chosen.has(ins.op) && randInt(10) < 6) {
        out.push({ op: 'C' + ins.op, a: randInt(4096), b: ins.b, c: ins.c });
        map.set(i + 1, out.length);
        out.push({ op: 'CPY', a: ins.a, b: randInt(4096), c: randInt(4096) });
        count++;
        continue;
      }
      out.push(ins);
      map.set(i + 1, out.length);
    }
    const mapPc = (pc) => (pc > code.length ? out.length + 1 : map.get(pc) ?? pc);
    for (const ins of out) {
      if (ins.op === 'JMP') ins.a = mapPc(ins.a);
      else if (ins.op === 'JT' || ins.op === 'JF') ins.b = mapPc(ins.b);
    }
    proto.code = out;
  }
  return count;
}

/**
 * Packs every proto into one encrypted character stream.
 *
 * The physical shape of an instruction is decided per build: it is `wc` symbols
 * wide, the opcode lives in one random group, the three operands occupy six
 * further groups in a random pairing and byte order, and any leftover groups
 * hold throwaway digits. The characters of one instruction are written in a
 * shuffled order with a random per-group offset, the key rolls per physical
 * block from the previous symbol, and instructions are stored in a shuffled
 * physical order (mixed with dead blocks) recorded in a position table. Every
 * opcode also has one or more numbers, picked per instruction, and jump targets
 * go through an affine map so a branch operand gives nothing away.
 */
function packProgram(protos, alphabet, numbering, L) {
  let cs = 0;
  const slotCounts = [];
  for (let i = 0; i < protos.length; i++) {
    const n = protos[i].code.length;
    // Mixed instructions sit among live ones in roughly the same numbers, so the
    // stream is mostly blocks nothing jumps to.
    const dead =
      Math.floor(n * (L.padMin + Math.random() * (L.padMax - L.padMin))) + 12 + randInt(30);
    slotCounts.push(n + dead);
    cs += (n + dead) * L.wc * (7 + i * 4);
  }
  cs = ((cs % 64) + 64) % 64;
  const text = [];
  const offsets = [];
  const positions = [];
  for (let pi = 0; pi < protos.length; pi++) {
    const proto = protos[pi];
    const n = proto.code.length;
    const slots = slotCounts[pi];
    const off = randInt(64);
    offsets.push(off);
    // Physical slot of each logical instruction, and the instruction that sits
    // in each slot (-1 for a dead block that nothing ever jumps to).
    const order = randPerm(slots).slice(0, n);
    const live = new Array(slots).fill(-1);
    for (let pc = 0; pc < n; pc++) live[order[pc]] = pc;
    positions.push(order.map((x) => x + 1));
    // The key for each block comes from its physical slot, the proto offsets,
    // the integrity seed and the ciphertext symbol before it. It is a pure
    // function of the stream, so jumps cannot desynchronise it.
    let prev = (slots * L.wc) % 64;
    let out = '';
    for (let s = 0; s < slots; s++) {
      const key = (cs * L.km + off + (s + 1) * L.ks + prev * L.kp + L.kt) % 64;
      const pc = live[s];
      const digits = new Array(L.wc).fill(0);
      if (pc < 0) {
        // A dead block: every digit random, indistinguishable from a live
        // instruction until the position table is consulted.
        for (let g = 0; g < L.wc; g++) digits[g] = randInt(64);
      } else {
        const ins = proto.code[pc];
        const opIndex = L.ops.indexOf(ins.op);
        if (opIndex < 0) vfail('op ' + ins.op);
        const choices = numbering[opIndex];
        digits[L.opGroup] = choices[randInt(choices.length)];
        // Jump targets are stored through this build's affine map.
        let va = ins.a;
        let vb = ins.b;
        if (L.jump) {
          const j = L.jump;
          const enc = (t) =>
            (((((t - j.add) % j.mod) + j.mod) % j.mod) * j.inv) % j.mod;
          if (ins.op === 'JMP') va = enc(va);
          else if (ins.op === 'JT' || ins.op === 'JF') vb = enc(vb);
        }
        if (va > 4095 || vb > 4095 || ins.c > 4095) vfail('operand width');
        // The three operands do not sit in a`, `b`, `c` order: this build keeps
        // them in a random slot order, and each is two 6-bit digits (high then
        // low) in its own pair of groups.
        const fields = [va, vb, ins.c];
        for (let k = 0; k < 3; k++) {
          const pair = L.fieldGroups[L.slotFields[k]];
          const v = fields[k];
          digits[pair[0]] = Math.floor(v / 64);
          digits[pair[1]] = v % 64;
        }
        for (const g of L.chaffGroups) digits[g] = randInt(64);
      }
      const encs = new Array(L.wc);
      for (let g = 0; g < L.wc; g++) {
        encs[L.gpos[g]] = (digits[g] + key + L.goff[g]) % 64;
      }
      for (let p = 0; p < L.wc; p++) out += alphabet[encs[p]];
      prev = encs[L.pvpos];
    }
    text.push(out);
  }
  return { cs, text, offsets, positions };
}

/**
 * The Lua half of the machine. Everything about it that a decoder could latch
 * onto is a per-build choice: the width of an instruction, which group holds
 * the opcode, where each operand's two digits sit, how many unused digits ride
 * along, which opcodes exist at all, how the handlers spell the same operation,
 * how digits and keys are untangled, and whether dispatch is a comparison tree,
 * a flat chain, a scrambled if/elseif ladder or a two-level hash of buckets.
 * Each instruction is decrypted inside the loop with a key that rolls forward
 * from the previous one, seeded from the clock gate and the length checksum, so
 * patching either makes the stream decode to nonsense.
 */
function vmProgram(protos, entry, program, o) {
  let seed = o.seen;
  const n = () => {
    const s = randomName(seed);
    seed += s;
    return s;
  };
  const D = {};
  for (const key of [
    'ALP', 'MP', 'UNP', 'PK', 'FLR', 'U1', 'ENV', 'EG', 'ES', 'P', 'CS', 'G', 'RUN',
    'R', 'UU', 'K', 'FL', 'CA', 'C', 'pc', 'key', 'cur', 'j', 'op', 'a', 'b', 'c',
    'V', 'KC', 'NS', 'NP', 'pv', 'CH', 't1', 't2', 't3', 'bk', 'O', 'q', 'HM',
    'DX', 'SD', 'SD2', 'B2V', 'CHR', 'DEC', 'RB', 'RAW', 'S1', 'S2', 'S3',
  ]) {
    D[key] = n();
  }
  // One local per possible digit position; only the live ones are read.
  const DG = [];
  for (let g = 0; g < 9; g++) DG.push(n());

  const L = o.layout;

  // The instruction stream is stored as shuffled pieces rather than as one
  // long literal, and on top of that every symbol is re-encrypted against a
  // keystream that only exists while the script runs. The file therefore holds
  // noise: the bytecode cannot be read out of it without first rebuilding the
  // generator below, and the generator's parameters change every build.
  // Two independent generators drive the stream cipher, and the character is
  // moved forward by both, so undoing one of them leaves noise. Their steps are
  // written as expressions, not as digits.
  const stream = {
    seed: randInt(1 << 24),
    M: 1 + randInt((1 << 28) - 2),
    I: 1 + randInt((1 << 24) - 2),
    Q: 1 << 24,
    t: randInt(64),
    seed2: randInt(1 << 24),
    M2: 1 + randInt((1 << 28) - 2),
    I2: 1 + randInt((1 << 24) - 2),
    t2: randInt(64),
  };
  const alphaIndex = new Map();
  for (let i = 0; i < o.alphabet.length; i++) alphaIndex.set(o.alphabet[i], i);
  let cell = stream.seed;
  const nextSalt = () => {
    cell = (cell * stream.M + stream.I) % stream.Q;
    return ((cell % 64) + (Math.floor(cell / 4096) % 64) + stream.t) % 64;
  };
  let cell2 = stream.seed2;
  const nextSalt2 = () => {
    cell2 = (cell2 * stream.M2 + stream.I2) % stream.Q;
    return ((cell2 % 64) + (Math.floor(cell2 / 4096) % 64) + stream.t2) % 64;
  };
  const chunkTables = program.text.map((raw) => {
    const cut = 2 + randInt(3);
    const step = Math.ceil(raw.length / cut);
    const parts = [];
    for (let at = 0; at < raw.length; at += step)
      parts.push(raw.slice(at, at + step));
    const store = randPerm(parts.length);
    const slotOf = [];
    store.forEach((at, slot) => (slotOf[at] = slot + 1));
    const stored = store.map((at) => {
      let s = '';
      for (const ch of parts[at]) {
        s += o.alphabet[(alphaIndex.get(ch) + nextSalt() + nextSalt2()) % 64];
      }
      return JSON.stringify(s);
    });
    return { stored, slotOf };
  });

  // Three separate constant tables, each undone by its own routine with its own
  // state word. Every string also arrives cut in two, and the halves are filed
  // into different tables, so no routine returns a whole constant and no table
  // ever holds a readable pool.
  const splitTables = [[], [], []];
  const fileConstant = (bytes, index) => {
    const pieces = o.parts(bytes, index).map((pt) => {
      splitTables[pt.g].push(pt.payload);
      return `${pt.g + 1},${splitTables[pt.g].length}`;
    });
    return `{${pieces.join(',')}}`;
  };
  const protoLits = protos.map((p, i) => {
    const refs = [];
    const fl = [];
    p.k.forEach((c, x) => {
      if (c.kind === 'num') {
        refs.push(c.text);
        fl.push('0');
      } else {
        refs.push(fileConstant(c.bytes, x + 1));
        fl.push('1');
      }
    });
    // A few constants the program never asks for ride along in every table.
    // They decode to ordinary looking strings, so a decoded constant list
    // contains material the script never uses.
    const junkN = randInt(12) + 10;
    for (let q = 0; q < junkN; q++) {
      const bytes = new Uint8Array(4 + randInt(11));
      crypto.getRandomValues(bytes);
      refs.push(fileConstant([...bytes], p.k.length + q + 1));
      fl.push('1');
    }
    const k = refs.join(',');
    const ns = Math.max(p.nslots, p.nparams, 1);
    const joinLit = chunkTables[i].slotOf
      .map((slot) => `${D.DX}[${i + 1}][${slot}]`)
      .join('..');
    return `{${joinLit},{${k}},${ns},${p.nparams},${
      p.vararg ? 'true' : 'false'
    },{${p.ups.join(',')}},{${fl.join(',')}},{},${program.offsets[i]},{${program.positions[i].join(',')}}}`;
  });
  const splitLit = `{${splitTables.map((t) => `{${t.join(',')}}`).join(',')}}`;

  const csExpr = protos.map((p, i) => `#${D.P}[${i + 1}][1]*${7 + i * 4}`).join('+');

  // There is no time limit on the output: it runs whenever it is run.
  const gate = `local ${D.G}=0 `;

  // How a symbol is turned into a 0..63 value: a lookup table or a search, so
  // the alphabet is not always sitting in the file as a decoded table.
  const useTable = L.alphaVar === 0;
  const symAt = (pos) =>
    useTable
      ? `${D.MP}[string.byte(${D.C},${pos})]`
      : `(string.find(${D.ALP},string.sub(${D.C},${pos},${pos}),1,true)-1)`;

  const shiftFor = (g) =>
    L.goff[g] === 0 ? D.key : `(${D.key}+${L.goff[g]})%64`;

  const readDigit = (g) => {
    const pos = `${D.j}+${L.gpos[g] + 1}`;
    const sym = symAt(pos);
    const sh = shiftFor(g);
    if (L.readVar === 1) return `(${sym}-${sh}+128)%64`;
    if (L.readVar === 2) return `((${sym}-${sh})%128)%64`;
    return `(${sym}-${sh})%64`;
  };

  const need = [L.opGroup];
  for (const pair of L.fieldGroups) need.push(pair[0], pair[1]);
  const readOrder = randPerm(need.length).map((i) => need[i]);
  const reads = readOrder.map((g) => `local ${DG[g]}=${readDigit(g)}`);

  const extracts = [{ text: `local ${D.op}=${DG[L.opGroup]}` }];
  ['a', 'b', 'c'].forEach((slot, k) => {
    const pair = L.fieldGroups[L.slotFields[k]];
    extracts.push({
      text: `local ${D[slot]}=${DG[pair[0]]}*64+${DG[pair[1]]}`,
    });
  });
  const extractOrder = randPerm(extracts.length).map((i) => extracts[i]);

  const H = {
    MOV: `${D.R}[${D.a}]=${D.R}[${D.b}]`,
    LGET: `${D.R}[${D.a}]=${D.R}[${D.b}][1]`,
    LSET: `${D.R}[${D.a}][1]=${D.R}[${D.b}]`,
    UGET: `${D.R}[${D.a}]=${D.UU}[${D.b}+1][1]`,
    USET: `${D.UU}[${D.a}+1][1]=${D.R}[${D.b}]`,
    NEWC: `${D.R}[${D.a}]={nil}`,
    LNIL: `${D.R}[${D.a}]=nil`,
    LTRUE: `${D.R}[${D.a}]=true`,
    LFALSE: `${D.R}[${D.a}]=false`,
    NEWT: `${D.R}[${D.a}]={}`,
    KON: `${D.R}[${D.a}]=${D.KC}(${D.b})`,
    GET: `${D.R}[${D.a}]=${D.R}[${D.b}][${D.R}[${D.c}]]`,
    SET: `${D.R}[${D.a}][${D.R}[${D.b}]]=${D.R}[${D.c}]`,
    GETS: `${D.R}[${D.a}]=${D.R}[${D.b}][${D.KC}(${D.c})]`,
    SETS: `${D.R}[${D.a}][${D.KC}(${D.b})]=${D.R}[${D.c}]`,
    SI: `${D.R}[${D.a}][${D.b}]=${D.R}[${D.c}]`,
    APP:
      `do local t=${D.R}[${D.a}] local s=${D.R}[${D.b}] local m=#t ` +
      `for z=1,s.n do t[m+z]=s[z] end end`,
    CALL:
      `do local f=${D.R}[${D.a}] local q={} ` +
      `for z=1,${D.b} do q[z]=${D.R}[${D.a}+z] end ` +
      `${D.R}[${D.a}]=${D.PK}(f(${D.UNP}(q,1,${D.b}))) end`,
    CALLT: `${D.R}[${D.a}]=${D.PK}(${D.R}[${D.a}](${D.UNP}(${D.R}[${D.b}],1,${D.R}[${D.b}].n)))`,
    // Superoperators: call and the copy of its result as one instruction. Both
    // registers the two halves wrote are still written.
    CALLMOV:
      `do local f=${D.R}[${D.a}] local q={} ` +
      `for z=1,${D.b} do q[z]=${D.R}[${D.a}+z] end ` +
      `local v=${D.PK}(f(${D.UNP}(q,1,${D.b}))) ${D.R}[${D.a}]=v ${D.R}[${D.c}]=v end`,
    CALLTMOV:
      `do local v=${D.PK}(${D.R}[${D.a}](${D.UNP}(${D.R}[${D.b}],1,${D.R}[${D.b}].n))) ` +
      `${D.R}[${D.a}]=v ${D.R}[${D.c}]=v end`,
    ONE: `${D.R}[${D.a}]=${D.R}[${D.b}][1]`,
    IDXK: `${D.R}[${D.a}]=${D.R}[${D.b}][${D.c}]`,
    NEWA: `${D.R}[${D.a}]={n=0}`,
    SIA: `${D.R}[${D.a}][${D.b}]=${D.R}[${D.c}] ${D.R}[${D.a}].n=${D.b}`,
    APPA:
      `do local t=${D.R}[${D.a}] local s=${D.R}[${D.b}] local o=t.n ` +
      `for z=1,s.n do t[o+z]=s[z] end t.n=o+s.n end`,
    LEN: `${D.R}[${D.a}]=#${D.R}[${D.b}]`,
    UNM: `${D.R}[${D.a}]=-${D.R}[${D.b}]`,
    NOT: `${D.R}[${D.a}]=not ${D.R}[${D.b}]`,
    ADD: `${D.R}[${D.a}]=${D.R}[${D.b}]+${D.R}[${D.c}]`,
    SUB: `${D.R}[${D.a}]=${D.R}[${D.b}]-${D.R}[${D.c}]`,
    MUL: `${D.R}[${D.a}]=${D.R}[${D.b}]*${D.R}[${D.c}]`,
    DIV: `${D.R}[${D.a}]=${D.R}[${D.b}]/${D.R}[${D.c}]`,
    IDIV: `${D.R}[${D.a}]=${D.FLR}(${D.R}[${D.b}]/${D.R}[${D.c}])`,
    MOD: `${D.R}[${D.a}]=${D.R}[${D.b}]%${D.R}[${D.c}]`,
    POW: `${D.R}[${D.a}]=${D.R}[${D.b}]^${D.R}[${D.c}]`,
    CAT: `${D.R}[${D.a}]=${D.R}[${D.b}]..${D.R}[${D.c}]`,
    EQ: `${D.R}[${D.a}]=${D.R}[${D.b}]==${D.R}[${D.c}]`,
    NE: `${D.R}[${D.a}]=${D.R}[${D.b}]~=${D.R}[${D.c}]`,
    LT: `${D.R}[${D.a}]=${D.R}[${D.b}]<${D.R}[${D.c}]`,
    LE: `${D.R}[${D.a}]=${D.R}[${D.b}]<=${D.R}[${D.c}]`,
    GT: `${D.R}[${D.a}]=${D.R}[${D.b}]>${D.R}[${D.c}]`,
    GE: `${D.R}[${D.a}]=${D.R}[${D.b}]>=${D.R}[${D.c}]`,
    JMP: L.jump
      ? `${D.pc}=((${D.a}*${L.jump.mul}+${L.jump.add})%${L.jump.mod})`
      : `${D.pc}=${D.a}`,
    JT: L.jump
      ? `if ${D.R}[${D.a}] then ${D.pc}=((${D.b}*${L.jump.mul}+${L.jump.add})%${L.jump.mod}) end`
      : `if ${D.R}[${D.a}] then ${D.pc}=${D.b} end`,
    JF: L.jump
      ? `if not ${D.R}[${D.a}] then ${D.pc}=((${D.b}*${L.jump.mul}+${L.jump.add})%${L.jump.mod}) end`
      : `if not ${D.R}[${D.a}] then ${D.pc}=${D.b} end`,
    SELF: `${D.R}[${D.a}]=${D.R}[${D.b}][${D.KC}(${D.c})] ${D.R}[${D.a}+1]=${D.R}[${D.b}]`,
    VARARG: `${D.R}[${D.a}]=${D.V}`,
    CLOSURE:
      `do local d=${D.P}[${D.b}][6] local m={} for z=1,#d do local x=d[z] ` +
      `if x>0 then m[z]=${D.R}[x] else m[z]=${D.UU}[-x] end end local cp=${D.P}[${D.b}] ` +
      `${D.R}[${D.a}]=function(...) return ${D.U1}(${D.RUN}(cp,${D.PK}(...),m)) end end`,
    RET: `do local q={n=${D.b}} for z=1,${D.b} do q[z]=${D.R}[${D.a}+z-1] end return q end`,
    RETM: `return ${D.R}[${D.a}]`,
    RET0: `return {n=0}`,
    GETG: `${D.R}[${D.a}]=${D.EG}(${D.KC}(${D.b}))`,
    SETG: `${D.ES}(${D.KC}(${D.a}),${D.R}[${D.b}])`,
  };

  // Alternative spellings of the same instruction, chosen per build and per
  // opcode number (aliases get their own wording). Only rewrites that are exact
  // are listed: swapping the operands of a commutative operator, or naming an
  // intermediate in a temporary.
  const T = D.t1;
  const ALT = {
    MOV: [`do ${D.R}[${D.a}]=${D.R}[${D.b}] end`],
    ADD: [
      `${D.R}[${D.a}]=${D.R}[${D.c}]+${D.R}[${D.b}]`,
      `do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}+${D.R}[${D.c}] end`,
    ],
    MUL: [
      `${D.R}[${D.a}]=${D.R}[${D.c}]*${D.R}[${D.b}]`,
      `do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}*${D.R}[${D.c}] end`,
    ],
    SUB: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}-${D.R}[${D.c}] end`],
    DIV: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}/${D.R}[${D.c}] end`],
    MOD: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}%${D.R}[${D.c}] end`],
    POW: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}^${D.R}[${D.c}] end`],
    IDIV: [
      `do local ${T}=${D.R}[${D.b}]/${D.R}[${D.c}] ${D.R}[${D.a}]=${D.FLR}(${T}) end`,
    ],
    CAT: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}..${D.R}[${D.c}] end`],
    EQ: [`${D.R}[${D.a}]=${D.R}[${D.c}]==${D.R}[${D.b}]`],
    NE: [`${D.R}[${D.a}]=${D.R}[${D.c}]~=${D.R}[${D.b}]`],
    LEN: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=#${T} end`],
    UNM: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=-${T} end`],
    NOT: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=not ${T} end`],
    ONE: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}[1] end`],
    GET: [
      `do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}[${D.R}[${D.c}]] end`,
    ],
    SET: [
      `do local ${T}=${D.R}[${D.a}] ${T}[${D.R}[${D.b}]]=${D.R}[${D.c}] end`,
    ],
    GETS: [
      `do local ${T}=${D.R}[${D.b}] local ${D.t2}=${D.KC}(${D.c}) ${D.R}[${D.a}]=${T}[${D.t2}] end`,
    ],
    SETS: [
      `do local ${T}=${D.R}[${D.a}] local ${D.t3}=${D.KC}(${D.b}) ${T}[${D.t3}]=${D.R}[${D.c}] end`,
    ],
    SI: [
      `do local ${T}=${D.R}[${D.a}] ${T}[${D.b}]=${D.R}[${D.c}] end`,
    ],
    LGET: [`do local ${T}=${D.R}[${D.b}] ${D.R}[${D.a}]=${T}[1] end`],
    LSET: [`do local ${T}=${D.R}[${D.a}] ${T}[1]=${D.R}[${D.b}] end`],
    KON: [`do local ${T}=${D.KC}(${D.b}) ${D.R}[${D.a}]=${T} end`],
    NEWT: [`${D.R}[${D.a}]=({})`],
    JMP: L.jump ? [] : [`do ${D.pc}=${D.a} end`],
    JT: L.jump ? [] : [`do if ${D.R}[${D.a}] then ${D.pc}=${D.b} end end`],
    JF: L.jump ? [] : [`do if not ${D.R}[${D.a}] then ${D.pc}=${D.b} end end`],
    CALLMOV: [
      `do local f=${D.R}[${D.a}] local q={} local z ` +
        `for z=1,${D.b} do q[z]=${D.R}[${D.a}+z] end ` +
        `${D.R}[${D.c}]=${D.PK}(f(${D.UNP}(q,1,${D.b}))) ${D.R}[${D.a}]=${D.R}[${D.c}] end`,
    ],
  };

  const pickBody = (opName) => {
    const base = H[opName];
    const alts = ALT[opName];
    if (alts && alts.length && randInt(3) === 0) return alts[randInt(alts.length)];
    if ((!alts || !alts.length) && !opName.startsWith('RET') && randInt(5) === 0) {
      return `do ${base} end`;
    }
    return base;
  };

  // Decoy handlers on opcode numbers the program never uses. If one is ever
  // reached it does nothing, so they cost a few bytes of text and nothing else.
  const chaffBody = () => {
    switch (randInt(3)) {
      case 0:
        return `local ${D.t1}=${D.a}+${D.b}`;
      case 1:
        return `local ${D.t1}=${D.op}*${D.a} local ${D.t2}=${D.t1}`;
      default:
        return `local ${D.t1}=${D.R}[${D.a}] local ${D.t2}=${D.t1}`;
    }
  };

  // Split handlers: several of the pure operations are cut in two, so no single
  // handler number does a whole operation. One handler writes a private scratch
  // register, the next copies it into place; the pair writes exactly the
  // register the original instruction wrote, so behaviour cannot change. The
  // two halves carry unrelated throwaway operands, so they do not look like a
  // pair in the stream.
  if (L.split && L.split.length) {
    for (const name of L.split) {
      H['C' + name] = H[name].split(`${D.R}[${D.a}]`).join(`${D.R}[${L.scratch}]`);
      ALT['C' + name] = [];
    }
    H.CPY = `${D.R}[${D.a}]=${D.R}[${L.scratch}]`;
    ALT.CPY = [`do ${D.R}[${D.a}]=${D.R}[${L.scratch}] end`];
  }

  const entries = [];
  o.ops.forEach((opName, i) => {
    for (const num of o.numbering[i])
      entries.push({ num, body: pickBody(opName), opName });
  });
  for (const num of o.chaff) entries.push({ num, body: chaffBody(), opName: '' });
  entries.sort((x, y) => x.num - y.num);
  // The number each handler branch compares against is not written into the
  // file. The dispatcher only ever says "this is branch five", and which
  // opcode number branch five means arrives with the rest of the payload,
  // encrypted under the runtime keystream. Reading the source therefore shows
  // a set of operations and no way to tell which number selects which; a
  // decoder has to reproduce the decryption stream first.
  const mapAt = chunkTables.length + 1;
  let mapRaw = '';
  for (const e of entries) mapRaw += o.alphabet[(e.num + nextSalt() + nextSalt2()) % 64];
  const branches = entries.map((e, i) => ({ num: e.num, body: e.body, opName: e.opName, at: i + 1 }));

  const tailOf = (opName) =>
    opName === 'RET' || opName === 'RETM' || opName === 'RET0'
      ? ''
      : `if ${D.pc}==${D.cur} then ${D.pc}=${D.cur}+1 end `;

  // Opaque predicates: a condition a static reader cannot fold without doing
  // the arithmetic, guarding handlers that always run.
  const trueForms = [
    `(${D.a}*${D.a}+${D.a})%2==0`,
    `((${D.a}+${D.b})*((${D.a}+${D.b})+1))%2==0`,
    `${D.a}*${D.a}%2==${D.a}%2`,
  ];
  const falseForms = [
    `(${D.a}*${D.a}+${D.a})%2==1`,
    `((${D.a}+${D.b})*((${D.a}+${D.b})+1))%2==1`,
  ];
  const wrap = (body) => {
    if (L.opaque === 0 || randInt(4) !== 0) return body;
    return `if ${trueForms[randInt(trueForms.length)]} then ${body} end`;
  };
  const junkBefore = (body) => {
    if (L.junk === 0 || randInt(5) !== 0) return body;
    return `if ${falseForms[randInt(falseForms.length)]} then local ${D.t3}=${D.a}*3 end ` + body;
  };

  const bodyOf = (e) => {
    const tail = e.opName ? tailOf(e.opName) : '';
    return junkBefore(wrap(`${e.body} ${tail}`));
  };

  const leafBody = (e) => {
    return `if ${D.q}==${e.at} then ${bodyOf(e)} end`;
  };

  const tree = (list) => {
    if (list.length === 1) return leafBody(list[0]);
    const mid = 1 + randInt(list.length - 1);
    return (
      `if ${D.q}<${list[mid].at} then ${tree(list.slice(0, mid))} ` +
      `else ${tree(list.slice(mid))} end`
    );
  };

  const flat = (list) => {
    const order = randPerm(list.length).map((i) => list[i]);
    return order.map(leafBody).join(' ');
  };

  const ladder = (list) => {
    const order = randPerm(list.length).map((i) => list[i]);
    const parts = order.map(
      (e, i) => `${i === 0 ? 'if' : 'elseif'} ${D.q}==${e.at} then ${bodyOf(e)} `,
    );
    return parts.join('') + ' end';
  };

  const bucket = (list) => {
    const nb = L.bucketN;
    const buckets = [];
    for (let b = 0; b < nb; b++) buckets.push([]);
    for (const e of list) buckets[(e.at * L.bucketK + L.bucketT) % nb].push(e);
    const chunks = [];
    for (let b = 0; b < nb; b++) {
      if (!buckets[b].length) continue;
      chunks.push(`if ${D.bk}==${b} then ${tree(buckets[b])} end`);
    }
    return `local ${D.bk}=(${D.q}*${L.bucketK}+${L.bucketT})%${nb} ` + chunks.join(' ');
  };

  const dispatch =
    L.dispatch === 3
      ? ladder(branches)
      : L.dispatch === 2
        ? bucket(branches)
        : L.dispatch === 1
          ? flat(branches)
          : tree(branches);

  // The rolling key, written two ways so the arithmetic does not look the same
  // in every build.
  const keyCore =
    `${D.CS}*${L.km}+${D.G}+${D.P}a[9]+(${D.P}a[10][${D.cur}])*${L.ks}` +
    `+${D.pv}*${L.kp}+${L.kt}`;
  const keyExpr = L.keyVar === 0 ? `(${keyCore})%64` : `((${keyCore})+192)%64`;

  let out = '';
  out += `local ${D.ALP}="${o.alphabet}" `;
  if (useTable) {
    out += `local ${D.MP}={} for i=1,#${D.ALP} do ${D.MP}[string.byte(${D.ALP},i)]=i-1 end `;
  }
  out += `local ${D.UNP}=table.unpack if ${D.UNP}==nil then ${D.UNP}=unpack end `;
  out += `local ${D.PK}=function(...) return {n=select("#",...),...} end `;
  out += `local ${D.FLR}=math.floor `;
  out += `local ${D.U1}=function(m) return ${D.UNP}(m,1,m.n) end `;
  out += `local ${o.decoder}=${o.decoder} `;
  // The script's globals live in the executor's environment, which is not `_G`:
  // prefer getgenv(), then getfenv(0), and only then fall back to `_G`.
  out += `local ${D.ENV}=(function() local ok,g=pcall(function() return getgenv() end) `;
  out += `if ok and type(g)=="table" then return g end `;
  out += `local ok2,e=pcall(function() return getfenv(0) end) `;
  out += `if ok2 and type(e)=="table" then return e end return _G end)() `;
  out += `local ${D.EG}=function(k) local v=${D.ENV}[k] `;
  out += `if v==nil and ${D.ENV}~=_G then v=_G[k] end return v end `;
  out += `local ${D.ES}=function(k,v) ${D.ENV}[k]=v if ${D.ENV}~=_G then _G[k]=v end end `;
  out += `local ${D.CH}={} `;
  for (let i = 0; i < chunkTables.length; i++) {
    out += `${D.CH}[${i + 1}]={${chunkTables[i].stored.join(',')}} `;
  }
  // The branch labels ride in the payload like everything else.
  out += `${D.CH}[${mapAt}]={"${mapRaw}"} `;
  out += gate;
  // Rebuild the keystream and undo it over every stored piece.
  out += `local ${D.B2V}={} local ${D.CHR}={} `;
  out += `for i=1,#${D.ALP} do ${D.B2V}[string.byte(${D.ALP},i)]=i-1 `;
  out += `${D.CHR}[i]=string.sub(${D.ALP},i,i) end `;
  out += `local ${D.SD}=${foldNum(stream.seed)} local ${D.SD2}=${foldNum(stream.seed2)} `;
  out += `local function ${D.DEC}(s) local o={} local k local k2 for p=1,#s do `;
  out += `${D.SD}=(${D.SD}*${foldNum(stream.M)}+${foldNum(stream.I)})%${foldNum(stream.Q)} `;
  out += `k=(${D.SD}%64+${D.FLR}(${D.SD}/4096)%64+${stream.t})%64 `;
  out += `${D.SD2}=(${D.SD2}*${foldNum(stream.M2)}+${foldNum(stream.I2)})%${foldNum(stream.Q)} `;
  out += `k2=(${D.SD2}%64+${D.FLR}(${D.SD2}/4096)%64+${stream.t2})%64 `;
  out += `local v=(${D.B2V}[string.byte(s,p)]-k-k2)%64 `;
  out += `o[p]=${D.CHR}[v+1] end return table.concat(o) end `;
  out += `local ${D.DX}={} for i=1,#${D.CH} do ${D.DX}[i]={} `;
  out += `for j=1,#${D.CH}[i] do ${D.DX}[i][j]=${D.DEC}(${D.CH}[i][j]) end end `;
  out += `local ${D.O}={} do local m=${D.DX}[${mapAt}][1] local i `;
  out += `for i=1,#m do ${D.O}[i]=${D.B2V}[string.byte(m,i)] end end `;
  // One number in, one branch index out; the pairing between the two only
  // exists in this table, which was just built from the decrypted payload.
  out += `local ${D.HM}={} local i for i=1,#${D.O} do ${D.HM}[${D.O}[i]]=i end `;
  out += `local ${D.P}={${protoLits.join(',')}} `;
  out += `local ${D.CS}=(${csExpr})%64 `;
  out += `local function ${D.RUN}(${D.P}a,${D.R}a,${D.UU}) `;
  out += `local ${D.R}={} local i local ${D.NS}=${D.P}a[3] local ${D.NP}=${D.P}a[4] `;
  out += `for i=1,${D.NS} do ${D.R}[i]={nil} end `;
  out += `for i=1,${D.NP} do ${D.R}[i][1]=${D.R}a[i] end `;
  out += `local ${D.V} if ${D.P}a[5] then ${D.V}={n=0} local an=${D.R}a.n or ${D.NP} `;
  out += `for i=${D.NP}+1,an do ${D.V}.n=${D.V}.n+1 ${D.V}[${D.V}.n]=${D.R}a[i] end end `;
  out += `local ${D.K}=${D.P}a[2] local ${D.FL}=${D.P}a[7] local ${D.CA}=${D.P}a[8] local ${D.C}=${D.P}a[1] `;
  out += `local ${D.pc}=1 `;
  // Three ways of unmaking a stored byte, each carrying its own state word.
  // A constant is spread over all of them, so undoing one tells you nothing
  // about the rest of the same string.
  out += `local ${D.S1}=function(e) local t={} local prev=0 local st=91 local i `;
  out += `for i=1,#e do local k=(st*13+7)%256 local b=(string.byte(e,i)+prev+k)%256 `;
  out += `t[i]=string.char(b) prev=b st=(st*31+b+11)%256 end return table.concat(t) end `;
  out += `local ${D.S2}=function(e) local t={} local prev=0 local st=47 local i `;
  out += `for i=1,#e do local k=(st*7+13)%256 local b=(string.byte(e,i)+prev*3+k)%256 `;
  out += `t[i]=string.char(b) prev=b st=(st*17+b+5)%256 end return table.concat(t) end `;
  out += `local ${D.S3}=function(e) local t={} local prev=0 local st=119 local i `;
  out += `for i=1,#e do local k=(st*29+(i-1)*37+11)%256 `;
  out += `local b=(string.byte(e,i)+${D.FLR}(prev/2)+k)%256 `;
  out += `t[i]=string.char(b) prev=b st=(st*13+b+3)%256 end return table.concat(t) end `;
  out += `local ${D.RAW}=${splitLit} `;
  out += `local function ${D.KC}(x) local cv=${D.K}[x] if ${D.FL}[x]==1 then `;
  out += `local d=${D.CA}[x] if d==nil then local t={} local j=1 `;
  out += `while j<=#cv do local g=cv[j] local at=cv[j+1] `;
  out += `local f=(g==1 and ${D.S1}) or (g==2 and ${D.S2}) or ${D.S3} `;
  out += `t[#t+1]=f(${o.decoder}(${D.RAW}[g][at],(${o.link}+x*7+${D.FLR}((j-1)/2))%256)) `;
  out += `j=j+2 end d=table.concat(t) ${D.CA}[x]=d end cv=d end return cv end `;
  out += `while ${D.pc}~=0 do local ${D.cur}=${D.pc} local ${D.j}=(${D.P}a[10][${D.cur}]-1)*${L.wc} `;
  out += `local ${D.pv}=(${D.j}>0) and ${symAt(`${D.j}-${L.wc - 1}+${L.pvpos}`)} or (#${D.C}%64) `;
  out += `local ${D.key}=${keyExpr} `;
  out += reads.join(' ');
  out += ' ' + extractOrder.map((x) => x.text).join(' ') + ' ';
  out += `local ${D.q}=${D.HM}[${D.op}] `;
  out += dispatch + ' ';
  out += `end return {n=0} end `;
  out += `return ${D.U1}(${D.RUN}(${D.P}[${entry}],${D.PK}(...),{}))`;
  return out;
}
let vmFallbackReason = '';

/** Tries the whole-program path; any doubt at all and it returns null. */
function buildVirtual(source, opts) {
  vmFallbackReason = '';
  try {
    if (source.charCodeAt(0) === 0x23) vfail('shebang script');
    const compiled = compileToProtos(source);
    let total = 0;
    for (const p of compiled.protos) total += p.code.length;
    if (total === 0) vfail('nothing to compile');
    if (total > 30000) vfail('script too large to virtualize');

    const decoder = randomName(source);
    const alphabet = makeAlphabet();
    const cipher = makeCipher(alphabet);
    const link = 1 + randInt(255);
    const sboxPack = packBytes(SBOX, alphabet);
    // Superoperators, then the per-build instruction set: only the operations
    // this program ends up containing get a handler (plus aliases and decoys).
    if (randInt(10) < 7) fuseCalls(compiled.protos);
    // A random subset of the pure operations gets cut in two, so one opcode
    // number no longer means one whole operation.
    let maxReg = 1;
    for (const p of compiled.protos) maxReg = Math.max(maxReg, p.nslots, p.nparams);
    const scratch = Math.min(4095, maxReg + 1 + randInt(48));
    const shuffledSplit = randPerm(VM_SPLIT_OPS.length).map((i) => VM_SPLIT_OPS[i]);
    const split = shuffledSplit.slice(0, 1 + randInt(4));
    splitInstructions(compiled.protos, new Set(split), scratch);
    const used = new Set();
    for (const p of compiled.protos) for (const ins of p.code) used.add(ins.op);
    const ops = [...ALL_VM_OPS, ...split.map((nm) => 'C' + nm), 'CPY'].filter((name) =>
      used.has(name),
    );
    // A few operations this program does not use still get handlers, picked at
    // random, so the instruction set itself is not the same in every build even
    // for the same input.
    const unused = VM_CODEGEN_OPS.filter((name) => !used.has(name));
    const extra = Math.max(0, Math.min(2 + randInt(5), 56 - ops.length));
    for (let i = 0; i < extra && unused.length; i++) {
      ops.push(unused.splice(randInt(unused.length), 1)[0]);
    }
    let maxPc = 0;
    for (const p of compiled.protos) maxPc = Math.max(maxPc, p.code.length + 1);

    const bcAlphabet = vmAlphabet();
    // Per-build physical format: 7, 8 or 9 symbols per instruction, the opcode
    // in one random group, and the three operands in six further groups (each
    // operand is a high and a low digit). Any groups left over hold noise.
    const wc = 7 + randInt(3);
    const groupOrder = randPerm(wc);
    const opGroup = groupOrder[0];
    const restGroups = groupOrder.slice(1);
    const fieldGroups = [];
    for (let k = 0; k < 3; k++) {
      const x = restGroups[k * 2];
      const y = restGroups[k * 2 + 1];
      fieldGroups.push(randInt(2) ? [x, y] : [y, x]);
    }
    const chaffGroups = restGroups.slice(6);
    // Which of the three stored fields holds `a`, which holds `b`, and which
    // holds `c`.
    const slotFields = randPerm(3);
    // Per-build opcode set: every operation gets its own number, a few
    // operations get a second number chosen at random per instruction, and a
    // few numbers map to decoy handlers the program never uses.
    const pool = randPerm(64);
    const numbering = ops.map((_, i) => [pool[i]]);
    const spare = pool.slice(ops.length);
    const aliasCount = 1 + randInt(Math.max(1, Math.min(5, spare.length)));
    for (let i = 0; i < aliasCount && spare.length; i++) {
      numbering[randInt(ops.length)].push(spare.pop());
    }
    const chaffCount = 6 + randInt(Math.max(1, Math.min(18, spare.length)));
    const chaff = [];
    for (let i = 0; i < chaffCount && spare.length; i++) chaff.push(spare.pop());
    // Jump targets go through a per-build affine map when the program is small
    // enough for the encoded value to fit an operand.
    let jump = null;
    if (maxPc < 4096 && randInt(10) < 8) {
      const mul = 1 + randInt(2047) * 2;
      const add = randInt(4096);
      jump = { mul, add, inv: modInv12(mul), mod: 4096 };
    }
    const layout = {
      wc,
      scratch,
      split,
      opGroup,
      fieldGroups,
      chaffGroups,
      slotFields,
      ops,
      jump,
      // Which spelling of the digit and key arithmetic this build uses.
      readVar: randInt(3),
      keyVar: randInt(2),
      alphaVar: randInt(2),
      opaque: randInt(2) ? 1 : 0,
      junk: randInt(2),
      gpos: randPerm(wc),
      goff: new Array(wc).fill(0).map(() => randInt(64)),
      km: 1 + randInt(63),
      ks: 1 + randInt(63),
      kp: 1 + randInt(63),
      kt: randInt(64),
      pvpos: randInt(wc),
      padMin: 1.9 + Math.random() * 0.9,
      padMax: 3.8 + Math.random() * 2.2,
      // 0: comparison tree, 1: flat shuffled chain, 2: two-level hash buckets,
      // 3: scrambled if/elseif ladder.
      dispatch: randInt(4),
      bucketN: 3 + randInt(4),
      bucketK: 1 + randInt(15),
      bucketT: randInt(16),
    };
    const program = packProgram(compiled.protos, bcAlphabet, numbering, layout);
    const maxAgeSeconds = 0;
    const machine = vmProgram(compiled.protos, compiled.entry, program, {
      seen: source + decoder + bcAlphabet + alphabet,
      decoder,
      alphabet: bcAlphabet,
      numbering,
      ops,
      chaff,
      layout,
      link,
      maxAgeSeconds,
      // Strings are stored as differences between neighbouring bytes, so even a
      // completely decoded constant is still unreadable: it has to be summed back
      // up before it says anything.
      // One string becomes one piece per constant table, each piece under a
      // different scheme and its own key. Which table gets which piece rotates
      // per constant, so the three tables interleave.
      parts: (bytes, index = 0) =>
        splitConstant(bytes).map((part, h) => {
          const g = (index + h) % 3;
          return {
            g,
            payload: encodePayload(schemeEncode(part, g), cipher, (link + index * 7 + h) & 255),
          };
        }),
      notice: opts.notice !== false,
    });
    const runtime = vmPrelude(source + bcAlphabet, decoder, alphabet, sboxPack, cipher, {
      stride: 3,
      cells: 3,
    });
    let shadow = '';
    for (let i = 0, n = 2 + randInt(2); i < n; i++) {
      shadow += shadowRuntime(source + bcAlphabet + shadow + i);
    }
    let stringCount = 0;
    for (const p of compiled.protos) for (const c of p.k) if (c.kind === 'str') stringCount++;
    return {
      script: (opts.notice !== false ? noticeHeader() : '') + runtime + shadow + machine,
      encodedStrings: stringCount,
      encodedNumbers: 0,
      renamedLocals: 0,
      renamedFields: 0,
      renamedGlobals: 0,
      hiddenGlobals: 0,
      hiddenMembers: 0,
      maxAgeSeconds,
      virtualized: true,
      vmInstructions: compiled.protos.reduce((a, p) => a + p.code.length, 0),
      decoder,
    };
  } catch (error) {
    vmFallbackReason = String(error && error.message ? error.message : error);
    if (typeof globalThis !== 'undefined') globalThis.__vmReason = vmFallbackReason;
    return null;
  }
}

const DEFAULTS = {
  stripComments: true,
  renameIdentifiers: true,
  renameFields: true,
  renameGlobals: true,
  encodeNumbers: true,
  hideGlobals: true,
  hideMembers: true,
  singleLine: true,
  virtualize: true,
  maxAgeSeconds: 0,
  notice: true,
};

/**
 * A plain-language notice above the output. It is only a notice: it changes no
 * behaviour, and anyone is free to ignore it.
 */
function noticeHeader() {
  const tag = 'abcdef'[randInt(6)] + 'bcdefg'[randInt(6)] + randInt(100000);
  return (
    `--[==[\n` +
    `  PROPRIETARY SOFTWARE - ALL RIGHTS RESERVED\n` +
    `  Build ${tag}. This file is licensed for use, not for study.\n` +
    `  Automated analysis, machine transcription and symbolic tracing of this\n` +
    `  build are not permitted without written permission from the author.\n` +
    `  The author accepts no liability for modified or extracted copies.\n` +
    `]==]\n`
  );
}

/** Resolves `print`, `game`, `Instance` ... out of the script's own environment. */
function envHelper(name) {
  return (
    `local ${name}=(function() ` +
    `local E=nil ` +
    `local ok,g=pcall(function() return getgenv() end) ` +
    `if ok and type(g)=="table" then E=g end ` +
    `if type(E)~="table" then ` +
    `local ok2,env=pcall(function() return getfenv(0) end) ` +
    `if ok2 and type(env)=="table" then E=env end end ` +
    `if type(E)~="table" then E=_G end ` +
    `return function(k) ` +
    `local v=E[k] ` +
    `if v==nil and E~=_G then v=_G[k] end ` +
    `return v ` +
    `end ` +
    `end)() `
  );
}

/** `C(obj, key, ...)` calls `obj[key](obj, ...)`: a method call with a hidden name. */
function callHelper(name) {
  return `local ${name}=function(o,k,...)return o[k](o,...)end `;
}

/**
 * @param {string} source
 * @param {{ stripComments?: boolean, renameIdentifiers?: boolean, encodeNumbers?: boolean }} [options]
 * @returns {{ script: string, encodedStrings: number, encodedNumbers: number,
 *             renamedLocals: number, decoder: string }}
 */
function obfuscate(source, options = {}) {
  if (typeof source !== 'string') throw new TypeError('script must be a string');

  const opts = { ...DEFAULTS, ...options };
  resetNameState();
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);

  if (opts.virtualize !== false) {
    const vm = buildVirtual(source, opts);
    if (vm) return vm;
  }

  const tokens = tokenize(source);
  const typeTokens = markTypeAliases(tokens);
  markTypeContexts(tokens, typeTokens);
  // Types are copied through verbatim, whatever the renamers did to their tokens.
  const typeText = new Map();
  if (typeTokens.size) {
    for (const idx of typeTokens) {
      const tk = tokens[idx];
      if (tk && tk.t !== 'ws' && tk.t !== 'comment') typeText.set(idx, tk.text);
    }
  }
  const declarations = collectDeclarations(tokens);

  let renamedFields = 0;
  let renamedGlobals = 0;
  if (opts.renameFields || opts.renameGlobals) {
    const struct = renameStructure(tokens, opts, declarations.names);
    renamedFields = struct.fields;
    renamedGlobals = struct.globals;
  }

  const renamedLocals = opts.renameIdentifiers ? renameLocals(tokens, declarations) : 0;

  const sourceAll = source + tokens.map((t) => t.text).join('');
  const decoder = randomName(sourceAll);
  const decoder2 = randomName(sourceAll + decoder);
  const alphabet = makeAlphabet();
  const alphabet2 = makeAlphabet();
  const cipher = makeCipher(alphabet);
  const cipher2 = makeCipher(alphabet2);
  const sboxPack = packBytes(SBOX, alphabet);
  const sboxPack2 = packBytes(SBOX, alphabet2);
  const decoder3 = randomName(sourceAll + decoder + decoder2);
  const alphabet3 = makeAlphabet();
  const cipher3 = makeCipher(alphabet3);
  const sboxPack3 = packBytes(SBOX, alphabet3);
  const codec = makeCodec({ decoder, cipher }, { decoder: decoder2, cipher: cipher2 });
  const seenBase =
    sourceAll +
    decoder +
    decoder2 +
    decoder3 +
    alphabet +
    alphabet2 +
    alphabet3 +
    sboxPack +
    sboxPack2 +
    sboxPack3;

  let encodedStrings = 0;
  let encodedNumbers = 0;

  const parts = [];
  let hiddenGlobals = 0;
  let hiddenMembers = 0;
  const envName = randomName(sourceAll);
  const callName = randomName(sourceAll + envName);

  // Each hidden word is only ever referred to by a slot number; the slots are
  // filled at run time by buildNameTable().
  const hiddenKeys = new Map();
  const hideKey = (text) => {
    let slot = hiddenKeys.get(text);
    if (slot === undefined) {
      slot = hiddenKeys.size;
      hiddenKeys.set(text, slot);
    }
    return `\u0001${slot}\u0001`;
  };

  const members = planMembers(tokens, opts, { hideKey, envName, callName, declarations, skip: typeTokens });

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (typeText.has(i)) {
      parts.push(typeText.get(i));
      continue;
    }
    if (members.prefixes.has(i)) parts.push(members.prefixes.get(i));
    if (members.skips.has(i)) continue;
    if (members.replacements.has(i)) {
      parts.push(members.replacements.get(i));
      continue;
    }
    if (tk.t === 'ws') {
      // One-line output: every run of whitespace becomes a single space, which
      // Lua treats the same as a newline.
      parts.push(opts.singleLine ? ' ' : tk.text);
      continue;
    }
    if (tk.t === 'comment') {
      if (!opts.stripComments) {
        parts.push(tk.text);
        // A `--` comment would otherwise swallow the rest of the line.
        if (opts.singleLine && !/^--\[=*\[/.test(tk.text)) parts.push('\n');
      }
      continue;
    }

    if (tk.t === 'string') {
      const parsed = parseShortString(tk.text, 0);
      if (parsed && parsed.end === tk.text.length) {
        parts.push(codec.call(parsed.bytes));
        encodedStrings++;
      } else {
        parts.push(tk.text);
      }
      continue;
    }

    if (tk.t === 'longstring') {
      const long = matchLongBracket(tk.text, 0);
      if (long) {
        let content = tk.text.slice(long.contentStart, long.contentEnd);
        // Lua drops a newline that immediately follows the opening bracket.
        if (content.startsWith('\r\n')) content = content.slice(2);
        else if (content.startsWith('\n')) content = content.slice(1);
        parts.push(codec.call([...encoder.encode(content)]));
        encodedStrings++;
      } else {
        parts.push(tk.text);
      }
      continue;
    }

    if (tk.t === 'number' && opts.encodeNumbers) {
      const encoded = encodeInteger(tk.text, hideKey);
      if (encoded) {
        parts.push(encoded);
        encodedNumbers++;
        continue;
      }
    }

    // `print`, `game`, `Instance`, `string` ... become an env lookup whose key
    // is encoded, so the script never names them.
    if (
      tk.t === 'name' &&
      opts.hideGlobals &&
      HIDABLE_GLOBALS.has(tk.text) &&
      !declarations.declared.has(i) &&
      // the script declares its own local with this name somewhere
      !declarations.localNames.has(tk.text)
    ) {
      const pt = tokens[prevSig(tokens, i)];
      const nt = tokens[nextSig(tokens, i)];
      const isMember = isOp(pt, '.', ':', '::');
      const isDecl = isTok(pt, 'local', 'function', 'goto');
      const isTarget = isOp(nt, '=', '::');
      if (!isMember && !isDecl && !isTarget) {
        parts.push(`${envName}(${hideKey(tk.text)})`);
        hiddenGlobals++;
        continue;
      }
    }

    parts.push(tk.text);
  }

  hiddenMembers = members.count;

  let script = parts.join('');

  const needsRuntime =
    encodedStrings > 0 || hiddenGlobals > 0 || hiddenMembers > 0 || hiddenKeys.size > 0;
  if (needsRuntime) {
    let runtime = vmPrelude(seenBase, decoder, alphabet, sboxPack, cipher, {
      stride: 3,
      cells: 3,
    });
    runtime += vmPrelude(seenBase + runtime, decoder2, alphabet2, sboxPack2, cipher2, {
      stride: 4,
      cells: 4,
    });
    runtime += vmPrelude(seenBase + runtime, decoder3, alphabet3, sboxPack3, cipher3, {
      stride: 4,
      cells: 3,
    });
    runtime += decoyPayloads(
      makeCodec({ decoder: decoder3, cipher: cipher3 }, { decoder, cipher })
    );
    if (hiddenGlobals > 0) runtime += envHelper(envName);
    if (members.usesCall) runtime += callHelper(callName);
    if (hiddenKeys.size > 0) {
      const table = buildNameTable(codec, [decoder, decoder2], hiddenKeys, runtime + sourceAll);
      runtime += table.text;
      script = table.substitute(script);
    }
    runtime += deadCode();
    for (let i = 0, n = 1 + randInt(2); i < n; i++) {
      runtime += shadowRuntime(runtime + sourceAll + i);
    }
    runtime += tamperGuard(codec, runtime + envName + callName);
    script = runtime + opaqueWrap(script, runtime);
  }

  // One more block around everything: the script's own locals stay inside it and
  // the output no longer has the original chunk shape.
  if (!source.startsWith('#')) script = 'do ' + script + ' end';

  // Never expires: the output runs at any time.
  const maxAgeSeconds = 0;

  return {
    script,
    encodedStrings,
    encodedNumbers,
    renamedLocals,
    renamedFields,
    renamedGlobals,
    hiddenGlobals,
    hiddenMembers,
    maxAgeSeconds,
    decoder,
  };
}

/** A couple of side-effect-free no-op statements to break up the shape of the output. */
function deadCode() {
  let out = '';
  const count = 3 + randInt(4);
  for (let i = 0; i < count; i++) {
    const a = 1 + randInt(999);
    const b = 1 + randInt(999);
    const x = mangleName(6);
    const y = mangleName(6);
    const z = mangleName(6);
    const m = 1 + randInt(97);
    const body =
      `local ${x},${y},${z}=${a},${b},0 ` +
      `if ${z}>${x}+${y} and ${x}>${y} and ${y}>${x} then ` +
      `local t={} for i=1,${1 + randInt(9)} do t[i]=(i*${a})%${m} end ` +
      `${z}=#t end `;
    out += `do ${body} end `;
  }
  return out;
}

/**
 * A full decoder runtime that is never used. It is built exactly like the real
 * ones - same tables, decoders and naming - but it sits in a branch that can
 * never be taken, so it only costs file size and reading effort.
 */
function shadowRuntime(seed) {
  const decoder = randomName(seed);
  const alphabet = makeAlphabet();
  const cipher = makeCipher(alphabet);
  const sboxPack = packBytes(SBOX, alphabet);
  const prelude = vmPrelude(seed + decoder + alphabet + sboxPack, decoder, alphabet, sboxPack, cipher, {
    stride: 3 + randInt(2),
    cells: 3 + randInt(2),
  });
  const a = 1 + randInt(991);
  const b = 1 + randInt(991);
  return `if (${a}*${b})%7+1==(${a}*${b})%7 then ${prelude} end `;
}

export { obfuscate };














const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};


export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const domain = url.origin; // get service full link
    const userAgent = request.headers.get('User-Agent') || ''; // get User-Agent    
    const pathname = decodeURIComponent(url.pathname.slice(1)); // remove leading '/'
    const auth = url.searchParams.get("auth"); // get key in '?auth=Key'
    const K = url.searchParams.get("K"); // get key in '?K=Key'

    // CORS HEADERS (DO NOT REMOVE IT)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    
    
    if (pathname && pathname === "testing") {
      const script = `print("Obfuscator is working!")`;
      const result = obfuscate(script);
      return new Response(result.script, { status: 200, headers: { "Content-Type": "text/plain", ...CORS }});
    }
    
    if (pathname && pathname === "source" && auth) {
      const exp = DecodeText(auth, ServiceKey);
      if (exp < Date.now()) {
         return new Response(`404: Not Found`, { status: 404, headers: { "Content-Type": "text/plain", ...CORS }});
      }
      return new Response(`print("Hello World")`, { status: 200, headers: { "Content-Type": "text/plain", ...CORS }});
    }





    
    // Handle Access Scripts
    if (pathname && auth && K) {
      const key = pathname;
      const data = JSON.parse(DecodeText(auth, ServiceKey));
      const req_data = await fetch(ScriptsLink + key + ".lua");     
      let script = await req_data.text();
      
      if (!req_data.ok) {
        return new Response(`${req_data.status}: Failed to fetch content`, { status: 500, headers: { "Content-Type": "text/plain", ...CORS }});
      }
      
      if (!script) {
        return new Response(`404: Not Found`, { status: 404, headers: { "Content-Type": "text/plain", ...CORS }});
      }

      // Detect if data decoded error
      if (!data || typeof data !== 'object' || !('Expiration' in data)) {
         return new Response(`404: Not Found`, { status: 404, headers: { "Content-Type": "text/plain", ...CORS }});
      }
      
      // Detect if Access ID is Expired
      if (data.Expiration < Date.now()) {
         return new Response(`404: Not Found`, { status: 404, headers: { "Content-Type": "text/plain", ...CORS }});
      }

      // Obfuscate Script
      const result = obfuscate(script);
      script = result.script;
      //
      
      /*
      const decodedStr = GetRandomString(4);
      const fnStr = GetRandomString(5);
      const objStr = GetRandomString(18);
      const content = `game:GetService("ReplicatedStorage"):WaitForChild("${data.Name}").Value = math.random(1, 1000000000)\n${script}`;
      const encoded = EncodeScript(content, String(K));
      const payload = `local a = game local b = "GetService" local c = "ReplicatedStorage" local d = "Destroy" local ${objStr} = a[b](a, c)["${data.Name}"].Value local ${fnStr}="";for _, c in ipairs({${GetNumberWithMath(108)}, ${GetNumberWithMath(111)}, ${GetNumberWithMath(97)}, ${GetNumberWithMath(100)}, ${GetNumberWithMath(115)}, ${GetNumberWithMath(116)}, ${GetNumberWithMath(114)}, ${GetNumberWithMath(105)}, ${GetNumberWithMath(110)}, ${GetNumberWithMath(103)}}) do ${fnStr}=${fnStr}..string.char(c);end(getfenv()[${fnStr}] or _G[${fnStr}] or _ENV and _ENV[${fnStr}])((function(str, key) local function ${decodedStr}(encodedStr, key) local result = {} local parts = string.split(encodedStr, "/") for i = 1, #parts do local byte = tonumber(parts[i]) local k = key:byte(((i - 1) % #key) + 1) local decoded = (byte - k + 256) % 256 table.insert(result, string.char(decoded)) end return table.concat(result) end  return ${decodedStr}(str, key) end)("${encoded}", ${objStr}))()`;
      */
      
      return new Response(script, { 
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...CORS 
        }
      });
    }

    // Serve the requested script directly (no loadstring, no key dance)
    if (pathname) {
      const res = await fetch(ScriptsLink + pathname + ".lua");
      if (!res.ok) {
        return new Response("404: Not Found", { status: 404, headers: { "Content-Type": "text/plain", ...CORS }});
      }
      
      const randomName = GetRandomName();
      const json = JSON.stringify({ Name: randomName, Expiration: Date.now() + 5000 });
      const genkeyStr = GetRandomString(11);
      const antihookcode = await fetch("https://raw.githubusercontent.com/MainScripts352/MainScripts352/refs/heads/main/Anti%20Hook%20Source");
      const generatekeycode = `local function ${genkeyStr}(length) local chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" local key = "" for i = 1, length do local randIndex = math.random(1, #chars) key = key .. string.sub(chars, randIndex, randIndex) end return key end`;
      const code = `${await antihookcode.text()}\n${generatekeycode} local t={[1]=Instance,[2]="new",[3]="StringValue",[4]=game,[5]="GetService",[6]="ReplicatedStorage",[7]="Parent",[8]="Name",[9]="Archivable",[10]="Value",[11]=true,[12]=${genkeyStr}(64),[13]="${randomName}"} local v=t[1][t[2]](t[3])v[t[7]]=t[4][t[5]](t[4], t[6])v[t[8]]=t[13]v[t[9]]=t[11]v[t[10]]=t[12] loadstring(game:HttpGet("${domain}/${url.pathname.slice(1)}?auth=${EncodeText(json, ServiceKey)}&K="..game:GetService("ReplicatedStorage")["${randomName}"].Value))()`;
      
      const result = obfuscate(code);

      return new Response(result.script, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...CORS }
      });
    }
      

    return new Response("404: Not Found", { status: 404, headers: { "Content-Type": "text/plain", ...CORS }});
  }
}
