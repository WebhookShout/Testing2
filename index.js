const ServiceKey = "AdRa-hXtp-44pk-uopl-cVIp-QdG1-Dnh1-adO0-russ-1ov3"

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


// Get Random Name Function
function GetRandomName(length = 16) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
}

// Generate Secured Key Function
function generateSecureKey(length = 32, segmentLength = 4) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let key = '';
  for (let i = 0; i < array.length; i++) {
    key += chars[array[i] % chars.length];
    if ((i + 1) % segmentLength === 0 && i + 1 !== array.length) {
      key += '-';
    }
  }
  return key;
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const domain = url.origin; // get service full link
    const pathname = decodeURIComponent(url.pathname.slice(1)); // remove leading '/'
    const auth = url.searchParams.get("auth"); // get key in '?auth=Key'
    
    let links = {};
    try {
      const jsonUrl = 'https://ghost352.neocities.org/RobloxScripts/ScriptsTable/Links.json';
      const response = await fetch(jsonUrl);
      if (!response.ok) throw new Error('Non-200 response');
      links = await response.json();
    } catch (e) {
      return new Response("Failed to fetch JSON.", { status: 500 });
    }

    // Handle Access Scripts
    if (pathname && auth) {
      const key = pathname;
      const linkData = links[key];
      const decodedAuth = DecodeText(auth, ServiceKey);
      let pathname = url.pathname.slice(1);
      pathname = decodeURIComponent(pathname);
      
      if (!linkData) {
        return new Response(`404: Not Found`, { status: 404 });
      }

      const resp = await fetch(linkData);
      if (!resp.ok) {
        return new Response(`${resp.status}: Failed to fetch content`, { status: 500 });
      }

      const textContent = await resp.text();
      return new Response(`--${decodedAuth}\n${textContent}`, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Authorize Specific Key
    if (pathname) {
      const key = pathname;
      const linkData = links[key];

      if (!linkData) {
        return new Response(`404: Not Found`, { status: 404 });
      }

      const randomKey = Math.floor(Math.random() * 1000000000) + 1; // need add +1 to make it 1B
      const randomName = GetRandomName();
      const secureName = GetRandomName();
      const secureKey = generateSecureKey();
      const code = `local t={[1]=Instance,[2]="new",[3]="StringValue",[4]=game,[5]="GetService",[6]="ReplicatedStorage",[7]="Parent",[8]="Name",[9]="Archivable",[10]="Value",[11]=true,[12]="${randomKey}",[13]="${randomName}",[14]="${secureKey}",[15]="${secureName}"} local v=t[1][t[2]](t[3])v[t[7]]=t[4][t[5]](t[4], t[6])v[t[8]]=t[13]v[t[9]]=t[11]v[t[10]]=t[12] local x=t[1][t[2]](t[3])x[t[7]]=t[4][t[5]](t[4], t[6])x[t[8]]=t[15]x[t[9]]=t[11]x[t[10]]=t[14] loadstring(game:HttpGet("${domain}/${encodeURIComponent(url.pathname.slice(1))}?auth=${EncodeText(secureKey, ServiceKey)}"))()`;

      return new Response(code, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    return new Response("404: Not Found", { status: 404 });
  }
}
