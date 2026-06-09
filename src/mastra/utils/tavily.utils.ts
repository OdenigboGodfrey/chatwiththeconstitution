import { tavily } from '@tavily/core';
import { DDGSearchResultItemDTO } from '../dtos/ddgs-result.dto';

const tvly = tavily();

export async function tavilySearch(query: string, maxResults = 5) {
  try {
    // 1. Execute search
    const response = await tvly.search(query, {
      searchDepth: 'basic',
      maxResults: maxResults,
      includeRawContent: 'text', // scrape and extract the main page text
      excludeDomains: [
        'facebook.com',
        'instagram.com',
        'tiktok.com',
        'pinterest.com',
      ],
    });

    // console.log(`Tavily found ${response.results.length} results.`);

    // 2. Map Tavily's clean output directly into your existing DTO format
    const results = response.results.map((item) => {
      // Tavily provides 'rawContent' which is the cleaned, main body text of the web page
      let content = item.rawContent || '';
      // Match your original ~4000 character context restriction safely
      const maxChars = 4000;
      if (content.length > maxChars) {
        content =
          content.substring(0, maxChars) + '... [Truncated for Context]';
      }

      const detailedResponse = new DDGSearchResultItemDTO({
        title: item.title,
        url: item.url,
        snippet: item.content,
        content: content,
      });

      //   console.log('detailedResponse generated:', detailedResponse.title);
      return detailedResponse;
    });

    return results;
  } catch (error) {
    console.error('Error in Tavily Search Wrapper:', error);
    return [];
  }
}
