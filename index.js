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
 * Cloudflare Worker — Luau / Roblox script obfuscator (stronger build)
 *
 * What it does to the script it is given:
 *   1. Removes comments (-- line comments and --[[ ]] block comments).
 *   2. Renames every local variable, function parameter and loop variable.
 *   3. Renames table fields and global functions the script defines itself.
 *   4. Hides builtin globals (print, game, Instance, string, ...) behind
 *      encoded environment lookups.
 *   5. Hides every property, method and service name — Parent, Transparency,
 *      GetService, RunService, HttpService, JSONEncode, JSONDecode, UrlEncode,
 *      ... — behind encoded bracket keys, including methods called on the
 *      result of another call.
 *   6. Encrypts every string literal with AES-128 in CTR mode, written in a
 *      symbol-heavy alphabet ('@#$%^&*()' and friends) so the payloads read as
 *      noise, padded to whole blocks so their length does not leak, cut into
 *      fragments the runtime joins backwards, with decoy payloads mixed in.
 *      Every number is encoded too: integers become arithmetic, decimals and
 *      exponents travel as encrypted text and are parsed at run time. The AES
 *      key is only carried RSA-encrypted and is unwrapped inside the runtime
 *      prelude.
 *   7. Decrypts a canary token before anything happens: if the decoder is not
 *      the one that was built here, the whole chunk returns quietly.
 *   8. Wraps the body in an always-true arithmetic test with a dead branch, and
 *      stores every hidden name in one table at shuffled slots, so a name never
 *      sits next to the code that uses it.
 *   9. Squeezes the whole result onto one line.
 *  10. Adds a 10 second freshness guard.
 *
 * The script keeps behaving exactly like the original. This is code
 * protection, not a security boundary: someone can still run the script and
 * read the strings it builds.
 *
 * Deploy: paste into a Worker, or `npx wrangler deploy` this file as your
 * entrypoint. Then:
 *   POST /            JSON  { "script": "print('hi')", "renameIdentifiers": true,
 *                             "encodeNumbers": true, "stripComments": true }
 *   POST /            raw text body (the script itself)
 *   GET  /            a page with a text box to try it
 *
 * Response: { "success": true, "script": "<obfuscated>", ... }
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

// Names are deliberately long and made of lookalike characters (I, l, 1, O, 0)
// and underscores, so two generated names are hard to tell apart while reading.
const MANGLED_POOL = 'iIlmnoO01_';

function mangleName(minLength = 6) {
  let name = '_';
  const length = minLength + randInt(12);
  for (let i = 0; i < length; i++) name += MANGLED_POOL[randInt(MANGLED_POOL.length)];
  return name;
}

function randomName(source) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = mangleName(8);
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
 * Encodes one string into a decoder call. The payload is cut into two or three
 * fragments and listed backwards, and the runtime joins them from the last one
 * down, so a tool that simply concatenates the literals gets nonsense.
 */
function encodeBytes(decoderName, bytes, cipher) {
  const payload = cipher.encrypt(bytes);
  const want = 2 + randInt(2);
  const size = Math.ceil(payload.length / want);
  const cuts = [];
  for (let i = 0; i < payload.length; i += size) cuts.push(payload.slice(i, i + size));
  if (cuts.length < 2) return `${decoderName}("${payload}")`;
  cuts.reverse();
  return `${decoderName}({${cuts.map((c) => `"${c}"`).join(',')}})`;
}

