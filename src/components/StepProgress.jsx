import React from 'react';
import { Search, Edit3, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

export default function StepProgress({ currentStep, isDone }) {
  const steps = [
    {
      id: 1,
      title: '第一步：豆包联网搜索',
      desc: '检索长尾问题，提取排名第一的品牌、推荐理由与引用信源',
      icon: Search,
    },
    {
      id: 2,
      title: '第二步：携程笔记生成',
      desc: '借鉴第一名推荐逻辑，结合目标品牌真实元素生成初稿',
      icon: Edit3,
    },
    {
      id: 3,
      title: '第三步：二次联网事实核查',
      desc: '核查设施、交通、活动等真实性，自动修改或标记 [待确认]',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 mb-8 backdrop-blur">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        AIGEO 执行流程状态
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          let status = 'pending'; // pending | active | completed

          if (isDone) {
            status = 'completed';
          } else if (currentStep === step.id) {
            status = 'active';
          } else if (currentStep > step.id) {
            status = 'completed';
          }

          return (
            <div
              key={step.id}
              className={`p-4 rounded-xl border transition-all ${
                status === 'active'
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : status === 'completed'
                  ? 'bg-slate-900/60 border-emerald-500/40'
                  : 'bg-slate-900/30 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    status === 'active'
                      ? 'bg-cyan-500 text-white'
                      : status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {status === 'active' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <h4 className={`text-xs font-medium ${
                    status === 'active' ? 'text-cyan-300' : status === 'completed' ? 'text-emerald-300' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
