"use server";

import { generateUserProfile } from "@/ai/flows/generate-user-profile";
import { recommendProductsOrServices } from "@/ai/flows/recommend-products-or-services";

export async function getAiResponse(
  textInput: string,
  imageDataUri: string | null
) {
  const userProfile = await generateUserProfile({
    textInput,
    imageDataUri: imageDataUri ?? undefined,
  });

  // Mock data for other recommendation inputs as they are not implemented yet.
  const availableKnowledge = "General knowledge base about consumer electronics and home appliances.";
  const publicResources = "Online reviews from tech websites and forums.";
  const supplierDatabases = "Database of certified local and national suppliers for electronics.";

  const recommendations = await recommendProductsOrServices({
      userNeeds: textInput,
      userProfile: JSON.stringify(userProfile),
      availableKnowledge,
      publicResources,
      supplierDatabases,
  });

  return { userProfile, recommendations };
}
