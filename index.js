// Get Random Name Function
function GetRandomName(length = 16) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname.slice(1)); // remove leading '/'

    let links = {};
    try {
      const jsonUrl = 'https://ghost352.neocities.org/RobloxScripts/ScriptsTable/Links.json';
      const response = await fetch(jsonUrl);
      if (!response.ok) throw new Error('Non-200 response');
      links = await response.json();
    } catch (e) {
      return new Response("Failed to fetch JSON.", { status: 500 });
    }

    // Fetch Specific Key
    if (pathname) {
      const key = pathname;
      const linkData = links[key];

      if (!linkData) {
        return new Response(`404: Not Found`, { status: 404 });
      }

      const resp = await fetch(linkData);
      if (!resp.ok) {
        return new Response(`${resp.status}: Failed to fetch content`, { status: 500 });
      }

      const textContent = await resp.text();
      const randomName = GetRandomName();
      return new Response(`${randomName}\n${textContent}`, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    return new Response("404: Not Found", { status: 404 });
  }
}
