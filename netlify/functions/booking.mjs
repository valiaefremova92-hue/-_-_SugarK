export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return Response.json(
      { ok: false, error: "POST only" },
      { status: 405 }
    );
  }

  const apiUrl = process.env.APPS_SCRIPT_API_URL;

  if (!apiUrl) {
    return Response.json(
      { ok: false, error: "APPS_SCRIPT_API_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body
    });

    const text = await response.text();

    return new Response(text, {
      status: response.ok ? 200 : 502,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message || "Proxy error"
      },
      { status: 500 }
    );
  }
};
