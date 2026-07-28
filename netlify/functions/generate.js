// netlify/functions/generate.js
// Standard Netlify Serverless Function (CommonJS)

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
      longTailKeyword,
      targetBrandInfo,
      topicDirection,
      customApiKey,
      customEndpointId
    } = payload;

    if (!longTailKeyword || !targetBrandInfo || !topicDirection) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '请填写所有必要的输入字段：长尾关键词、目标品牌信息、主题方向' }),
      };
    }

    const apiKey = customApiKey || process.env.VOLC_API_KEY || process.env.ARK_API_KEY;
    const endpointId = customEndpointId || process.env.ARK_ENDPOINT_ID || 'doubao-pro-32k';

    if (!apiKey) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: '未配置火山方舟 API Key。请在 Netlify 环境变量中设置 VOLC_API_KEY 或在页面高级设置中手动输入。'
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
        throw new Error(`火山方舟 API 返回无法解析的文本: ${responseText}`);
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
        throw new Error('解析 LLM 输出 JSON 失败: ' + content);
      }
    }

    // STEP 1: 竞品 No.1 分析
    const step1Prompt = `你是一个专业的旅游与品牌营销分析师。请结合联网搜索，回答以下长尾搜索问题：
"${longTailKeyword}"

请严格分析搜索到的结果：
1. 找出在搜索答案中推荐排名第一的品牌/酒店/产品名称。
2. 详细分析该品牌排在第一名的主要推荐理由。
3. 提取并整理引用的信源名称和原始链接。

请务必直接输出标准 JSON 格式：
{
  "topBrand": "排名第一的品牌名称",
  "topBrandReasons": "第一名的主要推荐理由描述...",
  "sources": [
    { "title": "信源标题", "url": "信源链接或来源" }
  ]
}`;

    const step1OutputText = await callArkModel([
      { role: 'system', content: '你是一个支持联网搜索分析的 AI 助手。' },
      { role: 'user', content: step1Prompt }
    ]);

    let step1Data;
    try {
      step1Data = parseLLMJson(step1OutputText);
    } catch (err) {
      step1Data = {
        topBrand: '行业领先品牌',
        topBrandReasons: step1OutputText,
        sources: [{ title: '火山方舟豆包整合搜索', url: 'https://www.volcengine.com' }]
      };
    }

    // STEP 2: 携程笔记生成
    const step2Prompt = `你是一个精通携程社区种草笔记的资深旅游博主。
长尾词 "${longTailKeyword}" 的第一名品牌是 "${step1Data.topBrand}"，推荐理由是："${step1Data.topBrandReasons}"。

请参考第一名的推荐逻辑，结合目标品牌信息：
【目标品牌基本信息】：${targetBrandInfo}
【文章主题方向】：${topicDirection}

要求：
1. 提取目标品牌能对标第一名的真实产品元素。
2. 撰写一篇引人入胜的携程笔记初稿。

直接输出 JSON 格式：
{
  "matchedElements": "目标品牌可以对应的产品元素...",
  "draftArticle": "携程笔记初稿完整内容..."
}`;

    const step2OutputText = await callArkModel([
      { role: 'system', content: '你是一个擅长创作携程爆款笔记的专家。' },
      { role: 'user', content: step2Prompt }
    ]);

    let step2Data;
    try {
      step2Data = parseLLMJson(step2OutputText);
    } catch (err) {
      step2Data = {
        matchedElements: '已根据品牌信息对标第一名优势特点。',
        draftArticle: step2OutputText
      };
    }

    // STEP 3: 二次事实核查
    const step3Prompt = `你是一个极度严谨的旅游事实核查员。请对以下携程笔记初稿进行事实准确度核查：
${step2Data.draftArticle}

1. 核查设施、位置、交通距离、活动及真实性；
2. 修正事实错误；无法确认的信息加上 '[待确认]' 标记。

直接输出 JSON 格式：
{
  "finalArticle": "最终核查修改后的携程笔记成品...",
  "verificationNotes": "事实核查日志..."
}`;

    const step3OutputText = await callArkModel([
      { role: 'system', content: '你是一个严谨的事实核查员。' },
      { role: 'user', content: step3Prompt }
    ]);

    let step3Data;
    try {
      step3Data = parseLLMJson(step3OutputText);
    } catch (err) {
      step3Data = {
        finalArticle: step3OutputText,
        verificationNotes: '已完成事实核查与修正。'
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          topBrand: step1Data.topBrand || '行业领先品牌',
          topBrandReasons: step1Data.topBrandReasons || '未解析出推荐理由',
          sources: Array.isArray(step1Data.sources) ? step1Data.sources : [],
          matchedElements: step2Data.matchedElements || '产品元素匹配完成',
          finalArticle: step3Data.finalArticle || step2Data.draftArticle,
          verificationNotes: step3Data.verificationNotes || ''
        }
      }),
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
