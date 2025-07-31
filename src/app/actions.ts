
"use server";

import { generateUserProfile } from "@/ai/flows/generate-user-profile";
import { getRecommendations } from "@/ai/flows/get-recommendations";

interface GetAiResponseParams {
    textInput: string;
    imageDataUri: string | undefined;
    knowledgeBase: string;
    publicResources: string;
    supplierDatabases: string;
}

export async function getAiResponse(params: GetAiResponseParams) {
  const { textInput, imageDataUri, knowledgeBase, publicResources, supplierDatabases } = params;
    
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
