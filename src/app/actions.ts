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
  const availableKnowledge = "关于消费电子产品和家用电器的一般知识库。";
  const publicResources = "来自科技网站和论坛的在线评论。";
  const supplierDatabases = "包含经认证的本地和全国电子产品供应商的数据库。";

  const recommendations = await recommendProductsOrServices({
      userNeeds: textInput,
      userProfile: JSON.stringify(userProfile),
      availableKnowledge,
      publicResources,
      supplierDatabases,
  });

  return { userProfile, recommendations };
}
