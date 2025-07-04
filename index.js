const uuidMap = new Map();

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

    if (pathname && pathname !== "access") {
      const key = pathname;
      const linkData = links[key];

      if (!linkData) {
        return new Response(`No data found for key: ${key}`, { status: 404 });
      }

      // generate UUID
      const uuid = crypto.randomUUID();
      uuidMap.set(uuid, linkData);

      return new Response(JSON.stringify({
        access: `/access/${uuid}`
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (pathname.startsWith("access/")) {
      const uuid = pathname.split("/")[1];
      const data = uuidMap.get(uuid);

      if (!data) {
        return new Response("Invalid or expired UUID.", { status: 404 });
      }

      return new Response(JSON.stringify({
        content: data
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not found.", { status: 404 });
  }
}
