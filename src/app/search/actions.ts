
'use server';

import { intelligentSearch } from '@/ai/flows/intelligent-search';
import api from '@/lib/api';
import type { KnowledgeBaseEntry } from '@/app/knowledge-base/page';

export async function performSearch(query: string) {
  if (!query) {
    return { results: [] };
  }

  try {
    // Fetch latest knowledge base from backend
    const knowledgeBaseRes = await api.get<KnowledgeBaseEntry[]>('/api/knowledge-base');
    const knowledgeBase = JSON.stringify(knowledgeBaseRes.data);

    const searchResult = await intelligentSearch({
      query,
      knowledgeBase: knowledgeBase,
    });
    // Sort results by relevance before returning
    searchResult.results.sort((a, b) => b.relevance - a.relevance);
    return searchResult;
  } catch (error) {
    console.error('Error performing search:', error);
    // In a real app, you might want to throw the error or handle it more gracefully
    return { results: [] };
  }
}
