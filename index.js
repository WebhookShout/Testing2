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

// Encode Ascii Function
function encodeAscii(str) {
  return str
    .split('')
    .map(char => char.charCodeAt(0))
    .join('\\');
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














/**
 * Roblox / Luau script obfuscator — standalone library for Cloudflare Workers.
 *
 *   import { Obfuscate } from "./obfuscator.js";
 *
 *   const encoded = Obfuscate(script);
 *
 * Everything is on by default:
 *   - strip comments
 *   - rename local variables, parameters and loop variables
 *   - rename table fields on tables the script owns
 *   - rename global functions the script defines
 *   - hide builtin globals (print, game, Instance, string, ...)
 *   - encode numbers
 *   - encode strings (per-string XOR keystream, letter-only payload)
 *   - the result only runs while it is younger than 10 seconds
 *
 * Any of it can be changed with a second argument, for example:
 *   Obfuscate(script, { maxAgeSeconds: 60 })
 *   Obfuscate(script, { maxAgeSeconds: 0, hideGlobals: false })
 *
 * This is code protection, not a security boundary: a determined reader can
 * still run the script and recover what it builds.
 */

const MAX_SCRIPT_BYTES = 512 * 1024;

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

function randomName(source) {
  for (let attempt = 0; attempt < 50; attempt++) {
    let name = '_' + LOWER[randInt(26)];
    for (let i = 0; i < 7; i++) name += ALNUM[randInt(36)];
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
  while (j < src.length && src[j] !== '\n') {
    if (src[j] === '\\') {
      j += 2;
      continue;
    }
    if (src[j] === quote) return j + 1;
    j++;
  }
  return i + 1;
}

/* ------------------------------------------------------------------ */
/* tokenizer                                                           */
/* ------------------------------------------------------------------ */

const OPS3 = ['...', '..='];
const OPS2 = ['..', '==', '~=', '<=', '>=', '//', '::', '->', '+=', '-=', '*=', '/=', '%=', '^='];
const WS_CHARS = ' \t\r\n\f\v';

function tokenize(src) {
  const out = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

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
      const m = /^(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/.exec(
        src.slice(i),
      );
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

    out.push({ t: 'op', text: ch });
    i += 1;
  }

  return out;
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
      fresh = '_' + LOWER[randInt(26)];
      for (let k = 0; k < 6 + randInt(3); k++) fresh += ALNUM[randInt(36)];
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
    name = '_' + LOWER[randInt(26)];
    for (let k = 0; k < 6 + randInt(3); k++) name += ALNUM[randInt(36)];
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

const HEXISH = 'abcdefghijklmnopqrstuvwxyz';

function makeAlphabet() {
  const pool = [...HEXISH].sort(() => Math.random() - 0.5);
  return pool.slice(0, 16).join('');
}

/** Encodes one string literal into a decoder call with XOR'd, letter-only payload. */
function encodeBytes(decoderName, bytes, alphabet, encodeKey, countIt = true) {
  const key = 1 + randInt(1 << 20);
  let body = '';
  for (let i = 0; i < bytes.length; i++) {
    // Decoder walks the hex text two chars at a time, so its counter for this
    // byte is 2*i+1. Keep both sides on the same keystream index.
    const cipher = (bytes[i] ^ key ^ ((2 * i + 1) * 29)) & 0xff;
    body += alphabet[cipher >> 4] + alphabet[cipher & 15];
  }
  return `${decoderName}("${body}",${encodeKey(key)})`;
}

function encodeInteger(text) {
  let value;
  if (/^0[xX][0-9a-fA-F]+$/.test(text)) value = parseInt(text.slice(2), 16);
  else if (/^[0-9]+$/.test(text)) value = parseInt(text, 10);
  else return null;
  if (!Number.isFinite(value) || value > 1e12) return null;
  const r = 1 + randInt(5000);
  return `(${value + r}-${r})`;
}

/* ------------------------------------------------------------------ */
/* the obfuscator                                                      */
/* ------------------------------------------------------------------ */

const DEFAULTS = {
  stripComments: true,
  renameIdentifiers: true,
  renameFields: true,
  renameGlobals: true,
  encodeNumbers: true,
  hideGlobals: true,
  maxAgeSeconds: 10,
};

/**
 * Lets the script run only while it is `seconds` old or younger.
 *
 * The obfuscation time is baked in; at run time it is compared against
 * `os.time()`. If the clock cannot be read, the script is allowed to run rather
 * than silently doing nothing.
 */
function expiryPrelude(seconds) {
  const stamp = Math.floor(Date.now() / 1000);
  const jitter = 1 + randInt(5000);
  const n = () => '_' + LOWER[randInt(26)] + ALNUM[randInt(36)] + ALNUM[randInt(36)] + randInt(100);
  const F = n();
  const ok = n();
  const now = n();

  return (
    `local ${F}=(function()\n` +
    `local ${ok},${now}=pcall(function() return os.time() end)\n` +
    `if not ${ok} or type(${now})~="number" then return true end\n` +
    `return ${now}-(${stamp + jitter}-${jitter})<=${seconds}\n` +
    `end)()\n` +
    `if not ${F} then return end\n`
  );
}

/** Resolves `print`, `game`, `Instance` ... out of the script's own environment. */
function envHelper(name) {
  return (
    `local ${name}=(function()\n` +
    `local E=nil\n` +
    `local ok,env=pcall(function() return getfenv(0) end)\n` +
    `if ok and type(env)=="table" then E=env end\n` +
    `if type(E)~="table" then E=_G end\n` +
    `return function(k)\n` +
    `local v=E[k]\n` +
    `if v==nil and E~=_G then v=_G[k] end\n` +
    `return v\n` +
    `end\n` +
    `end)()\n`
  );
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
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);

  const tokens = tokenize(source);
  const declarations = collectDeclarations(tokens);

  let renamedFields = 0;
  let renamedGlobals = 0;
  if (opts.renameFields || opts.renameGlobals) {
    const struct = renameStructure(tokens, opts, declarations.names);
    renamedFields = struct.fields;
    renamedGlobals = struct.globals;
  }

  const renamedLocals = opts.renameIdentifiers ? renameLocals(tokens, declarations) : 0;

  const decoder = randomName(source + tokens.map((t) => t.text).join(''));
  const alphabet = makeAlphabet();

  let encodedStrings = 0;
  let encodedNumbers = 0;

  const encodeKey = (key) => {
    if (!opts.encodeNumbers) return String(key);
    return encodeInteger(String(key)) || String(key);
  };

  const parts = [];
  let hiddenGlobals = 0;
  const envName = randomName(source + tokens.map((t) => t.text).join(''));

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t === 'ws') {
      parts.push(tk.text);
      continue;
    }
    if (tk.t === 'comment') {
      if (!opts.stripComments) parts.push(tk.text);
      continue;
    }

    if (tk.t === 'string') {
      const parsed = parseShortString(tk.text, 0);
      if (parsed && parsed.end === tk.text.length) {
        parts.push(encodeBytes(decoder, parsed.bytes, alphabet, encodeKey));
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
        parts.push(encodeBytes(decoder, [...encoder.encode(content)], alphabet, encodeKey));
        encodedStrings++;
      } else {
        parts.push(tk.text);
      }
      continue;
    }

    if (tk.t === 'number' && opts.encodeNumbers) {
      const encoded = encodeInteger(tk.text);
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
        const key = encodeBytes(decoder, [...encoder.encode(tk.text)], alphabet, encodeKey, false);
        parts.push(`${envName}(${key})`);
        hiddenGlobals++;
        continue;
      }
    }

    parts.push(tk.text);
  }

  let script = parts.join('');

  const needsRuntime = encodedStrings > 0 || hiddenGlobals > 0;
  if (needsRuntime) {
    const codes = [...alphabet].map((c) => c.charCodeAt(0)).join(',');
    const prelude =
      `local ${decoder}=function(s,k)local A=string.char(${codes})local o={}local f=string.find ` +
      `local ch=string.char for i=1,#s,2 do ` +
      `o[#o+1]=ch(bit32.bxor((f(A,s:sub(i,i),1,true)-1)*16+(f(A,s:sub(i+1,i+1),1,true)-1),k,i*29)%256)` +
      `end return table.concat(o)end\n`;
    script = prelude + (hiddenGlobals > 0 ? envHelper(envName) : '') + deadCode() + script;
  }

  const maxAgeSeconds =
    typeof opts.maxAgeSeconds === 'number' && opts.maxAgeSeconds > 0 ? opts.maxAgeSeconds : 0;
  if (maxAgeSeconds > 0) script = expiryPrelude(maxAgeSeconds) + script;

  return {
    script,
    encodedStrings,
    encodedNumbers,
    renamedLocals,
    renamedFields,
    renamedGlobals,
    hiddenGlobals,
    maxAgeSeconds,
    decoder,
  };
}

