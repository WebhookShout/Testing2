const ScriptsLink = "https://ghost352.neocities.org/RobloxScripts/ScriptsTable/Links.json";
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

// Encode Hash Code 'Md5' Function
async function EncodeHashCode(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hex;
}


export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const domain = url.origin; // get service full link
    const userAgent = request.headers.get('User-Agent') || ''; // get User-Agent    
    const pathname = decodeURIComponent(url.pathname.slice(1)); // remove leading '/'
    const auth = url.searchParams.get("auth"); // get key in '?auth=Key'

    // Detect if request UserAgent is not include "Roblox"
    if (!userAgent.includes('Roblox')) {
      return new Response('404: Not Found', { status: 403 });
    }

    let links = {};
    try {
      const jsonUrl = ScriptsLink;
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
      const data = JSON.parse(DecodeText(auth, ServiceKey));
      
      if (!linkData) {
        return new Response(`404: Not Found`, { status: 404 });
      }

      // Detect if data decoded error
      if (!data || typeof data !== 'object' || !('Expiration' in data)) {
        // return new Response(`404: Not Found`, { status: 404 });
      }
      
      // Detect if Access ID is Expired
      if (data.Expiration < Date.now()) {
         return new Response(`404: Not Found`, { status: 404 });
      }
      
      const resp = await fetch(linkData);
      if (!resp.ok) {
        return new Response(`${resp.status}: Failed to fetch content`, { status: 500 });
      }

      const textContent = await resp.text();
      const content = `game:GetService("ReplicatedStorage"):WaitForChild("${data.Name}").Value = tostring(math.random(1000000, 10000000))\n${textContent}`;
      const encoded = EncodeScript(content, String(data.Key));
      const decodedStr = GetRandomString(4);
      const fnStr = GetRandomString(5);
      const objStr = GetRandomString(18);
      const date = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const time = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
      const hash = await EncodeHashCode(time);
      const script = `
      print("${hash}", "${time}")
      local md5 = {}  local bit = bit32 local floor = math.floor  local function LeftRotate(x, c) 	return bit.lrotate(x, c) end  local function ToBytes(str) 	local bytes = {} 	for i = 1, #str do 		bytes[#bytes + 1] = string.byte(str:sub(i, i)) 	end 	return bytes end  local function ToHex(bytes) 	return table.concat( 		table.pack( 			unpack( 				table.pack( 					unpack( 						(function() 							local t = {} 							for _, b in ipairs(bytes) do 								t[#t + 1] = string.format("%02x", b) 							end 							return t 						end)() 					) 				) 			) 		) 	) end  local function EncodeLittleEndian(val) 	return { 		val % 256, 		floor(val / 256) % 256, 		floor(val / 65536) % 256, 		floor(val / 16777216) % 256 	} end  local function Preprocess(bytes) 	local originalLength = #bytes * 8 	bytes[#bytes + 1] = 0x80 	while (#bytes % 64) ~= 56 do 		bytes[#bytes + 1] = 0 	end 	for _, b in ipairs(EncodeLittleEndian(originalLength)) do 		bytes[#bytes + 1] = b 	end 	return bytes end  local function F(x, y, z) return bit.bor(bit.band(x, y), bit.band(bit.bnot(x), z)) end local function G(x, y, z) return bit.bor(bit.band(x, z), bit.band(y, bit.bnot(z))) end local function H(x, y, z) return bit.bxor(x, bit.bxor(y, z)) end local function I(x, y, z) return bit.bxor(y, bit.bor(x, bit.bnot(z))) end  local function ProcessChunk(chunk, h) 	local k = { 		0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 		0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501, 		0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 		0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,  		0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 		0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8, 		0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 		0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,  		0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 		0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 		0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 		0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,  		0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 		0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1, 		0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 		0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391 	}  	local s = { 		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 		5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 		4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 		6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21 	}  	local a, b, c, d = h[1], h[2], h[3], h[4] 	local X = {}  	for i = 0, 15 do 		local j = i * 4 + 1 		X[i + 1] = chunk[j] + chunk[j + 1] * 256 + chunk[j + 2] * 65536 + chunk[j + 3] * 16777216 	end  	for i = 1, 64 do 		local f, g 		if i <= 16 then f = F; g = i 		elseif i <= 32 then f = G; g = ((5 * i - 4) % 16) + 1 		elseif i <= 48 then f = H; g = ((3 * i + 2) % 16) + 1 		else f = I; g = ((7 * i - 7) % 16) + 1 		end  		local temp = d 		d = c 		c = b 		b = b + LeftRotate((a + f(b, c, d) + k[i] + X[g]), s[i]) 		a = temp 	end  	h[1] = (h[1] + a) % 4294967296 	h[2] = (h[2] + b) % 4294967296 	h[3] = (h[3] + c) % 4294967296 	h[4] = (h[4] + d) % 4294967296 end  function md5.hash(input) 	local bytes = ToBytes(input) 	bytes = Preprocess(bytes)  	local h = { 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476 }  	for i = 1, #bytes, 64 do 		local chunk = {} 		for j = i, i + 63 do 			chunk[#chunk + 1] = bytes[j] 		end 		ProcessChunk(chunk, h) 	end  	local digest = {} 	for i = 1, 4 do 		for _, b in ipairs(EncodeLittleEndian(h[i])) do 			digest[#digest + 1] = b 		end 	end  	return ToHex(digest) end
      print(md5.hash(os.date("%Y%m%d%H%M")..string.format("%02d", (tonumber(os.date("%S")) + 1) % 60)))
      --print(game:GetService("HttpService"):JSONDecode(game:HttpGet("https://api.hashify.net/hash/md5/hex?value="..os.date("%Y%m%d%H%M")..string.format("%02d", (tonumber(os.date("%S")) + 1) % 60))).Digest, os.date("%Y%m%d%H%M")..string.format("%02d", (tonumber(os.date("%S")) + 1) % 60))
      local function ${decodedStr}(encodedStr, key) local result = {} local parts = string.split(encodedStr, "/") for i = 1, #parts do local byte = tonumber(parts[i]) local k = key:byte(((i - 1) % #key) + 1) local decoded = (byte - k + 256) % 256 table.insert(result, string.char(decoded)) end return table.concat(result) end 
      local a = game local b = "GetService" local c = "ReplicatedStorage" local d = "Destroy" local ${objStr} = a[b](a, c)["${data.Name}"].Value
      local ${fnStr}="";for _, c in ipairs({${GetNumberWithMath(108)}, ${GetNumberWithMath(111)}, ${GetNumberWithMath(97)}, ${GetNumberWithMath(100)}, ${GetNumberWithMath(115)}, ${GetNumberWithMath(116)}, ${GetNumberWithMath(114)}, ${GetNumberWithMath(105)}, ${GetNumberWithMath(110)}, ${GetNumberWithMath(103)}}) do ${fnStr}=${fnStr}..string.char(c);end(getfenv()[${fnStr}] or _G[${fnStr}] or _ENV and _ENV[${fnStr}])(${decodedStr}("${encoded}", ${objStr}))()`;
      
      return new Response(script, {
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

      const randomName = GetRandomName();
      const secureKey = generateSecureKey();
      const json = JSON.stringify({Key: secureKey, Name: randomName, Expiration: Date.now() + 1500});
      const code = `loadstring("\\${encodeAscii(`local t={[1]=Instance,[2]="new",[3]="StringValue",[4]=game,[5]="GetService",[6]="ReplicatedStorage",[7]="Parent",[8]="Name",[9]="Archivable",[10]="Value",[11]=true,[12]="${secureKey}",[13]="${randomName}"} local v=t[1][t[2]](t[3])v[t[7]]=t[4][t[5]](t[4], t[6])v[t[8]]=t[13]v[t[9]]=t[11]v[t[10]]=t[12] loadstring(game:HttpGet("${domain}/${url.pathname.slice(1)}?auth=${EncodeText(json, ServiceKey)}"))()`)}")()`;

      return new Response(code, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    return new Response("404: Not Found", { status: 404 });
  }
}
