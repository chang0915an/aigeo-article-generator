import React, { useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import StepProgress from './components/StepProgress';
import ResultCards from './components/ResultCards';
import { AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async (formData) => {
    setIsLoading(true);
    setErrorMsg('');
    setIsDone(false);
    setResultData(null);
    setCurrentStep(1);

    try {
      const stepTimer1 = setTimeout(() => setCurrentStep(2), 2500);
      const stepTimer2 = setTimeout(() => setCurrentStep(3), 5000);

      // Try /.netlify/functions/generate first, fallback to /api/generate
      let response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok && response.status === 404) {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const responseText = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`后端接口未正常响应，请确认 Netlify Functions 已部署。HTTP 状态码: ${response.status}`);
      }

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || '生成失败，请检查 API Key 与 Endpoint ID 配置');
      }

      setCurrentStep(3);
      setIsDone(true);
      setResultData(resJson.data);
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
              <h2 className="text-base font-bold text-slate-100">
                AIGEO 携程笔记极速生成与全自动核查
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
        <p>AIGEO 文章生成与事实核查系统 · 基于 Netlify Functions &amp; 火山方舟豆包 API</p>
      </footer>
    </div>
  );
}
