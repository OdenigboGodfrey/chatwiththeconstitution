import * as cheerio from 'cheerio';
import { DDGSearchResultItemDTO } from '../dtos/ddgs-result.dto';

export async function ddgsSearch(query: string, maxResults = 5) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      throw new Error(`DDG search failed with status: ${response.status}`);
    }

    const html = await response.text();
    console.log('html', html);
    const $ = cheerio.load(html);
    const initialResults: { title: string; url: string; snippet: string }[] =
      [];

    // 1. Extract the initial links from DDG
    $('.result').each((_, el) => {
      if (initialResults.length >= maxResults) return false;

      const title = $(el).find('.result__title').text().trim();
      let href =
        $(el).find('.result__url').attr('href') ||
        $(el).find('a.result__a').attr('href');

      // DDG sometimes formats links as internal redirects; clean them if necessary
      if (href && href.startsWith('//duckduckgo.com/l/?kh=-1&uddg=')) {
        const urlParam = new URL('https:' + href).searchParams.get('uddg');
        if (urlParam) href = urlParam;
      }

      const snippet = $(el).find('.result__snippet').text().trim();
      console.log('cheerio result item', { title, url: href, snippet });
      if (href && href.startsWith('http')) {
        initialResults.push({ title, url: href, snippet });
      }
    });

    console.log('initialResults', initialResults.length);
    // 2. Fetch the extra data from each URL concurrently
    const results = await Promise.all(
      initialResults.map(async (item) => {
        let content = '';
        try {
          // Abort controller to prevent hanging on slow websites
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const pageRes = await fetch(item.url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal,
          });
          clearTimeout(timeoutId); // page loaded, remove timeout

          if (pageRes.ok) {
            const pageHtml = await pageRes.text();
            content = extractMainText(pageHtml);
          }
        } catch (err) {
          // If a single external site fails/times out, we don't want to crash the whole search
          content = `Could not fetch extra data: ${(err as Error).message}`;
        }

        const detailedResponse = new DDGSearchResultItemDTO({
          title: item.title,
          url: item.url,
          snippet: item.snippet,
          content: content,
        });
        console.log('detailedResponse', detailedResponse);

        return detailedResponse;
      }),
    );

    // 3. Respectful delay for the next sequential DDG call
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));

    console.log('ddgs util result item', results);
    return results;
  } catch (error) {
    console.error('Error in ddgsSearch:', error);
    return [];
  }
}

/**
 * Helper to clean up HTML and extract actual readable text for the LLM
 */
function extractMainText(html: string): string {
  const $ = cheerio.load(html);

  // Remove elements that are pure noise for an LLM
  $(
    'script, style, nav, footer, header, iframe, noscript, .sidebar, .ads',
  ).remove();

  // Grab text from paragraphs or the body if paragraphs are sparse
  let text = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((txt) => txt.length > 20) // Filter out tiny fragments
    .join('\n\n');

  if (!text) {
    text = $('body').text().replace(/\s+/g, ' ').trim();
  }

  // Truncate to ~4000 characters (~1000 tokens) per page so the LLM doesn't get overwhelmed.
  const maxChars = 4000;
  if (text.length > maxChars) {
    return text.substring(0, maxChars) + '... [Truncated for Context Context]';
  }

  return text;
}
