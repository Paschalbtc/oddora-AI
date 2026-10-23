"""
Oddora AI - Real-Time Time-Filtered Sports News & Injury Scraper
Combines:
1. DuckDuckGo News Search (timelimit='w' for weekly fresh articles)
2. DuckDuckGo Text Search (timelimit='m' for monthly recent articles)
3. Live Football RSS Feeds (BBC Sport, Sky Sports, Goal.com, ESPN FC)
4. Dynamic Current Date Injection & HTML Stripping
"""

import html
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import feedparser

logger = logging.getLogger("oddora.news_scraper")

RSS_FEED_URLS = [
    ("BBC Sport", "https://feeds.bbci.co.uk/sport/football/rss.xml"),
    ("Sky Sports", "https://www.skysports.com/rss/12040"),
    ("Goal.com", "https://www.goal.com/feeds/en/news"),
    ("ESPN FC", "https://www.espn.com/espn/rss/soccer/news"),
]


def get_current_date_str() -> str:
    """Returns today's date formatted as 'Month Day, Year' (e.g. 'October 21, 2026')."""
    return datetime.now(timezone.utc).strftime("%B %d, %Y")


def strip_html_tags(text: str) -> str:
    """Removes HTML tags and unescapes HTML entities."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = html.unescape(clean)
    clean = re.sub(r"\s+", " ", clean)
    return clean.strip()


def scrape_live_sports_news(query: str, max_articles: int = 8, max_results: Optional[int] = None) -> Dict[str, Any]:
    """
    Executes live time-filtered sports news search:
    - ddgs.news(keywords=f"{query} latest news injuries", timelimit="w", max_results=6)
    - ddgs.text(..., timelimit="m")
    - Live RSS parsing from BBC Sport, Sky Sports, Goal.com
    Strips HTML and includes publication timestamps.
    """
    if max_results is not None:
        max_articles = max_results
    today_date = get_current_date_str()
    collected_articles: List[Dict[str, str]] = []
    seen_titles = set()

    # 1. DuckDuckGo News Search (timelimit='w')
    try:
        from duckduckgo_search import DDGS
        ddgs = DDGS()
        news_query = f"{query} latest news injuries"
        try:
            results = list(ddgs.news(keywords=news_query, timelimit="w", max_results=6))
            for r in results:
                title = strip_html_tags(r.get("title", ""))
                body = strip_html_tags(r.get("body", ""))
                date_str = r.get("date") or today_date
                source = r.get("source") or "Web News"
                if title and title.lower() not in seen_titles:
                    seen_titles.add(title.lower())
                    collected_articles.append({
                        "source": source,
                        "timestamp": date_str,
                        "title": title,
                        "snippet": body[:280],
                    })
        except Exception as e_news:
            logger.warning("DDGS news timelimit='w' notice: %s. Falling back to text search.", e_news)
            # Fallback to ddgs.text(timelimit='m')
            text_results = list(ddgs.text(keywords=f"{query} football news injuries", timelimit="m", max_results=4))
            for r in text_results:
                title = strip_html_tags(r.get("title", ""))
                body = strip_html_tags(r.get("body", ""))
                if title and title.lower() not in seen_titles:
                    seen_titles.add(title.lower())
                    collected_articles.append({
                        "source": "Web Search",
                        "timestamp": today_date,
                        "title": title,
                        "snippet": body[:280],
                    })
    except Exception as e_ddg:
        logger.warning("DDGS live search exception: %s", e_ddg)

    # 2. Live RSS Feeds (BBC Sport, Sky Sports, Goal.com, ESPN FC)
    query_terms = [t.lower() for t in query.split() if len(t) > 2]
    for source_name, feed_url in RSS_FEED_URLS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries:
                title = strip_html_tags(entry.get("title", ""))
                summary = strip_html_tags(entry.get("summary", entry.get("description", "")))
                pub_date = entry.get("published", entry.get("updated", today_date))

                if not title or title.lower() in seen_titles:
                    continue

                # Check relevance to user's query
                combined_text = (title + " " + summary).lower()
                is_relevant = any(term in combined_text for term in query_terms) if query_terms else True

                if is_relevant:
                    seen_titles.add(title.lower())
                    collected_articles.append({
                        "source": source_name,
                        "timestamp": pub_date,
                        "title": title,
                        "snippet": summary[:250],
                    })

                if len(collected_articles) >= max_articles:
                    break
        except Exception as e_rss:
            logger.warning("RSS feed error from %s: %s", source_name, e_rss)

        if len(collected_articles) >= max_articles:
            break

    # Format the prompt context with timestamps
    context_lines = []
    for art in collected_articles[:max_articles]:
        context_lines.append(
            f"[{art['source']} | Date: {art['timestamp']}]\n"
            f"Title: {art['title']}\n"
            f"Summary: {art['snippet']}\n"
        )

    formatted_context = "\n".join(context_lines) if context_lines else (
        f"No breaking transfer or injury reports found for '{query}' in the last 48 hours as of {today_date}."
    )

    return {
        "today_date": today_date,
        "articles_count": len(collected_articles),
        "articles": collected_articles[:max_articles],
        "formatted_context": formatted_context,
    }


def build_time_aware_system_prompt() -> str:
    """
    Constructs the LLM System Prompt with dynamic current date injection.
    Instructs the LLM strictly to use real scraped context and never outdated training data.
    """
    today_date = get_current_date_str()
    return (
        f"Today's exact date is {today_date}. NEVER use outdated training memory for injuries, transfers, or team form. "
        f"ONLY use the live scraped news and API-Football data provided in context.\n\n"
        f"You are Oddora AI's elite quantitative sports copilot and sports news intelligence engine. "
        f"You provide sharp, concise, actionable commentary on upcoming matches, tactical breakdowns, "
        f"verified player injuries, suspensions, trending transfer stories, and statistical value in betting markets.\n"
        f"Keep your tone analytical, authoritative, articulate, and direct (2-3 concise paragraphs max). "
        f"Always cite the exact recent dates and sources provided in the live context."
    )
