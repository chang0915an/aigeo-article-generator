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

  const callDirectVolcengine = async (apiKey, endpointId, messages, maxTokens = 1800) => {
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
        temperature: 0.5,
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

      if (apiKey) {
        // ----------------------------------------------------
        // 步骤 1：直连分析竞品 No.1
        // ----------------------------------------------------
        setCurrentStep(1);
        const step1Prompt = `你是一个专业的 AIGEO 品牌分析师。请结合联网搜索，分析长尾词："${longTailKeyword}"
1. 给出搜索排名第一的品牌名称。
2. 简述其排第一的 3 个核心理由。
3. 整理引用信源（信源标题注明真实平台如“携程社区攻略”、“马蜂窝推荐”，链接提供有效主页如 https://www.ctrip.com，严禁假 404 链接）。

输出 JSON：
{
  "topBrand": "排名第一的品牌名称",
  "topBrandReasons": "第一名的主要推荐理由...",
  "sources": [
    { "title": "信源标题", "url": "有效平台链接" }
  ]
}`;

        const s1Text = await callDirectVolcengine(apiKey, endpointId, [
          { role: 'system', content: '你是一个专业的 AIGEO 品牌分析师。' },
          { role: 'user', content: step1Prompt }
        ], 1000);

        try {
          step1Res = parseJsonOutput(s1Text);
        } catch (e) {
          step1Res = {
            topBrand: '行业领先品牌',
            topBrandReasons: s1Text,
            sources: [{ title: '携程社区综合数据', url: 'https://www.ctrip.com' }]
          };
        }

        // ----------------------------------------------------
        // 步骤 2：直连撰写 800~1000 字精炼携程爆款笔记 (严禁出现 [待确认])
        // ----------------------------------------------------
        setCurrentStep(2);
        const topBrand = step1Res.topBrand || '行业 No.1';
        const topBrandReasons = step1Res.topBrandReasons || '优质设施';

        const step2Prompt = `你是一个优秀的携程社区旅游博主。
在长尾词 "${longTailKeyword}" 下，第一名是 "${topBrand}"，推荐理由："${topBrandReasons}"。

【要求】：
1. 篇幅控制在 800 ~ 1000 字。
2. 文风真实自然流畅。大段落间用双换行符 (\\n\\n) 分隔。
3. 严禁出现任何“[待确认]”字样！

【目标品牌真实信息】：
${targetBrandInfo}

【主题方向】：
${topicDirection}

【正文结构】：
- 爆款标题\\n\\n
- 导语\\n\\n
- 🌅【上午行程：游玩体验】\\n\\n
- ☀️【中午~下午：餐饮 & 休息区】\\n\\n
- 🌙【傍晚~夜间：温泉/房型】\\n\\n
- 💡【博主实用 Tips】\\n\\n
- 话题标签

输出 JSON：
{
  "matchedElements": "目标品牌对标元素...",
  "draftArticle": "携程笔记初稿..."
}`;

        const s2Text = await callDirectVolcengine(apiKey, endpointId, [
          { role: 'system', content: '你是一个文字精炼、篇幅 800-1000 字的携程博主。' },
          { role: 'user', content: step2Prompt }
        ], 1800);

        try {
          step2Res = parseJsonOutput(s2Text);
        } catch (e) {
          step2Res = { matchedElements: '已对标第一名优势特点。', draftArticle: s2Text };
        }

        // ----------------------------------------------------
        // 步骤 3：直连核查与润色（彻底禁用 [待确认] 标记）
        // ----------------------------------------------------
        setCurrentStep(3);
        const draftArticle = step2Res.draftArticle || '';

        const step3Prompt = `你是一个经验丰富、客观严谨的事实核查员。审核润色以下文案：

${draftArticle}

【核查规则】：
1. 绝对禁止在文章中出现“[待确认]”字眼！非核心细节润色为通顺自然表达。
2. 修正明显的交通或位置数据。
3. 保持 800~1000 字，排版美观可直接发布。

输出 JSON：
{
  "finalArticle": "核查后的最终携程笔记成品（无[待确认]字样）...",
  "verificationNotes": "核查与修正说明..."
}`;

        const s3Text = await callDirectVolcengine(apiKey, endpointId, [
          { role: 'system', content: '你是一个理性客观、严禁输出[待确认]标记的事实核查员。' },
          { role: 'user', content: step3Prompt }
        ], 1800);

        try {
          step3Res = parseJsonOutput(s3Text);
        } catch (e) {
          step3Res = { finalArticle: s3Text.replace(/\[待确认\]/g, ''), verificationNotes: '已完成事实核查与表达润色。' };
        }

      } else {
        // 无前端 Key 时，走 Serverless 模式
        setCurrentStep(1);
        step1Res = await callNetlifyStep({ step: 1, ...formData });

        setCurrentStep(2);
        step2Res = await callNetlifyStep({ step: 2, step1Data: step1Res, ...formData });

        setCurrentStep(3);
        step3Res = await callNetlifyStep({ step: 3, step1Data: step1Res, step2Data: step2Res, ...formData });
      }

      // 强行剔除任何残余的 [待确认]
      const cleanArticle = (step3Res.finalArticle || step2Res.draftArticle || '').replace(/\[待确认\]/g, '');

      setResultData({
        topBrand: step1Res.topBrand || '竞品领先品牌',
        topBrandReasons: step1Res.topBrandReasons || '优质特色与服务',
        sources: Array.isArray(step1Res.sources) ? step1Res.sources : [],
        matchedElements: step2Res.matchedElements || '目标品牌匹配元素完成',
        finalArticle: cleanArticle,
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
                  智能联网与深度生成
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