function encodeInteger(text, hideText) {
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
/* payload cipher: AES-128-CTR with an RSA-wrapped key                  */
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

/** The AES S-box, derived once so it never has to be typed out by hand. */
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
const xtime = (a) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff;

function expandAesKey(keyBytes) {
  const rk = keyBytes.slice();
  let rcon = 1;
  for (let i = 16; i < 176; i += 4) {
    let t;
    if (i % 16 === 0) {
      t = [SBOX[rk[i - 3]] ^ rcon, SBOX[rk[i - 2]], SBOX[rk[i - 1]], SBOX[rk[i - 4]]];
      rcon = xtime(rcon);
    } else {
      t = [rk[i - 4], rk[i - 3], rk[i - 2], rk[i - 1]];
    }
    for (let j = 0; j < 4; j++) rk[i + j] = rk[i - 16 + j] ^ t[j];
  }
  return rk;
}

/** One AES-128 block, encryption direction (all CTR needs). */
function aesEncryptBlock(rk, input) {
  const st = new Array(16);
  for (let i = 0; i < 16; i++) st[i] = input[i] ^ rk[i];

  for (let round = 1; round <= 10; round++) {
    const t = new Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) t[r + 4 * c] = SBOX[st[r + 4 * ((c + r) & 3)]];
    }
    if (round < 10) {
      for (let c = 0; c < 4; c++) {
        const a0 = t[4 * c];
        const a1 = t[4 * c + 1];
        const a2 = t[4 * c + 2];
        const a3 = t[4 * c + 3];
        t[4 * c] = xtime(a0) ^ xtime(a1) ^ a1 ^ a2 ^ a3;
        t[4 * c + 1] = a0 ^ xtime(a1) ^ xtime(a2) ^ a2 ^ a3;
        t[4 * c + 2] = a0 ^ a1 ^ xtime(a2) ^ xtime(a3) ^ a3;
        t[4 * c + 3] = xtime(a0) ^ a0 ^ a1 ^ a2 ^ xtime(a3);
      }
    }
    for (let i = 0; i < 16; i++) st[i] = t[i] ^ rk[16 * round + i];
  }
  return st;
}

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
 * Real RSA maths with a 31-32 bit modulus: the AES key seed is encrypted with
 * the public exponent and the script carries only the private exponent, so the
 * key never appears in the output as a plain number.
 */
function wrapAesKey() {
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
    return { n, d: Number(d), c, keyBytes: parkBytes(seed) };
  }
}

/** Park-Miller expansion of the 31 bit seed into a 16 byte AES key. */
function parkBytes(seed) {
  let x = seed % PM_MOD;
  if (x <= 0) x += PM_MOD - 1;
  const out = [];
  for (let i = 0; i < 16; i++) {
    x = (x * 48271) % PM_MOD;
    out.push(x % 256);
  }
  return out;
}

/** Bytes as two characters per byte, using only the random alphabet. */
function packBytes(bytes, alphabet) {
  let out = '';
  for (const b of bytes) out += alphabet[b >> 4] + alphabet[b & 15];
  return out;
}

/**
 * AES-128 in CTR mode: each payload starts with a random 8 byte nonce and is
 * XORed with the keystream of AES(nonce || counter).
 */
function makeCipher(alphabet) {
  const wrapped = wrapAesKey();
  const rk = expandAesKey(wrapped.keyBytes);

  const encrypt = (bytes) => {
    // Pad to a whole number of 16 byte blocks, so two strings of different
    // lengths do not give their lengths away. The first plaintext byte says how
    // much padding to drop again.
    const padLen = (16 - ((bytes.length + 1) % 16)) % 16;
    const data = [padLen, ...bytes];
    for (let k = 0; k < padLen; k++) data.push(randInt(256));

    const nonce = new Uint8Array(8);
    crypto.getRandomValues(nonce);
    const payload = [...nonce];
    for (let j = 0; j < data.length; j += 16) {
      const counter = j / 16 + 1;
      const block = [
        ...nonce,
        0, 0, 0, 0,
        (counter >>> 24) & 255,
        (counter >>> 16) & 255,
        (counter >>> 8) & 255,
        counter & 255,
      ];
      const ks = aesEncryptBlock(rk, block);
      for (let k = 0; k < 16 && j + k < data.length; k++) payload.push(data[j + k] ^ ks[k]);
    }
    return packBytes(payload, alphabet);
  };

  return { n: wrapped.n, d: wrapped.d, c: wrapped.c, encrypt };
}

/**
 * Every hidden word is decrypted once, into one table, but each word goes into a
 * random slot and the assignments are written in random order. The body only
 * ever mentions a slot number, so a name and the place it is used are never
 * next to each other in the file.
 */
