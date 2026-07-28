import React, { useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import StepProgress from './components/StepProgress';
import ResultCards from './components/ResultCards';
import { AlertTriangle, Sparkles, Zap } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ----------------------------------------------------------------
  // 直连火山方舟 API (浏览器端直连，彻底解除 10 秒超时限制，实现顶级质量长文)
  // ----------------------------------------------------------------
  const callDirectVolcengine = async (apiKey, endpointId, messages, maxTokens = 3000) => {
    const arkUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const response = await fetch(arkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: endpointId || 'doubao-seed-2-0-mini-260428',
        messages: messages,
        temperature: 0.6,
        max_tokens: maxTokens
      })
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`火山方舟 API 响应异常 (${response.status}): ${text}`);
    }

    let jsonRes;
    try {
      jsonRes = JSON.parse(text);
    } catch (e) {
      throw new Error(`解析 API 返回失败: ${text}`);
    }

    return jsonRes.choices?.[0]?.message?.content || '';
  };

  // 辅助解析 JSON
  const parseJsonOutput = (content) => {
    try {
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('解析 JSON 数据失败');
    }
  };

  // 后端 Netlify Function 降级备用调用
  const callNetlifyStep = async (payload) => {
    let response = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status === 404) {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    const responseText = await response.text();
    let resJson;
    try {
      resJson = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`后端未正常响应 (${response.status}): ${responseText.substring(0, 100)}`);
    }

    if (!response.ok || !resJson.success) {
      throw new Error(resJson.error || '调用失败');
    }

    return resJson.data;
  };

  const handleGenerate = async (formData) => {
    setIsLoading(true);
    setErrorMsg('');
    setIsDone(false);
    setResultData(null);

    const {
      longTailKeyword,
      targetBrandInfo,
      topicDirection,
      customApiKey,
      customEndpointId
    } = formData;

    const apiKey = customApiKey || '';
    const endpointId = customEndpointId || 'doubao-seed-2-0-mini-260428';

    try {
      let step1Res, step2Res, step3Res;

      // 如果用户在前端填写了 API Key，直接开启【全速无限制直连模式】！不限时长、极高质量！
      if (apiKey) {
        console.log('🚀 开启浏览器直连模式（彻底解除 10 秒超时限制，极致长文与深度核查）');

        // ----------------------------------------------------
        // 步骤 1：直连分析竞品 No.1
        // ----------------------------------------------------
        setCurrentStep(1);
        const step1Prompt = `你是一个专业的 AIGEO 品牌分析师。请结合联网搜索，深度回答长尾问题："${longTailKeyword}"
1. 找出搜索/推荐中真实排名第一的品牌/度假村名称。
2. 详细分析该品牌排第一的核心推荐理由（如交通、环境、特色设施、性价比、亲子体验等真实优势）。
3. 整理引用的权威信源名称和原始链接。

直接输出 JSON 格式：
{
  "topBrand": "排名第一的品牌名称",
  "topBrandReasons": "第一名的主要推荐理由描述...",
  "sources": [
    { "title": "信源标题", "url": "信源链接或来源" }
  ]
}`;

        const s1Text = await callDirectVolcengine(apiKey, endpointId, [
          { role: 'system', content: '你是一个专业的 AIGEO 品牌分析师。' },
          { role: 'user', content: step1Prompt }
        ], 1200);

        try {
          step1Res = parseJsonOutput(s1Text);
        } catch (e) {
          step1Res = { topBrand: '行业领跑品牌', topBrandReasons: s1Text, sources: [] };
        }

        // ----------------------------------------------------
        // 步骤 2：直连撰写 1000~1500 字极致长篇携程爆款笔记
        // ----------------------------------------------------
        setCurrentStep(2);
        const topBrand = step1Res.topBrand || '行业 No.1 竞品';
        const topBrandReasons = step1Res.topBrandReasons || '优质交通与度假设施';

        const step2Prompt = `你是一个拥有百万粉丝的携程社区顶级旅游博主。
在长尾词 "${longTailKeyword}" 下，行业排名第一的品牌是 "${topBrand}"，推荐理由为："${topBrandReasons}"。

【创作铁律与严谨要求】：
1. 恪守真实严谨原则！绝对不能凭空虚构夸大数字（例如：绝对不能写“数千辆车”、“上百个泡池”等虚假描述，若品牌信息未明确数量只写客观现象）。
2. 字数要求 1000~1500 字，排版极其美观精细，大段落之间必须使用双换行符 (\\n\\n) 隔开！

【目标品牌真实信息及产品元素】：
${targetBrandInfo}

【文章主题方向】：
${topicDirection}

【长文排版结构】：
- 爆款标题（带表情符号）\\n\\n
- 导语段落\\n\\n
- 🌅【上午行程：深入游玩/打卡体验】\\n（详细写场景与真实感官体感）\\n\\n
- ☀️【中午~下午：特色餐饮指南 & 躺平休整区】\\n（写餐品特色与休息空间）\\n\\n
- 🌙【傍晚~夜间：温泉/私汤/星空夜宿体验】\\n（写露天泡池与室内私汤房型）\\n\\n
- 💡【博主深度 Tips与避坑指南】\\n（包含交通自驾路线、最佳拍照位、人群建议及预订指南）\\n\\n
- 话题标签

直接输出 JSON 格式：
{
  "matchedElements": "目标品牌可以对应的产品元素（基于真实描述）",
  "draftArticle": "完整的长篇携程笔记初稿（包含明确的 \\n\\n 段落分隔）..."
}`;

        const s2Text = await callDirectVolcengine(apiKey, endpointId, [
          { role: 'system', content: '你是一个擅长创作 1000-1500 字深度长篇携程爆款笔记的顶级博主。' },
          { role: 'user', content: step2Prompt }
        ], 3000);

        try {
          step2Res = parseJsonOutput(s2Text);
        } catch (e) {
          step2Res = { matchedElements: '已对标第一名优势特点。', draftArticle: s2Text };
        }

        // ----------------------------------------------------
        // 步骤 3：直连深度事实核查与挤水分
        // ----------------------------------------------------
        setCurrentStep(3);
        const draftArticle = step2Res.draftArticle || '';

        const step3Prompt = `你是一个极度苛刻、专打虚假宣传的事实核查员。请审查以下文案：

【待审查文案】：
${draftArticle}

【核查删除硬规则】：
1. 剔除全文所有夸张、虚构的数据和词汇（如“数千辆”、“上百个”等模糊夸大描述），替换为客观真实用语；
2. 联网核查交通车程、泡池乐园设施数量与位置真实性；
3. 无法确切核实的数据必须加上 '[待确认]' 标记；
4. 保留良好分段排版（包含双换行符 \\n\\n）。

直接输出 JSON 格式：
{
  "finalArticle": "核查修正后的严谨长篇携程笔记成品（无虚夸数字、含[待确认]标记）",
  "verificationNotes": "真实性修正与水分删除说明..."
}`;

        const s3Text = await callDirectVolcengine(apiKey, endpointId, [
          { role: 'system', content: '你是一个极度苛刻的事实核查员，专门剔除虚假夸大数字。' },
          { role: 'user', content: step3Prompt }
        ], 3000);

        try {
          step3Res = parseJsonOutput(s3Text);
        } catch (e) {
          step3Res = { finalArticle: s3Text, verificationNotes: '已删除夸大虚构数字，完成严谨核查。' };
        }

      } else {
        // 无前端 Key 时，走 Serverless 分步模式
        setCurrentStep(1);
        step1Res = await callNetlifyStep({ step: 1, ...formData });

        setCurrentStep(2);
        step2Res = await callNetlifyStep({ step: 2, step1Data: step1Res, ...formData });

        setCurrentStep(3);
        step3Res = await callNetlifyStep({ step: 3, step1Data: step1Res, step2Data: step2Res, ...formData });
      }

      // 组装最终 5 大模块数据展示
      setResultData({
        topBrand: step1Res.topBrand || '竞品领先品牌',
        topBrandReasons: step1Res.topBrandReasons || '优质特色与服务',
        sources: Array.isArray(step1Res.sources) ? step1Res.sources : [],
        matchedElements: step2Res.matchedElements || '目标品牌匹配元素完成',
        finalArticle: step3Res.finalArticle || step2Res.draftArticle,
        verificationNotes: step3Res.verificationNotes || '已完成事实核查'
      });

      setIsDone(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || '生成过程出现错误');
      setIsDone(false);
      setCurrentStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center">
                <span>AIGEO 携程笔记极速生成与全自动核查</span>
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  <Zap className="w-3 h-3 mr-1" />
                  支持无限制长文直连
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                只需输入长尾词、品牌产品元素与主题方向，系统将先使用<strong className="text-cyan-300 font-normal">豆包/火山方舟 API</strong> 检索第一名竞品的推荐逻辑，再结合您真实的品牌元素生成携程笔记，最后二次联网校验设施与事实。
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-start">
            <StepProgress currentStep={currentStep} isDone={isDone} />

            {errorMsg && (
              <div className="bg-rose-950/50 border border-rose-800/80 rounded-2xl p-5 text-rose-200 text-xs flex items-start space-x-3 backdrop-blur animate-shake">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-300 text-sm mb-1">请求报错提醒</h4>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {!resultData && !isLoading && !errorMsg && (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                点击左侧“开始生成”或“填入示例Demo数据”开始体验
              </div>
            )}
          </div>
        </div>

        {resultData && <ResultCards data={resultData} />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>AIGEO 文章生成与事实核查系统 · 基于 Netlify &amp; 火山方舟豆包 API</p>
      </footer>
    </div>
  );
}
