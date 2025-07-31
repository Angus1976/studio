'use server';

import { intelligentSearch } from '@/ai/flows/intelligent-search';

// Mock data for the knowledge base as it's not implemented yet.
const MOCK_KNOWLEDGE_BASE = `
- 产品: "智能家庭中心 Pro"
  - 类别: 消费电子产品
  - 描述: 一款集成了语音助手、智能家居控制和家庭娱乐功能的中心设备。支持 Zigbee、Wi-Fi 和蓝牙连接。
  - 价格: ¥1299

- 产品: "静音大师洗衣机"
  - 类别: 家用电器
  - 描述: 采用直驱变频电机，实现超静音洗涤。拥有10公斤大容量和多种智能洗涤程序。
  - 价格: ¥3499

- 服务: "云端数据备份"
  - 类别: 软件服务
  - 描述: 提供安全可靠的云端数据备份方案，支持多设备同步和文件版本历史记录。
  - 价格: ¥99/年

- 服务: "个性化营养咨询"
  - 类别: 健康服务
  - 描述: 由专业营养师提供在线一对一咨询，根据您的身体状况和饮食习惯定制个性化营养方案。
  - 价格: ¥499/次

- 供应商: "创新科技"
  - 简介: 领先的消费电子产品制造商，专注于创新和用户体验。
  - 主要产品: 智能手机、笔记本电脑、智能家居设备。

- 供应商: "绿色家电"
  - 简介: 一家专注于节能环保的家电制造商。
  - 主要产品: 节能冰箱、静音洗衣机、空气净化器。
`;

export async function performSearch(query: string) {
  if (!query) {
    return { results: [] };
  }

  try {
    const searchResult = await intelligentSearch({
      query,
      knowledgeBase: MOCK_KNOWLEDGE_BASE,
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
