const FEED = "https://adeptus-baeticus.blogspot.com/feeds/posts/default?alt=json&max-results=6";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/blog") return env.ASSETS.fetch(request);

    const cache = caches.default;
    const key = new Request(url.origin + "/api/blog");
    const hit = await cache.match(key);
    if (hit) return hit;

    try {
      const r = await fetch(FEED);
      const j = await r.json();
      const posts = (j.feed.entry || []).map((e) => {
        const html = (e.content && e.content.$t) || "";
        const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
        const img = (html.match(/<img[^>]+src="([^"]+)"/) || [])[1] || null;
        const link = (e.link.find((l) => l.rel === "alternate") || {}).href;
        return {
          title: e.title.$t,
          url: link,
          date: e.published.$t,
          tag: ((e.category || [])[0] || {}).term || "",
          excerpt: text.slice(0, 160),
          image: img,
        };
      });
      const res = new Response(JSON.stringify(posts), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=600",
        },
      });
      ctx.waitUntil(cache.put(key, res.clone()));
      return res;
    } catch (err) {
      return new Response("[]", {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
  },
};
