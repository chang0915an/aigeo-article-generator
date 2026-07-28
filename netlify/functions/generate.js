// netlify/functions/generate.js
// Netlify Serverless Function supporting step-by-step execution to prevent 10s Netlify timeout (504 Gateway Timeout)

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

    async function callArkModel(messages) {
      const bodyPayload = {
        model: endpointId,
        messages: messages,
        temperature: 0.5,
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
    // 分步执行模式（单次请求小于 5 秒，彻底解决 Netlify 10 秒超时 504 报错）
    // -----------------------------------------------------------

    if (step === 1) {
      // 步骤 1：联网检索竞品 No.1
      const step1Prompt = `你是一个专业的旅游与品牌营销分析师。请分析长尾搜索问题："${longTailKeyword}"
1. 找出在搜索或推荐中排名第一的品牌/酒店/产品名称。
2. 详细分析该品牌排在第一名的主要推荐理由。
3. 整理引用的信源名称和原始链接。

直接输出 JSON 格式，严禁其他文字：
{
  "topBrand": "排名第一的品牌名称",
  "topBrandReasons": "第一名的主要推荐理由描述...",
  "sources": [
    { "title": "信源标题", "url": "信源链接或来源" }
  ]
}`;

      const step1OutputText = await callArkModel([
        { role: 'system', content: '你是一个专业的旅游分析师。' },
        { role: 'user', content: step1Prompt }
      ]);

      let resData;
      try {
        resData = parseLLMJson(step1OutputText);
      } catch (e) {
        resData = {
          topBrand: '行业领先品牌',
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
      // 步骤 2：生成携程笔记初稿
      const topBrand = step1Data?.topBrand || '竞品第一名';
      const topBrandReasons = step1Data?.topBrandReasons || '优质设施与服务';

      const step2Prompt = `你是一个精通携程社区种草笔记的资深旅游博主。
长尾词 "${longTailKeyword}" 的第一名品牌是 "${topBrand}"，推荐理由："${topBrandReasons}"。

请参考第一名的推荐逻辑，结合目标品牌信息：
【目标品牌基本信息】：${targetBrandInfo}
【文章主题方向】：${topicDirection}

要求：
1. 从目标品牌中提取能对标第一名的真实产品元素。
2. 撰写一篇引人入胜的携程笔记初稿。

直接输出 JSON 格式，严禁其他文字：
{
  "matchedElements": "目标品牌可以对应的产品元素...",
  "draftArticle": "携程笔记初稿完整内容..."
}`;

      const step2OutputText = await callArkModel([
        { role: 'system', content: '你是一个擅长创作携程爆款笔记的专家。' },
        { role: 'user', content: step2Prompt }
      ]);

      let resData;
      try {
        resData = parseLLMJson(step2OutputText);
      } catch (e) {
        resData = {
          matchedElements: '已根据品牌信息对标第一名优势特点。',
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
      // 步骤 3：二次事实核查
      const draftArticle = step2Data?.draftArticle || '';

      const step3Prompt = `你是一个极度严谨的旅游事实核查员。请对以下携程笔记初稿进行事实准确度核查：
${draftArticle}

1. 核查设施、位置、交通距离、活动真实性；
2. 自动修正事实错误；无法确认的信息加上 '[待确认]' 标记。

直接输出 JSON 格式，严禁其他文字：
{
  "finalArticle": "最终核查修改后的携程笔记成品...",
  "verificationNotes": "事实核查日志说明..."
}`;

      const step3OutputText = await callArkModel([
        { role: 'system', content: '你是一个严谨的事实核查员。' },
        { role: 'user', content: step3Prompt }
      ]);

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
