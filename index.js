export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const discordWebhookUrl = "https://discord.com/api/webhooks/1390383174009356288/czwDTu0es0TsWFzMHFBSppuXgLQbNr-Clkize31XqPomS9nL9NacOj_FxVlhAM8nxHw4"; // replace with yours
    let payload;

    if (request.method === "POST") {
      // POST with JSON body
      try {
        const body = await request.text();
        payload = JSON.parse(body);
      } catch {
        return new Response("❌ Invalid JSON body.", { status: 400 });
      }
    } else {
      // GET ?msg= or ?= fallback
      let message = url.searchParams.get("msg");

      if (!message) {
        return new Response(`❌ Failed to send to Discord. Status: ${discordResponse.status}`, { status: discordResponse.status });
      }

      message = message;

      payload = {
        content: message,
        username: "CloudflareBot"
      };
    }

    // Send to Discord
    const discordResponse = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!discordResponse.ok) {
      return new Response(`❌ Failed to send to Discord. Status: ${discordResponse.status}`, { status: 500 });
    }

    return new Response(`✅ Sent to Discord`);
  }
}
