export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed",
      message: "Gunakan metode GET untuk endpoint ini.",
    });
  }

  const { url, preGoDelay } = req.query;

  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      error: "Missing or invalid query parameter",
      message: "Parameter 'url' wajib diisi.",
    });
  }

  const apiKey = process.env.ZAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server configuration error",
      message: "Environment variable 'ZAPI_KEY' belum diatur di Vercel.",
    });
  }

  const targetUrl = new URL("https://api.zapi.ink/v1/bypass-tools:safelinku/resolve");
  targetUrl.searchParams.set("url", url.trim());

  if (preGoDelay !== undefined && String(preGoDelay).trim() !== "") {
    const parsedDelay = Number(preGoDelay);
    if (Number.isNaN(parsedDelay) || parsedDelay < 0) {
      return res.status(400).json({
        error: "Invalid query parameter",
        message: "Parameter 'preGoDelay' harus berupa angka >= 0.",
      });
    }
    targetUrl.searchParams.set("preGoDelay", String(parsedDelay));
  }

  try {
    const upstreamRes = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await upstreamRes.json()
      : { raw: await upstreamRes.text() };

    return res.status(upstreamRes.status).json(payload);
  } catch (err) {
    return res.status(502).json({
      error: "Upstream request failed",
      message: err?.message || "Gagal menghubungi server upstream.",
    });
  }
}