/** A couple of side-effect-free no-op statements to break up the shape of the output. */
function deadCode() {
  const name = () => '_' + LOWER[randInt(26)] + LOWER[randInt(26)] + randInt(100);
  let out = '';
  const count = 1 + randInt(2);
  for (let i = 0; i < count; i++) {
    const a = 1 + randInt(999);
    const b = 1 + randInt(999);
    out += `do local ${name()},${name()}=${a},${b} if ${a}>${b} and ${b}>${a} then end end\n`;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* the function you call                                              */
/* ------------------------------------------------------------------ */

/**
 * Obfuscate a Roblox / Luau script.
 *
 * @param {string} script the original Luau source
 * @param {object} [options] optional overrides for any default above
 * @returns {string} the obfuscated script, ready to paste into Roblox
 */
export function Obfuscate(script, options = {}) {
  return obfuscate(script, { ...DEFAULTS, ...options }).script;
}

/**
 * Same as Obfuscate(), plus the counters (strings encoded, names renamed, ...).
 *
 * @param {string} script
 * @param {object} [options]
 */
export function ObfuscateDetailed(script, options = {}) {
  return obfuscate(script, { ...DEFAULTS, ...options });
}


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
      const result = obfuscate(script, { ...DEFAULTS });
      script = result.script;
      //

      
      const decodedStr = GetRandomString(4);
      const fnStr = GetRandomString(5);
      const objStr = GetRandomString(18);
      const content = `game:GetService("ReplicatedStorage"):WaitForChild("${data.Name}").Value = math.random(1, 1000000000)\n${script}`;
      const encoded = EncodeScript(content, String(K));
      const payload = `local a = game local b = "GetService" local c = "ReplicatedStorage" local d = "Destroy" local ${objStr} = a[b](a, c)["${data.Name}"].Value local ${fnStr}="";for _, c in ipairs({${GetNumberWithMath(108)}, ${GetNumberWithMath(111)}, ${GetNumberWithMath(97)}, ${GetNumberWithMath(100)}, ${GetNumberWithMath(115)}, ${GetNumberWithMath(116)}, ${GetNumberWithMath(114)}, ${GetNumberWithMath(105)}, ${GetNumberWithMath(110)}, ${GetNumberWithMath(103)}}) do ${fnStr}=${fnStr}..string.char(c);end(getfenv()[${fnStr}] or _G[${fnStr}] or _ENV and _ENV[${fnStr}])((function(str, key) local function ${decodedStr}(encodedStr, key) local result = {} local parts = string.split(encodedStr, "/") for i = 1, #parts do local byte = tonumber(parts[i]) local k = key:byte(((i - 1) % #key) + 1) local decoded = (byte - k + 256) % 256 table.insert(result, string.char(decoded)) end return table.concat(result) end  return ${decodedStr}(str, key) end)("${encoded}", ${objStr}))()`;
      
      return new Response(payload, { 
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...CORS 
        }
      });
    }

    // Authorize Specific Key
    if (pathname) { 
      const randomName = GetRandomName();
      const json = JSON.stringify({ Name: randomName, Expiration: Date.now() + 3500 });
      const genkeyStr = GetRandomString(11);
      const antihookcode = await fetch("https://raw.githubusercontent.com/MainScripts352/MainScripts352/refs/heads/main/Anti%20Hook%20Source");
      const generatekeycode = `local function ${genkeyStr}(length) local chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" local key = "" for i = 1, length do local randIndex = math.random(1, #chars) key = key .. string.sub(chars, randIndex, randIndex) end return key end`;
      const code = `${await antihookcode.text()}\nloadstring("\\${encodeAscii(`${generatekeycode} local t={[1]=Instance,[2]="new",[3]="StringValue",[4]=game,[5]="GetService",[6]="ReplicatedStorage",[7]="Parent",[8]="Name",[9]="Archivable",[10]="Value",[11]=true,[12]=${genkeyStr}(64),[13]="${randomName}"} local v=t[1][t[2]](t[3])v[t[7]]=t[4][t[5]](t[4], t[6])v[t[8]]=t[13]v[t[9]]=t[11]v[t[10]]=t[12] loadstring(game:HttpGet("${domain}/${url.pathname.slice(1)}?auth=${EncodeText(json, ServiceKey)}&K="..game:GetService("ReplicatedStorage")["${randomName}"].Value))()`)}")()`;

      return new Response(code, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...CORS }
      });
    }


    

    return new Response("404: Not Found", { status: 404, headers: { "Content-Type": "text/plain", ...CORS }});
  }
}
