"use server";

import { generateUserProfile } from "@/ai/flows/generate-user-profile";
import { getRecommendations } from "@/ai/flows/get-recommendations";

export async function getAiResponse(
  textInput: string,
  imageDataUri: string | null
) {
  const userProfile = await generateUserProfile({
    textInput,
    imageDataUri: imageDataUri ?? undefined,
  });

  const recommendations = await getRecommendations({
      userNeeds: textInput,
      userProfile: JSON.stringify(userProfile),
  });

  return { userProfile, recommendations };
}
