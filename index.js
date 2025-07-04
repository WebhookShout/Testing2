export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname.slice(1)); // remove leading "/"

    // Fetch JSON data from your source
    let links = {};
    try {
      const jsonUrl = 'https://ghost352.neocities.org/RobloxScripts/ScriptsTable/Links.json';
      const response = await fetch(jsonUrl);
      if (!response.ok) throw new Error('Non-200 response');
      links = await response.json();
    } catch (e) {
      return new Response("Failed to fetch JSON.", { status: 500 });
    }

    // Handle "/<key>"
    if (pathname && !pathname.startsWith("access")) {
      const key = pathname;
      const linkData = links[key];

      if (!linkData) {
        return new Response(`No data found for key: ${key}`, { status: 404 });
      }

      // Generate UUID, save in KV
      const uuid = crypto.randomUUID();
      await env.MYLINKS.put(uuid, JSON.stringify(linkData));

      // Automatically get the current domain
      const domain = url.origin;

      return new Response(JSON.stringify({
        access: `${domain}/access/${uuid}`
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle "/access/<uuid>"
    if (pathname.startsWith("access/")) {
      const uuid = pathname.split("/")[1];
      const data = await env.MYLINKS.get(uuid);

      if (!data) {
        return new Response("Invalid or expired UUID.", { status: 404 });
      }

      return new Response(JSON.stringify({
        content: JSON.parse(data)
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not found.", { status: 404 });
  }
}
