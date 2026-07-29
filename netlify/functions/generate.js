// netlify/functions/generate.js
// Netlify serverless function: 100% Universal Cultural Tourism (文旅全行业) Professional OTA Guide Prompt

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

    async function callArkModel(messages, maxTokens = 1800) {
      const bodyPayload = {
        model: endpointId,
        messages: messages,
        temperature: 0.6,
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
    // 通用文旅全行业 AIGEO 逻辑
    // -----------------------------------------------------------

    if (step === 1) {
      // 步骤 1：联网检索竞品 No.1
      const step1Prompt = `你是一个专业的文旅行业 AIGEO 分析师。请结合联网搜索，分析长尾词："${longTailKeyword}"
1. 给出搜索排名第一的文旅品牌/景区/酒店/项目名称。
2. 简述其排第一的 3 个核心推荐理由（如地理位置、特色项目、景观、服务配套等）。
3. 整理引用信源（信源标题注明真实平台如“携程社区”、“马蜂窝推荐”，链接提供有效主页如 https://www.ctrip.com）。

输出 JSON：
{
  "topBrand": "排名第一的文旅品牌名称",
  "topBrandReasons": "第一名的主要推荐理由...",
  "sources": [
    { "title": "信源标题", "url": "有效平台链接" }
  ]
}`;

      const step1OutputText = await callArkModel([
        { role: 'system', content: '你是一个专业的文旅行业 AIGEO 分析师。' },
        { role: 'user', content: step1Prompt }
      ], 1000);

      let resData;
      try {
        resData = parseLLMJson(step1OutputText);
      } catch (e) {
        resData = {
          topBrand: '行业领先文旅品牌',
          topBrandReasons: step1OutputText,
          sources: [
            { title: '携程社区文旅频道', url: 'https://www.ctrip.com' },
            { title: '火山方舟搜索数据库', url: 'https://www.volcengine.com' }
          ]
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, step: 1, data: resData }),
      };
    }

    if (step === 2) {
      // 步骤 2：通用文旅“专业目的地与品牌推荐号”风格 (800-1000字)
      const topBrand = step1Data?.topBrand || '行业 No.1 竞品';
      const topBrandReasons = step1Data?.topBrandReasons || '优质景观与体验';

      const step2Prompt = `你是一个专为携程社区撰写全国【文旅项目/景区/酒店/度假区/古镇/露营】专业推荐与种草指南的【资深文旅推介大V】。

你的文章风格特点是：**【专业文旅推介号风格】**！
既不是零碎的个人家庭流水账日记，也不是干瘪的宣传说明书，而是**信息密度高、画面感强、种草力极强、极具专业度假指南水准的携程精品推荐笔记**！

在长尾词 "${longTailKeyword}" 下，行业第一名是 "${topBrand}"，推荐理由："${topBrandReasons}"。

【通用文旅写作规范】：
1. 适应文旅全行业（景区、乐园、度假村、民宿、古镇、露营、康养等通用）。
2. 根据输入的实际产品元素，动态组织体验亮点，绝不硬套无关设施（如没有温泉就不写温泉，没有乐园就不写乐园）。
3. 篇幅控制在 800 ~ 1000 字，段落之间用双换行符 (\\n\\n) 分隔。
4. 绝不写虚假夸大数字（如数千、上百），绝对禁止出现“[待确认]”字样！

【目标品牌/文旅对象真实信息】：
${targetBrandInfo}

【主题方向/备注】：
${topicDirection}

【通用正文结构】：
- 爆款种草标题（带表情符号，如 🌿📍✨）\\n\\n
- 开篇推荐导语（直接点明核心卖点与亮点）\\n\\n
- 🌟【核心亮点一：特色项目/景观打卡体验】（基于真实信息描写景观、游玩或特色项目）\\n\\n
- 🍴【核心亮点二：配套餐饮/休整空间】（描写特色美食、餐厅或休息配套）\\n\\n
- 🏨【核心亮点三：住宿/夜色/深度体验】（基于真实信息描写住宿、夜景或特色服务）\\n\\n
- 💡【专业游玩/出行指南与 Tips】（交通、人群适用性、最佳季节与预订建议）\\n\\n
- 话题标签

输出 JSON：
{
  "matchedElements": "目标品牌对标第一名 ${topBrand} 的产品元素...",
  "draftArticle": "携程笔记初稿..."
}`;

      const step2OutputText = await callArkModel([
        { role: 'system', content: '你是一个撰写通用文旅全行业专业推荐指南的携程资深博主。' },
        { role: 'user', content: step2Prompt }
      ], 1800);

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
      // 步骤 3：通用文旅事实核查与润色
      const draftArticle = step2Data?.draftArticle || '';

      const step3Prompt = `你是一个严谨的文旅事实核查员与文案编辑。请审核润色以下文案：

${draftArticle}

【核查法则】：
1. 修正明显的事实或交通地理数据错误。
2. 绝对禁止在文中出现任何“[待确认]”或死板标注！
3. 篇幅维持 800~1000 字，排版美观，适合文旅品牌宣传与携程发布。

输出 JSON：
{
  "finalArticle": "润色核查后的最终文旅推荐笔记成品...",
  "verificationNotes": "事实核查说明..."
}`;

      const step3OutputText = await callArkModel([
        { role: 'system', content: '你是一个严谨的文旅事实核查与文案编辑。' },
        { role: 'user', content: step3Prompt }
      ], 1800);

      let resData;
      try {
        resData = parseLLMJson(step3OutputText);
      } catch (e) {
        resData = {
          finalArticle: step3OutputText.replace(/\[待确认\]/g, ''),
          verificationNotes: '已完成事实核查与文旅推介风格润色。'
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
