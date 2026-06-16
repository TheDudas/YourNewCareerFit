export async function onRequestPost(context) {
  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured. Add ANTHROPIC_API_KEY to Cloudflare Pages environment variables." }, { status: 500 });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return Response.json({ error: "messages array required" }, { status: 400 });
  }

  const max_tokens = Math.min(body.max_tokens || 1500, 3000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens,
        messages: body.messages,
        ...(body.system ? { system: body.system } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error?.message || "Anthropic API error" }, { status: response.status });
    }

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
