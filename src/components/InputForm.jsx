import React, { useState } from 'react';
import { Search, Building, FileText, Settings, Play, RefreshCw, Zap } from 'lucide-react';

export default function InputForm({ onSubmit, isLoading }) {
  const [longTailKeyword, setLongTailKeyword] = useState('');
  const [targetBrandInfo, setTargetBrandInfo] = useState('');
  const [topicDirection, setTopicDirection] = useState('');
  
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [customEndpointId, setCustomEndpointId] = useState('');

  const handlePreset = () => {
    setLongTailKeyword('千岛湖适合亲子度假、遛娃省心的奢华酒店推荐');
    setTargetBrandInfo('千岛湖洲际度假酒店，位于羡山半岛，拥有独栋湖景客房、2000平米大型室内儿童乐园、户外恒温无边际湖景泳池、私家游艇码头皮划艇、小动物喂养区以及双人下午茶体验。');
    setTopicDirection('主打暑期带娃省心度假，强调一站式吃住玩，突出无边际泳池打卡和儿童乐园设施，氛围要温馨、种草感强。');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!longTailKeyword.trim() || !targetBrandInfo.trim() || !topicDirection.trim()) {
      alert('请完整填写三个输入框要素！');
      return;
    }
    onSubmit({
      longTailKeyword,
      targetBrandInfo,
      topicDirection,
      customApiKey,
      customEndpointId
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-100 flex items-center">
          <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>
          生成条件输入
        </h2>
        <button
          type="button"
          onClick={handlePreset}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1 transition"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>填入示例Demo数据</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* 输入 1：长尾关键词 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center">
            <Search className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            1. 长尾关键词 <span className="text-rose-400 ml-0.5">*</span>
          </label>
          <input
            type="text"
            required
            value={longTailKeyword}
            onChange={(e) => setLongTailKeyword(e.target.value)}
            placeholder="例如：千岛湖适合亲子度假、遛娃省心的奢华酒店推荐"
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
          />
        </div>

        {/* 输入 2：目标品牌的基本信息和产品元素 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center">
            <Building className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            2. 目标品牌的基本信息和产品元素 <span className="text-rose-400 ml-0.5">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={targetBrandInfo}
            onChange={(e) => setTargetBrandInfo(e.target.value)}
            placeholder="详细列出您品牌的真实设施、房型、服务、地理位置等元素（只能填写真实拥有的元素）"
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition resize-y"
          />
        </div>

        {/* 输入 3：希望文章采用的主题方向或内容备注 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            3. 希望文章采用的主题方向或内容备注 <span className="text-rose-400 ml-0.5">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={topicDirection}
            onChange={(e) => setTopicDirection(e.target.value)}
            placeholder="例如：强调带娃省心、夏季避暑、无边际泳池拍照打卡、种草感强"
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition resize-y"
          />
        </div>
      </div>

      {/* 高级 API 设置折叠面板 */}
      <div className="mt-5 pt-4 border-t border-slate-700/50">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 transition"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{showSettings ? '隐藏高级 API 配置' : '展开高级 API 配置 (若环境变量已配置可不填)'}</span>
        </button>

        {showSettings && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/80 space-y-3 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                火山方舟 API Key (可选，优先使用)
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="例如：d6f8xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                火山方舟 Endpoint ID (可选，如 ep-20250101xxxxxx-xxxxx)
              </label>
              <input
                type="text"
                value={customEndpointId}
                onChange={(e) => setCustomEndpointId(e.target.value)}
                placeholder="例如：ep-20250115xxxxxx-xxxxx (默认使用 doubao-pro-32k)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-6 py-3.5 px-6 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <span>豆包联网检索与智能生成中...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>开始生成 (依次执行三步流程)</span>
          </>
        )}
      </button>
    </form>
  );
}
