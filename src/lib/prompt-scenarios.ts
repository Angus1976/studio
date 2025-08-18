export type Scenario = {
  id: string;
  title: string;
  description: string;
  expertId: string; // Corresponds to suggestedPromptId from the navigator flow
  prompt: string;
};

export const promptScenarios: Scenario[] = [
  // Recruitment Expert Scenarios
  {
    id: "rec-001",
    title: "简历亮点总结",
    description: "输入一份简历，AI 将快速总结候选人的关键技能、工作经验和与目标职位的匹配度。",
    expertId: "recruitment-expert",
    prompt: "你是一位资深的HR专家。请根据以下简历内容，总结该候选人的核心亮点，包括：\n1. 主要技能\n2. 关键工作经历\n3. 与[目标职位]的匹配度分析。\n\n简历：\n{{resume_text}}",
  },
  {
    id: "rec-002",
    title: "生成面试问题",
    description: "根据职位描述，为不同轮次的面试（如技术面、行为面）生成有针对性的问题列表。",
    expertId: "recruitment-expert",
    prompt: "为“{{job_title}}”这个职位，生成一组面试问题。要求：\n1. 包含5个技术相关问题。\n2. 包含3个考察团队协作能力的行为问题。\n3. 职位描述：{{job_description}}",
  },
  // Marketing Expert Scenarios
  {
    id: "mkt-001",
    title: "社交媒体帖子生成",
    description: "根据产品信息和目标受众，快速生成适用于小红书、微博、抖音等平台的推广文案。",
    expertId: "marketing-expert",
    prompt: "为我们的新产品“{{product_name}}”撰写一篇社交媒体推广帖子。\n产品特点：{{product_features}}\n目标平台：{{platform}}\n风格要求：{{style_guide}}",
  },
  {
    id: "mkt-002",
    title: "广告语创意",
    description: "围绕一个核心卖点，生成多个不同风格、引人注目的广告标语（Slogan）。",
    expertId: "marketing-expert",
    prompt: "请为我们的品牌生成5个广告语。核心卖点是“{{core_selling_point}}”。要求风格多样，分别突出趣味性、专业性、情感共鸣等。",
  },
  // Code Expert Scenarios
  {
    id: "code-001",
    title: "代码解释器",
    description: "粘贴一段看不懂的代码，AI 会用清晰的自然语言解释其功能、逻辑和关键部分。",
    expertId: "code-expert",
    prompt: "作为一名资深软件架构师，请用清晰、易懂的语言解释以下代码的功能和实现逻辑。\n\n代码语言：{{language}}\n\n```\n{{code_snippet}}\n```",
  },
  {
    id: "code-002",
    title: "正则表达式生成器",
    description: "用自然语言描述你想要匹配的文本规则，AI 会为你生成对应的正则表达式。",
    expertId: "code-expert",
    prompt: "请根据以下需求，为我生成一个正则表达式：\n{{text_pattern_description}}",
  },
  // Default/Fallback Scenarios
   {
    id: "cpy-001",
    title: "通用文案润色",
    description: "输入一段初稿，AI会从语法、流畅度、吸引力等多个角度进行优化和润色。",
    expertId: "copywriting-expert",
    prompt: "请将以下文案进行润色，使其更具吸引力和专业性：\n\n{{draft_text}}",
  },
];
