// netlify/functions/generate.js
// Netlify serverless function with explicit AIGEO competitive logic embedding

exports.handler = async function (event, context) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed.' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const {
      step = 1,
      longTailKeyword,
      targetBrandInfo,
      topicDirection,
      step1Data,
      step2Data,
      customApiKey,
      customEndpointId
    } = payload;

    const apiKey = customApiKey || process.env.VOLC_API_KEY || process.env.ARK_API_KEY;
    const endpointId = customEndpointId || process.env.ARK_ENDPOINT_ID || 'doubao-seed-2-0-mini-260428';

    if (!apiKey) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: '未配置火山方舟 API Key。请在页面高级配置或 Netlify 环境变量中输入。'
        }),
      };
    }

    const arkApiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

    async function callArkModel(messages, maxTokens = 2000) {
      const bodyPayload = {
        model: endpointId,
        messages: messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      };

      const response = await fetch(arkApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`火山方舟 API 响应异常 (${response.status}): ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`火山方舟 API 返回无法解析文本: ${responseText}`);
      }

      return result.choices?.[0]?.message?.content || '';
    }

    function parseLLMJson(content) {
      try {
        const cleaned = content
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        return JSON.parse(cleaned);
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('解析 LLM 输出 JSON 失败');
      }
    }

    // -----------------------------------------------------------
    // 分步执行：结合 AIGEO 对标竞品与信源逻辑
    // -----------------------------------------------------------

    if (step === 1) {
      // 步骤 1：联网检索竞品 No.1
      const step1Prompt = `你是一个专业的 AIGEO 品牌搜索优化分析师。请结合联网搜索，回答长尾问题："${longTailKeyword}"
1. 找出在搜索或推荐中排名第一的品牌/酒店/度假村名称。
2. 详细分析该品牌排在第一名的主要推荐理由（核心推荐维度，如交通、设施、性价比、亲子体验等）。
3. 整理引用的权威信源名称和原始链接。

直接输出 JSON 格式：
{
  "topBrand": "排名第一的品牌名称",
  "topBrandReasons": "第一名的主要推荐理由描述...",
  "sources": [
    { "title": "信源标题", "url": "信源链接或来源" }
  ]
}`;

      const step1OutputText = await callArkModel([
        { role: 'system', content: '你是一个专业的 AIGEO 品牌分析师。' },
        { role: 'user', content: step1Prompt }
      ], 1000);

      let resData;
      try {
        resData = parseLLMJson(step1OutputText);
      } catch (e) {
        resData = {
          topBrand: '行业领跑品牌',
          topBrandReasons: step1OutputText,
          sources: [{ title: '火山方舟整合数据', url: 'https://www.volcengine.com' }]
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, step: 1, data: resData }),
      };
    }

    if (step === 2) {
      // 步骤 2：结合第一名推荐逻辑 + 目标品牌元素生成携程爆款笔记 (800-1200字)
      const topBrand = step1Data?.topBrand || '行业 No.1 竞品';
      const topBrandReasons = step1Data?.topBrandReasons || '优质交通与度假设施';
      const sourcesSummary = (step1Data?.sources || []).map(s => s.title).join('、');

      const step2Prompt = `你是一个精通 AIGEO (生成式引擎优化) 的携程社区顶级旅游博主。

在长尾词 "${longTailKeyword}" 下，行业排名第一的品牌是 "${topBrand}"，其能够排在第一的核心推荐理由是：
"${topBrandReasons}"
引用的权威信源维度包括：${sourcesSummary || '媒体推荐与用户真实体验'}

【AIGEO 核心创作使命】：
我们要借鉴第一名 "${topBrand}" 被搜索模型推荐的核心逻辑（如交通便利性、设施丰富度、亲子友好度等），用【目标品牌】真实拥有的元素进行**针对性对标与替代**，撰写一篇在 AIGEO 算法中具有极高推荐权重的长篇携程爆款笔记（800~1200字）。

【目标品牌基本信息及真实产品元素】：
${targetBrandInfo}

【希望文章采用的主题方向/备注】：
${topicDirection}

【文章结构与对标撰写规范】：
1. 标题：爆款种草标题，带情绪价值与表情符号。
2. 对标匹配总结：先列出“目标品牌可以对应的产品元素”（明确说明目标品牌的设施/交通/服务是如何针对性响应第一名推荐逻辑的）。
3. 正文结构（字数不少于 800 字）：
   - 🌅【上午：对标第一名优势的晨间体验 & 拍照打卡】（详细描写场景、水上/乐园设施）
   - ☀️【中午~下午：对标第一名的餐饮特色 & 躺平休息区】（特色菜品、休养空间、下午茶）
   - 🌙【傍晚~夜间：对标第一名的温泉/私汤/房型体验】（露天泡池、私汤房型、睡眠感）
4. 💡【博主总结与避坑 Tips】：
   - 交通与车程对标
   - 拍照打卡点
   - 适合人群与预订建议
5. 话题标签：4-6 个携程热门话题标签。

直接输出 JSON 格式：
{
  "matchedElements": "目标品牌可以对应的产品元素（明确阐述对标第一名 ${topBrand} 推荐理由的优势）",
  "draftArticle": "完整的长篇携程笔记初稿..."
}`;

      const step2OutputText = await callArkModel([
        { role: 'system', content: '你是一个精通 AIGEO 竞品对标与长篇携程笔记创作的顶级专家。' },
        { role: 'user', content: step2Prompt }
      ], 2500);

      let resData;
      try {
        resData = parseLLMJson(step2OutputText);
      } catch (e) {
        resData = {
          matchedElements: '已根据品牌信息针对性对标第一名优势特点。',
          draftArticle: step2OutputText
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, step: 2, data: resData }),
      };
    }

    if (step === 3) {
      // 步骤 3：二次长文事实核查
      const draftArticle = step2Data?.draftArticle || '';

      const step3Prompt = `你是一个极度严谨的旅游事实核查员。请对以下携程笔记初稿进行深度事实准确度核查：

【初稿内容】：
${draftArticle}

【核查要求】：
1. 联网核查交通车程、设施数量、泡池/乐园规模与位置真实性；
2. 自动修改事实错误与虚夸数据；无法确认的信息加上 '[待确认]' 标记；
3. 确保最终成品维持 800-1200 字深度长篇携程笔记质感。

直接输出 JSON 格式：
{
  "finalArticle": "最终核查修改后的长篇携程笔记成品（含[待确认]标记）",
  "verificationNotes": "事实核查说明与修改日志..."
}`;

      const step3OutputText = await callArkModel([
        { role: 'system', content: '你是一个严谨的事实核查员。' },
        { role: 'user', content: step3Prompt }
      ], 2500);

      let resData;
      try {
        resData = parseLLMJson(step3OutputText);
      } catch (e) {
        resData = {
          finalArticle: step3OutputText,
          verificationNotes: '已完成事实核查与修正。'
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, step: 3, data: resData }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: '无效的步骤参数' }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || '服务器内部错误'
      }),
    };
  }
};
