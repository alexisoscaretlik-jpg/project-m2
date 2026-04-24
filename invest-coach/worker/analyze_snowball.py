import os
import json
import httpx
import re
from pathlib import Path
from bs4 import BeautifulSoup
import google.generativeai as genai
from dotenv import load_dotenv
import xml.etree.ElementTree as ET
from supabase import create_client
from datetime import datetime

# Load environment variables from project root
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SNOWBALL_RSS = "https://media.snowball.xyz/rss/"
SNOWBALL_SITEMAP = "https://media.snowball.xyz/sitemap-posts.xml"

# The prompt is designed to extract structural patterns for Claude to ingest
PATTERN_PROMPT = """Analyze the following article from Snowball.xyz to identify its 'Writing Algorithm'. 
Focus on the structural mechanics rather than just the content. 

Extract and describe:
1. The Hook: How does the article start? (e.g., a personal anecdote, a shocking statistic, a direct question).
2. Data Strategy: How are numbers, percentages, or financial metrics integrated into the narrative?
3. Tax Account Pedagogy: How are tax-advantaged accounts like PEA or AV explained? Analyze how they simplify fiscal complexity (e.g., the 5-year/8-year rules or the impact of PFU/social charges).
4. Logical Progression: What is the sequence of ideas? (e.g., Problem -> Agitation -> Economic Solution -> Recommendation).
5. Formatting & Visual Cues: Use of bolding, emojis, bullet points, or "pro-tips" boxes.
6. Tone Markers: Specific French phrasing or 'tutoiement' style used.
7. Call to Action: How does it transition into a conversion point or newsletter sign-up?

Return a JSON object with these keys."""

def fetch_article_links():
    print(f"[*] Fetching Sitemap: {SNOWBALL_SITEMAP}")
    resp = httpx.get(SNOWBALL_SITEMAP, timeout=30)
    resp.raise_for_status()
    
    # Remove namespaces for easier parsing
    xml_content = re.sub(r'\sxmlns="[^"]+"', '', resp.text, count=1)
    root = ET.fromstring(xml_content)
    
    links = []
    for url_tag in root.findall("url"):
        loc = url_tag.find("loc").text
        # Filter for actual articles/newsletters, skip generic tags/categories
        if any(x in loc for x in ["/comment-investir", "/pourquoi-", "/la-magie-", "/newsletters/"]):
            title = loc.split("/")[-2].replace("-", " ").title() if loc.endswith("/") else loc.split("/")[-1].replace("-", " ").title()
            links.append({"url": loc, "title": title})
    return links

def get_article_content(url):
    print(f"[*] Scraping: {url}")
    resp = httpx.get(url, timeout=30)
    soup = BeautifulSoup(resp.text, "html.parser")
    
    # Snowball is Ghost-based; main content is usually in .gh-content or article
    content = soup.select_one(".gh-content") or soup.find("article")
    return content.get_text(separator="\n", strip=True) if content else ""

def analyze_patterns(content, model):
    # Using the high-context window of Flash to process the whole article
    prompt = f"{PATTERN_PROMPT}\n\nARTICLE CONTENT:\n{content[:15000]}"
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json")
    )
    # Strip markdown code blocks if they exist
    return re.sub(r"```json\s*|\s*```", "", response.text).strip()

def main():
    if not GEMINI_API_KEY:
        print("[-] Error: GEMINI_API_KEY not found in .env.local")
        return

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash") # Using 1.5/2.5 Flash as requested

    sb = None
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    articles = fetch_article_links()
    print(f"[+] Found {len(articles)} potential articles. Analyzing the 100 newest...")
    sample = articles[:100] 
    
    analysis_results = []
    
    for i, art in enumerate(sample):
        try:
            print(f"[{i+1}/100] Scraping & Analyzing: {art['url']}")
            text = get_article_content(art['url'])
            if len(text) < 500:
                continue
                
            raw_analysis = analyze_patterns(text, model)
            clean_json = raw_analysis.replace("```json", "").replace("```", "").strip()
            patterns = json.loads(clean_json)
            
            analysis_results.append({
                "meta": art,
                "patterns": patterns
            })

            # Optional: Upsert to Supabase fr_articles table
            if sb:
                sb.table("fr_articles").upsert({
                    "source": "blog_snowball",
                    "source_url": art['url'],
                    "title": art['title'],
                    "raw_text": text[:50000], # Cap text size
                    "extraction": patterns,
                    "model": "gemini-1.5-flash",
                    "published_at": datetime.now().isoformat()
                }, on_conflict="source_url").execute()

        except Exception as e:
            print(f"[-] Failed to process {art['url']}: {e}")

    # Create the context file for Claude
    output_file = Path(__file__).parent / "snowball_patterns_for_claude.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("# Snowball.xyz Writing Patterns Analysis\n\n")
        f.write("This file contains a structural breakdown of recent Snowball articles. ")
        f.write("Use this to synthesize a 'Writing Algorithm' for the Invest Coach newsletter.\n\n")
        
        for res in analysis_results:
            f.write(f"## Article: {res['meta']['title']}\n")
            f.write(f"Source: {res['meta']['url']}\n\n")
            f.write("### Structural Analysis\n")
            f.write("```json\n")
            f.write(json.dumps(res['patterns'], indent=2, ensure_ascii=False))
            f.write("\n```\n\n---\n\n")
            
    print(f"[+] Success! Analysis file created at: {output_file}")
    print("[*] Next step: Upload this file to Claude and ask: 'Based on these patterns, create a system prompt for a writer that replicates the Snowball.xyz algorithm.'")

if __name__ == "__main__":
    main()