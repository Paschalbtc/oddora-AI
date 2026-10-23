import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").toLowerCase().trim();

    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const rssFeeds = [
      "https://feeds.bbci.co.uk/sport/football/rss.xml",
      "https://www.skysports.com/rss/12040", // Sky Sports Premier League
    ];

    const results = await Promise.allSettled(
      rssFeeds.map(async (url) => {
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const xml = await res.text();
        const items: Array<{ title: string; description: string; link: string; pubDate: string; source: string }> = [];

        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
          const itemContent = match[1];
          const title =
            itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
            itemContent.match(/<title>([\s\S]*?)<\/title>/)?.[1] ||
            "";
          const description =
            itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
            itemContent.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
            "";
          const link = itemContent.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
          const pubDate = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";

          const cleanTitle = title.replace(/<\/?[^>]+(>|$)/g, "").trim();
          const cleanDesc = description.replace(/<\/?[^>]+(>|$)/g, "").trim();

          if (cleanTitle) {
            items.push({
              title: cleanTitle,
              description: cleanDesc,
              link,
              pubDate,
              source: url.includes("bbci") ? "BBC Sport" : "Sky Sports",
            });
          }
        }
        return items;
      })
    );

    let allItems: any[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        allItems = allItems.concat(r.value);
      }
    }

    if (query) {
      const filtered = allItems.filter(
        (i) => i.title.toLowerCase().includes(query) || i.description.toLowerCase().includes(query)
      );
      if (filtered.length > 0) {
        allItems = filtered;
      }
    }

    return NextResponse.json({
      status: "success",
      current_date: todayStr,
      query: query || "latest",
      count: allItems.length,
      news: allItems.slice(0, 10),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

