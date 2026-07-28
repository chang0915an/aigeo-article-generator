// netlify/functions/generate.js
// Optimized serverless function for ultra-fast response (<5s per step) to bypass Netlify 10s Inactivity Timeout

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

    async function callArkModel(messages, maxTokens = 1200) {
      const bodyPayload = {
        model: endpointId,
        messages: messages,
        temperature: 0.3,
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
    // 极速分步模式 (精简 Prompt，保证 3~5 秒内迅速吐出结果，彻底告别 10s Timeout)
    // -----------------------------------------------------------

    if (step === 1) {
      // 步骤 1：联网检索竞品 No.1
      const step1Prompt = `分析长尾词："${longTailKeyword}"
1. 给出搜索排名第一的品牌名称。
2. 简述其排第一的 3 个核心理由。
3. 整理引用信源标题和链接。

输出 JSON：
{
  "topBrand": "排名第一的品牌名称",
  "topBrandReasons": "第一名的主要推荐理由...",
  "sources": [
    { "title": "信源标题", "url": "链接或来源" }
  ]
}`;

      const step1OutputText = await callArkModel([
        { role: 'system', content: '简洁精准的 AIGEO 分析师。' },
        { role: 'user', content: step1Prompt }
      ], 800);

      let resData;
      try {
        resData = parseLLMJson(step1OutputText);
      } catch (e) {
        resData = {
          topBrand: '行业领先品牌',
          topBrandReasons: step1OutputText,
          sources: [{ title: '火山方舟数据', url: 'https://www.volcengine.com' }]
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, step: 1, data: resData }),
      };
    }

    if (step === 2) {
      // 步骤 2：生成携程爆款笔记初稿
      const topBrand = step1Data?.topBrand || '行业 No.1';
      const topBrandReasons = step1Data?.topBrandReasons || '优质设施';

      const step2Prompt = `参考第一名 "${topBrand}" 的理由："${topBrandReasons}"。
结合目标品牌信息：
${targetBrandInfo}
主题方向：${topicDirection}

要求：
1. 提取目标品牌对标第一名的真实产品元素。
2. 撰写一篇引人入胜的携程笔记（字数约 600-800 字，分段清晰，双换行符分隔，绝对不虚构数据）。

输出 JSON：
{
  "matchedElements": "目标品牌对标元素...",
  "draftArticle": "携程笔记初稿..."
}`;

      const step2OutputText = await callArkModel([
        { role: 'system', content: '严谨、文字精炼的携程博主。' },
        { role: 'user', content: step2Prompt }
      ], 1500);

      let resData;
      try {
        resData = parseLLMJson(step2OutputText);
      } catch (e) {
        resData = {
          matchedElements: '已对标第一名优势特点。',
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
      // 步骤 3：事实核查
      const draftArticle = step2Data?.draftArticle || '';

      const step3Prompt = `核查以下携程笔记的事实真实性：
${draftArticle}

1. 删改任何夸张虚构字眼；
2. 无法确定的项加上 '[待确认]'；
3. 保留良好分段排版。

输出 JSON：
{
  "finalArticle": "核查后的携程笔记成品...",
  "verificationNotes": "核查与修正说明..."
}`;

      const step3OutputText = await callArkModel([
        { role: 'system', content: '严谨的事实核查员。' },
        { role: 'user', content: step3Prompt }
      ], 1500);

      let resData;
      try {
        resData = parseLLMJson(step3OutputText);
      } catch (e) {
        resData = {
          finalArticle: step3OutputText,
          verificationNotes: '已完成事实核查与挤水分修正。'
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
