const uuidMap = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname.slice(1)); // remove leading '/'

    // fetch your JSON
    let links = {};
    try {
      const jsonUrl = 'https://ghost352.neocities.org/RobloxScripts/ScriptsTable/Links.json';
      const response = await fetch(jsonUrl);
      if (!response.ok) throw new Error('Non-200 response');
      links = await response.json();
    } catch (e) {
      return new Response("Failed to fetch JSON.", { status: 500 });
    }

    // fetch key
    if (pathname) {
      const key = pathname;
      const linkData = links[key];

      if (!linkData) {
        return new Response(`No data found for key: ${key}`, { status: 404 });
      }
      const content = await fetch(linkData);
      return new Response(content);
    }

    return new Response("Not found.", { status: 404 });
  }
}
