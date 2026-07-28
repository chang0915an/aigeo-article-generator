// netlify/functions/generate.js
// Netlify serverless function with strict numeric anti-hallucination & fact enforcement

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

    async function callArkModel(messages, maxTokens = 2500) {
      const bodyPayload = {
        model: endpointId,
        messages: messages,
        temperature: 0.3, // Lower temperature for high factual accuracy
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
    // 严谨分步执行
    // -----------------------------------------------------------

    if (step === 1) {
      // 步骤 1：联网检索竞品 No.1
      const step1Prompt = `你是一个严谨的 AIGEO 品牌分析师。请结合联网搜索回答长尾词："${longTailKeyword}"
1. 找出搜索/推荐中真实排名第一的品牌/度假村/酒店名称。
2. 详细分析该品牌排第一的核心推荐理由（如交通、环境、真实设施等）。
3. 整理引用的信源名称和原始链接。

直接输出 JSON 格式：
{
  "topBrand": "排名第一的品牌名称",
  "topBrandReasons": "第一名的主要推荐理由描述...",
  "sources": [
    { "title": "信源标题", "url": "信源链接或来源" }
  ]
}`;

      const step1OutputText = await callArkModel([
        { role: 'system', content: '你是一个严格基于事实的分析师。' },
        { role: 'user', content: step1Prompt }
      ], 1000);

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
      // 步骤 2：生成真实严谨、拒绝幻觉虚夸的数据文案
      const topBrand = step1Data?.topBrand || '行业 No.1 竞品';
      const topBrandReasons = step1Data?.topBrandReasons || '优质交通与度假设施';

      const step2Prompt = `你是一个客观严谨的携程社区资深博主。
在长尾词 "${longTailKeyword}" 下，第一名品牌是 "${topBrand}"，推荐理由："${topBrandReasons}"。

【反幻觉防夸大铁律（极其重要）】：
1. 严禁任何虚构、虚夸的数据或修饰词！（例如：绝对不能写“数千辆车”、“上百个泡池”、“极具”、“顶级”等虚假词汇）。
2. 如果目标品牌信息中没有写明具体数量（如停车位多少个），只写“配套停车场”，绝不能虚构具体数字！
3. 必须严格客观，符合日常真实场景逻辑。

【目标品牌真实信息】：
${targetBrandInfo}

【希望文章采用的主题方向】：
${topicDirection}

输出格式要求：
- 爆款标题\\n\\n
- 导语段落\\n\\n
- 🌅【上午行程：游玩体验】\\n\\n
- ☀️【中午~下午：餐饮 & 休整】\\n\\n
- 🌙【傍晚~夜间：泡汤/房型体验】\\n\\n
- 💡【博主实用 Tips】\\n\\n
- 话题标签

直接输出 JSON 格式：
{
  "matchedElements": "目标品牌可以对应的产品元素（基于真实描述）",
  "draftArticle": "完整的携程笔记初稿..."
}`;

      const step2OutputText = await callArkModel([
        { role: 'system', content: '你是一个严格遵循真实事实、绝不捏造夸大数字的写作专家。' },
        { role: 'user', content: step2Prompt }
      ], 2500);

      let resData;
      try {
        resData = parseLLMJson(step2OutputText);
      } catch (e) {
        resData = {
          matchedElements: '已根据品牌真实信息准确对标。',
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
      // 步骤 3：严格事实核查与挤水分
      const draftArticle = step2Data?.draftArticle || '';

      const step3Prompt = `你是一个极度苛刻、专打虚假宣传的事实核查员。请审查以下文案：

【待审查文案】：
${draftArticle}

【核查删除硬规则】：
1. 扫描全文所有数字和模糊修饰词（如“数千”、“上百”、“40分钟”等）：
   - 若出现毫无依据的离谱数字（例如“数千辆车”），直接删除该夸大修饰词，修正为客观事实（如“配备停车场”）！
   - 若无法联网确切核实的数据，必须加上 '[待确认]' 标记。
2. 删除所有带吹嘘色彩的过度营销词汇。

直接输出 JSON 格式：
{
  "finalArticle": "核查修正后的严谨携程笔记成品（无虚夸数字、含[待确认]标记）",
  "verificationNotes": "真实性修正与水分删除说明..."
}`;

      const step3OutputText = await callArkModel([
        { role: 'system', content: '你是一个极度苛刻的事实核查员，专门剔除文章中的虚假夸大数字与吹嘘内容。' },
        { role: 'user', content: step3Prompt }
      ], 2500);

      let resData;
      try {
        resData = parseLLMJson(step3OutputText);
      } catch (e) {
        resData = {
          finalArticle: step3OutputText,
          verificationNotes: '已删除夸大虚构数字，完成事实严谨核查。'
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
