import React, { useState } from 'react';
import { Award, Lightbulb, ExternalLink, Target, FileCheck, Copy, Check, Download, Info } from 'lucide-react';

export default function ResultCards({ data }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const {
    topBrand,
    topBrandReasons,
    sources = [],
    matchedElements,
    finalArticle,
    verificationNotes
  } = data;

  const handleCopy = () => {
    navigator.clipboard.writeText(finalArticle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([finalArticle], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `携程笔记_${topBrand || 'AIGEO'}_核查版.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to split article into clean spaced paragraphs
  const renderFormattedArticle = (text) => {
    if (!text) return null;
    // Split by newlines and filter out empty strings while preserving paragraph blocks
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== '');

    return (
      <div className="space-y-4 text-slate-100 text-sm leading-relaxed">
        {paragraphs.map((para, idx) => {
          const trimmed = para.trim();
          // Title / Header detection
          if (trimmed.startsWith('#') || trimmed.startsWith('【') || idx === 0) {
            return (
              <div key={idx} className="font-bold text-slate-50 text-base border-l-2 border-cyan-400 pl-3 my-3">
                {trimmed}
              </div>
            );
          }
          return (
            <p key={idx} className="text-slate-200 leading-relaxed text-sm bg-slate-900/40 p-3 rounded-lg border border-slate-800/40">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 模块 1 & 模块 2 双列视图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 卡片 1：排名第一的品牌 */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none"></div>
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-amber-300">1. 排名第一的品牌</h3>
          </div>
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-lg font-bold text-amber-200">
            {topBrand || '未查询到'}
          </div>
        </div>

        {/* 卡片 2：第一名的主要推荐理由 */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none"></div>
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-cyan-300">2. 第一名的主要推荐理由</h3>
          </div>
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {topBrandReasons || '暂无数据'}
          </div>
        </div>
      </div>

      {/* 卡片 3：引用信源和链接 */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg backdrop-blur">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <ExternalLink className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-blue-300">3. 引用信源和链接</h3>
        </div>

        {sources && sources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sources.map((src, index) => (
              <a
                key={index}
                href={src.url && src.url.startsWith('http') ? src.url : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-3 rounded-xl flex items-start space-x-2.5 transition group"
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 group-hover:bg-blue-900 group-hover:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate group-hover:text-blue-300">
                    {src.title || '信源链接'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {src.url || '来自豆包联网搜索数据库'}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/80 rounded-xl p-4 text-xs text-slate-400 italic">
            豆包联网搜索整合数据。
          </div>
        )}
      </div>

      {/* 卡片 4：目标品牌可以对应的产品元素 */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg backdrop-blur">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-emerald-300">4. 目标品牌可以对应的产品元素</h3>
        </div>
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
          {matchedElements || '已精准匹配目标品牌设施与产品服务元素。'}
        </div>
      </div>

      {/* 卡片 5：最终核查修改后的携程笔记成品 */}
      <div className="bg-slate-800/70 border border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-700/60 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">5. 最终核查修改后的携程笔记成品</h3>
              <p className="text-[11px] text-cyan-400/90">已完成联网设施/交通/活动事实校验</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white flex items-center space-x-1.5 border border-slate-600 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? '已复制成功' : '一键复制文章'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-xs font-medium text-cyan-300 flex items-center space-x-1.5 border border-cyan-800/60 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出 Markdown</span>
            </button>
          </div>
        </div>

        {/* 事实核查提示框 */}
        {verificationNotes && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-start space-x-2 text-xs text-cyan-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">事实核查日志：</span>
              <span>{verificationNotes}</span>
            </div>
          </div>
        )}

        {/* 成品内容区：层次分明的排版卡片 */}
        <div className="bg-slate-950 rounded-xl p-5 border border-slate-800/90 select-text">
          {renderFormattedArticle(finalArticle)}
        </div>
      </div>
    </div>
  );
}