function buildNameTable(decoder, cipher, hiddenKeys, seen) {
  const [T] = preludeNames(seen + 'nameTable', 1);
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
    lines.push(`${T}[${slot}]=${encodeBytes(decoder, [...encoder.encode(word)], cipher)} `);
  }

  // A few junk slots, so the table does not read like a tidy list of names.
  const junk = 2 + randInt(3);
  for (let i = 0; i < junk; i++) {
    const slot = pickSlot();
    const bytes = [];
    const len = 2 + randInt(9);
    for (let k = 0; k < len; k++) bytes.push(33 + randInt(90));
    lines.push(`${T}[${slot}]=${encodeBytes(decoder, bytes, cipher)} `);
  }

  lines.sort(() => Math.random() - 0.5);

  return {
    text: `local ${T}={} ` + lines.join(''),
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
function tamperGuard(decoder, cipher, seen) {
  const len = 6 + randInt(6);
  const bytes = [];
  for (let i = 0; i < len; i++) bytes.push(33 + randInt(90));
  let sum = 0;
  for (let i = 0; i < len; i++) sum = (sum + ((bytes[i] * (i + 1)) % 251)) % 251;

  const call = encodeBytes(decoder, bytes, cipher);
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
function decoyPayloads(decoder, cipher) {
  const count = 2 + randInt(3);
  const holes = [];
  for (let i = 0; i < count; i++) {
    const bytes = [];
    const len = 2 + randInt(10);
    for (let k = 0; k < len; k++) bytes.push(randInt(256));
    holes.push(encodeBytes(decoder, bytes, cipher));
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

/**
 * The Lua side of the cipher: alphabet, S-box, AES encryption, CTR keystream,
 * the RSA unwrap and the cached decoder call the payloads are wrapped in.
 */
function aesPrelude(source, decoder, alphabet, sboxPack, cipher) {
  const [A, S, U, P, X, M, KB, R, E, C] = preludeNames(source + decoder, 10);

  return (
    `local ${A}="${alphabet}" ` +
    `local ${S}={} ` +
    `local ${U}=function(v)return string.find(${A},v,1,true)-1 end ` +
    `local ${P}="${sboxPack}" ` +
    `for i=1,#${P},2 do ${S}[#${S}+1]=${U}(${P}:sub(i,i))*16+${U}(${P}:sub(i+1,i+1)) end ` +
    `local ${X}=function(v)local d=bit32.band(bit32.lshift(v,1),255)if bit32.band(v,128)~=0 then d=bit32.bxor(d,27)end return d end ` +
    `local ${M}=function(a,b,m)local r=0 while b>0 do if b%2==1 then r=(r+a)%m end a=(a*2)%m b=math.floor(b/2)end return r end ` +
    `local ${KB}=(function(c,d,n)local r=1 c=c%n while d>0 do if d%2==1 then r=${M}(r,c,n)end c=${M}(c,c,n)d=math.floor(d/2)end ` +
    `local x=r%2147483647 if x<=0 then x=x+2147483646 end local kb={}for i=1,16 do x=(x*48271)%2147483647 kb[i]=x%256 end return kb end)(${cipher.c},${cipher.d},${cipher.n}) ` +
    `local ${R}=(function(kb)local k={}for i=1,16 do k[i]=kb[i]end local rc=1 local i=17 while i<=176 do local t ` +
    `if (i-1)%16==0 then t={bit32.bxor(${S}[k[i-3]+1],rc),${S}[k[i-2]+1],${S}[k[i-1]+1],${S}[k[i-4]+1]}rc=${X}(rc)else t={k[i-4],k[i-3],k[i-2],k[i-1]}end ` +
    `for j=0,3 do k[i+j]=bit32.bxor(k[i-16+j],t[j+1])end i=i+4 end return k end)(${KB}) ` +
    `local ${E}=function(m)local st={}for i=1,16 do st[i]=bit32.bxor(m[i],${R}[i])end for r=1,10 do local t={} ` +
    `for c=0,3 do for q=0,3 do t[q+4*c+1]=${S}[st[q+4*((c+q)%4)+1]+1]end end ` +
    `if r<10 then for c=0,3 do local a0,a1,a2,a3=t[4*c+1],t[4*c+2],t[4*c+3],t[4*c+4] ` +
    `t[4*c+1]=bit32.bxor(${X}(a0),${X}(a1),a1,a2,a3)t[4*c+2]=bit32.bxor(a0,${X}(a1),${X}(a2),a2,a3) ` +
    `t[4*c+3]=bit32.bxor(a0,a1,${X}(a2),${X}(a3),a3)t[4*c+4]=bit32.bxor(${X}(a0),a0,a1,a2,${X}(a3))end end ` +
    `for i=1,16 do st[i]=bit32.bxor(t[i],${R}[16*r+i])end end return st end ` +
    `local ${C}={} ` +
    `local ${decoder}=function(s)if type(s)=="table" then local r={}for u=#s,1,-1 do r[#r+1]=s[u]end s=table.concat(r)end ` +
    `local v=${C}[s]if v then return v end ` +
    `local n=math.floor(#s/2)local b={}for i=1,n do b[i]=${U}(s:sub(2*i-1,2*i-1))*16+${U}(s:sub(2*i,2*i))end ` +
    `local o={}local c=0 local i=9 while i<=n do c=c+1 ` +
    `local m={b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8],0,0,0,0,0,0,0,0} ` +
    `m[13]=math.floor(c/16777216)%256 m[14]=math.floor(c/65536)%256 m[15]=math.floor(c/256)%256 m[16]=c%256 ` +
    `local k=${E}(m)local j=1 while j<=16 and i<=n do o[#o+1]=string.char(bit32.bxor(b[i],k[j]))i=i+1 j=j+1 end end ` +
    `v=table.concat(o)local p=string.byte(v,1)or 0 v=v:sub(2,#v-p)${C}[s]=v return v end `
  );
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
  hideMembers: true,
  singleLine: true,
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
    `local ${F}=(function() ` +
    `local ${ok},${now}=pcall(function() return os.time() end) ` +
    `if not ${ok} or type(${now})~="number" then return true end ` +
    `return ${now}-(${stamp + jitter}-${jitter})<=${seconds} ` +
    `end)() ` +
    `if not ${F} then return end `
  );
}

/** Resolves `print`, `game`, `Instance` ... out of the script's own environment. */
function envHelper(name) {
  return (
    `local ${name}=(function() ` +
    `local E=nil ` +
    `local ok,env=pcall(function() return getfenv(0) end) ` +
    `if ok and type(env)=="table" then E=env end ` +
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

  const sourceAll = source + tokens.map((t) => t.text).join('');
  const decoder = randomName(sourceAll);
  const alphabet = makeAlphabet();
  const cipher = makeCipher(alphabet);
  const sboxPack = packBytes(SBOX, alphabet);

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

  const members = planMembers(tokens, opts, { hideKey, envName, callName, declarations });

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
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
        parts.push(encodeBytes(decoder, parsed.bytes, cipher));
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
        parts.push(encodeBytes(decoder, [...encoder.encode(content)], cipher));
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
    let runtime = aesPrelude(sourceAll, decoder, alphabet, sboxPack, cipher);
    runtime += decoyPayloads(decoder, cipher);
    if (hiddenGlobals > 0) runtime += envHelper(envName);
    if (members.usesCall) runtime += callHelper(callName);
    if (hiddenKeys.size > 0) {
      const table = buildNameTable(decoder, cipher, hiddenKeys, runtime + sourceAll);
      runtime += table.text;
      script = table.substitute(script);
    }
    runtime += deadCode();
    runtime += tamperGuard(decoder, cipher, runtime + envName + callName);
    script = runtime + opaqueWrap(script, runtime);
  }

  // One more block around everything: the script's own locals stay inside it and
  // the output no longer has the original chunk shape.
  if (!source.startsWith('#')) script = 'do ' + script + ' end';

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
    hiddenMembers,
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
    out += `do local ${name()},${name()}=${a},${b} if ${a}>${b} and ${b}>${a} then end end `;
  }
  return out;
}

export { obfuscate };

/* ------------------------------------------------------------------ */
/* worker                                                              */
/* ------------------------------------------------------------------ */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

const PAGE = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Roblox script obfuscator</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; padding:24px; font:15px/1.5 ui-sans-serif,system-ui,sans-serif; background:#111318; color:#e8eaf0; }
  h1 { font-size:18px; margin:0 0 4px; }
  p  { margin:0 0 14px; color:#9aa3b2; font-size:13px; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media (max-width:820px) { .row { grid-template-columns:1fr; } }
  textarea { width:100%; height:340px; box-sizing:border-box; padding:10px; border-radius:8px;
             border:1px solid #2a2f3a; background:#0b0d12; color:#dfe3ec;
             font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace; resize:vertical; }
  button { margin:12px 0; padding:9px 16px; border-radius:8px; border:0; background:#4f7cff; color:#fff;
           font-weight:600; cursor:pointer; }
  button:disabled { opacity:.6; cursor:default; }
  .opts { display:flex; flex-wrap:wrap; gap:16px; color:#9aa3b2; font-size:13px; margin-top:4px; }
  .opts label { display:flex; align-items:center; gap:6px; cursor:pointer; }
  .err { color:#ff6b6b; font-size:13px; min-height:18px; }
  .stats { color:#7f8a9c; font-size:12px; min-height:16px; }
</style>
<h1>Roblox / Luau script obfuscator</h1>
<p>Paste a script. Comments go away, locals, fields, globals, builtin names and every Roblox property, method and service name get hidden, strings get AES-128 encrypted under an RSA-wrapped key into symbol-noise payloads (padded so their length does not show, with decoy payloads mixed in), every number (decimals included) gets encoded, a canary check makes the script quietly stop if the decoder is swapped, the whole thing comes out as one line, and the result only runs while it is fresh.</p>
<div class="row">
  <textarea id="input" spellcheck="false" placeholder="-- your script here"></textarea>
  <textarea id="output" spellcheck="false" readonly placeholder="obfuscated output"></textarea>
</div>
<div class="opts">
  <label><input type="checkbox" id="rename" checked> rename variables</label>
  <label><input type="checkbox" id="fields" checked> rename table fields</label>
  <label><input type="checkbox" id="globals" checked> rename global functions</label>
  <label><input type="checkbox" id="hideglobals" checked> hide globals (print, game…)</label>
  <label><input type="checkbox" id="members" checked> hide properties &amp; services (Parent, GetService, JSONEncode…)</label>
  <label><input type="checkbox" id="oneline" checked> one-line output</label>
  <label><input type="checkbox" id="numbers" checked> encode numbers</label>
  <label><input type="checkbox" id="comments" checked> strip comments</label>
  <label>runs only if younger than <input type="number" id="age" value="10" min="0" max="3600" step="1"> seconds</label>
</div>
<button id="go">Obfuscate</button>
<div class="stats" id="stats"></div>
<div class="err" id="err"></div>
<script>
  const go = document.getElementById('go');
  const err = document.getElementById('err');
  const stats = document.getElementById('stats');
  go.addEventListener('click', async () => {
    err.textContent = '';
    stats.textContent = '';
    go.disabled = true;
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: document.getElementById('input').value,
          renameIdentifiers: document.getElementById('rename').checked,
          renameFields: document.getElementById('fields').checked,
          renameGlobals: document.getElementById('globals').checked,
          hideGlobals: document.getElementById('hideglobals').checked,
          hideMembers: document.getElementById('members').checked,
          singleLine: document.getElementById('oneline').checked,
          encodeNumbers: document.getElementById('numbers').checked,
          stripComments: document.getElementById('comments').checked,
          maxAgeSeconds: Number(document.getElementById('age').value),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'something went wrong');
      document.getElementById('output').value = data.script;
      stats.textContent =
        data.encodedStrings + ' strings encoded · ' +
        data.renamedLocals + ' locals renamed · ' +
        data.renamedFields + ' fields renamed · ' +
        data.renamedGlobals + ' globals renamed · ' +
        data.hiddenGlobals + ' builtin names hidden · ' +
        data.hiddenMembers + ' properties/methods hidden · ' +
        data.encodedNumbers + ' numbers encoded' +
        (data.maxAgeSeconds > 0 ? ' · valid for ' + data.maxAgeSeconds + 's' : ' · no age limit');
    } catch (e) {
      err.textContent = e.message;
    } finally {
      go.disabled = false;
    }
  });
</script>
</html>`;




















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
      const result = obfuscate(script);
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
      const json = JSON.stringify({ Name: randomName, Expiration: Date.now() + 5000 });
      const genkeyStr = GetRandomString(11);
      const antihookcode = await fetch("https://raw.githubusercontent.com/MainScripts352/MainScripts352/refs/heads/main/Anti%20Hook%20Source");
      const generatekeycode = `local function ${genkeyStr}(length) local chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" local key = "" for i = 1, length do local randIndex = math.random(1, #chars) key = key .. string.sub(chars, randIndex, randIndex) end return key end`;
      const code = `${await antihookcode.text()}\nloadstring("\\${encodeAscii(`${generatekeycode} local t={[1]=Instance,[2]="new",[3]="StringValue",[4]=game,[5]="GetService",[6]="ReplicatedStorage",[7]="Parent",[8]="Name",[9]="Archivable",[10]="Value",[11]=true,[12]=${genkeyStr}(64),[13]="${randomName}"} local v=t[1][t[2]](t[3])v[t[7]]=t[4][t[5]](t[4], t[6])v[t[8]]=t[13]v[t[9]]=t[11]v[t[10]]=t[12] loadstring(game:HttpGet("${domain}/${url.pathname.slice(1)}?auth=${EncodeText(json, ServiceKey)}&K="..game:GetService("ReplicatedStorage")["${randomName}"].Value))()`)}")()`;

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
