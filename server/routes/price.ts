import { RequestHandler } from "express";

const ALLOWED_IDS = new Set(["tether", "usd-coin"]);
const CACHE_TTL_MS = 60_000;
const priceCache = new Map<string, { data: unknown; timestamp: number }>();

export const handlePrice: RequestHandler = async (req, res) => {
  try {
    const id = String(req.query.id || "").trim();
    if (!id || !ALLOWED_IDS.has(id)) {
      return res.status(400).json({ error: "Unsupported asset id." });
    }

    const cached = priceCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      id
    )}&vs_currencies=usd`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (cached) {
        return res.json(cached.data);
      }
      return res.status(response.status).json({ error: "Price fetch failed." });
    }

    const data = await response.json();
    priceCache.set(id, { data, timestamp: Date.now() });
    return res.json(data);
  } catch (error) {
    const id = String(req.query.id || "").trim();
    const cached = priceCache.get(id);
    if (cached) {
      return res.json(cached.data);
    }
    return res.status(500).json({ error: "Price fetch error." });
  }
};
