export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed",
      message: "Gunakan metode GET untuk endpoint ini.",
    });
  }

  const { url, confirmUnlock } = req.query;

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

  const targetUrl = new URL("https://api.zapi.ink/v1/bypass-tools:sub4unlock/resolve");
  targetUrl.searchParams.set("url", url.trim());

  if (confirmUnlock !== undefined && String(confirmUnlock).trim() !== "") {
    const normalized = String(confirmUnlock).trim().toLowerCase();
    if (normalized !== "true" && normalized !== "false") {
      return res.status(400).json({
        error: "Invalid query parameter",
        message: "Parameter 'confirmUnlock' harus berupa boolean ('true' atau 'false').",
      });
    }
    targetUrl.searchParams.set("confirmUnlock", normalized);
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
