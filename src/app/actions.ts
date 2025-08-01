
"use server";

import { generateUserProfile } from "@/ai/flows/generate-user-profile";
import { getRecommendations } from "@/ai/flows/get-recommendations";
import { identifyImageObjects, type IdentifyImageObjectsOutput } from "@/ai/flows/identify-image-objects";
import api from "@/lib/api";
import type { KnowledgeBaseEntry } from "@/app/knowledge-base/page"; // Reusing type
import { z } from "zod";

interface GetRecommendationsParams {
    textInput: string;
}

export async function getRecommendationsFromText(params: GetRecommendationsParams) {
  const { textInput } = params;
    
  // Fetch latest data from backend instead of using static file
  const knowledgeBaseRes = await api.get<KnowledgeBaseEntry[]>('/api/knowledge-base');
  const knowledgeBase = JSON.stringify(knowledgeBaseRes.data);
  
  // For demo purposes, we'll keep public resources and suppliers simple.
  // In a real app, these would also come from the backend.
  const publicResources = "Public resources info from backend";
  const supplierDatabases = "Supplier databases info from backend";

  const userProfile = await generateUserProfile({
    textInput,
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

export async function identifyImage(imageDataUri: string): Promise<IdentifyImageObjectsOutput> {
  if (!imageDataUri) {
    throw new Error("Image data is required.");
  }

  const identificationResult = await identifyImageObjects({ imageDataUri });

  if (!identificationResult) {
    throw new Error("AI failed to identify image.");
  }

  return identificationResult;
}
