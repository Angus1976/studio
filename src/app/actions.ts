
"use server";

import { generateUserProfile } from "@/ai/flows/generate-user-profile";
import { getRecommendations } from "@/ai/flows/get-recommendations";
import api from "@/lib/api";
import type { KnowledgeBaseEntry } from "@/app/knowledge-base/page"; // Reusing type

interface GetAiResponseParams {
    textInput: string;
    imageDataUri: string | undefined;
}

export async function getAiResponse(params: GetAiResponseParams) {
  const { textInput, imageDataUri } = params;
    
  // Fetch latest data from backend instead of using static file
  const knowledgeBaseRes = await api.get<KnowledgeBaseEntry[]>('/api/knowledge-base');
  const knowledgeBase = JSON.stringify(knowledgeBaseRes.data);
  
  // For demo purposes, we'll keep public resources and suppliers simple.
  // In a real app, these would also come from the backend.
  const publicResources = "Public resources info from backend";
  const supplierDatabases = "Supplier databases info from backend";

  const userProfile = await generateUserProfile({
    textInput,
    imageDataUri: imageDataUri ?? undefined,
  });

  const recommendations = await getRecommendations({
      userNeeds: textInput,
      userProfile: JSON.stringify(userProfile),
      knowledgeBase,
      publicResources,
      supplierDatabases,
  });

  return { userProfile, recommendations };
}
