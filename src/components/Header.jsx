import React from 'react';
import { Sparkles, Globe, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AIGEO 文章生成与事实核查
            </h1>
            <p className="text-xs text-slate-400">基于豆包/火山方舟联网搜索 API · 携程笔记极速生成</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            <Globe className="w-3.5 h-3.5 mr-1" />
            豆包联网搜索 API
          </span>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            自动事实核查
          </span>
        </div>
      </div>
    </header>
  );
}
