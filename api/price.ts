const ALLOWED_IDS = new Set(["tether", "usd-coin"]);
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: any; ts: number }>();
const inflight = new Map<string, Promise<any>>();

export default async function handler(req: any, res: any) {
  try {
    const id = String(req.query?.id || "").trim();
    if (!id || !ALLOWED_IDS.has(id)) {
      return res.status(400).json({ error: "Unsupported asset id." });
    }

    const cached = cache.get(id);
    const isFresh = cached && Date.now() - cached.ts < CACHE_TTL_MS;
    if (isFresh) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(cached.data);
    }

    if (inflight.has(id)) {
      const data = await inflight.get(id);
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(data);
    }

    const fetchPromise = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        id
      )}&vs_currencies=usd`;
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        cache.set(id, { data, ts: Date.now() });
        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    inflight.set(id, fetchPromise);
    if (cached) {
      // serve stale immediately and refresh in background
      fetchPromise.finally(() => inflight.delete(id));
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(cached.data);
    }

    const data = await fetchPromise;
    inflight.delete(id);
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(data);
  } catch (error) {
    // If a cached value exists (even stale), return it to avoid client spam.
    const id = String(req.query?.id || "").trim();
    const cached = cache.get(id);
    if (cached) {
      return res.status(200).json(cached.data);
    }
    return res.status(500).json({ error: "Price fetch error." });
  }
}
