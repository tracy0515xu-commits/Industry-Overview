import { cn } from "@/src/lib/utils";
import { LucideIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import { Copy, Maximize2, RefreshCw, Sparkles } from "lucide-react";

interface FrameworkModule {
  id: string;
  title: string;
  content: string;
  grip: string;
  suggestedSources?: string[];
}

interface FrameworkCardProps {
  module: FrameworkModule;
  onDeepDive: (id: string) => void;
  onFollowUp: (id: string) => void;
  onRegenerate: (id: string) => void;
}

export function FrameworkCard({ module, onDeepDive, onFollowUp, onRegenerate }: FrameworkCardProps) {
  const copyToClipboard = () => {
    const text = `${module.title}\n\n${module.content}\n\n研究抓手：${module.grip}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
          {module.title}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={copyToClipboard}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="复制内容"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => onRegenerate(module.id)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="重新生成"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex-grow prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed mb-6">
        <ReactMarkdown>{module.content}</ReactMarkdown>
      </div>

      {module.suggestedSources && module.suggestedSources.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">建议资料来源</div>
          <div className="flex flex-wrap gap-1.5">
            {module.suggestedSources.map(source => (
              <span key={source} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
                {source}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="bg-indigo-50/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1">
            <Sparkles size={14} />
            研究抓手
          </div>
          <p className="text-sm text-slate-700 leading-snug">
            {module.grip}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDeepDive(module.id)}
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all"
          >
            <Maximize2 size={14} />
            深度拆解
          </button>
          <button
            onClick={() => onFollowUp(module.id)}
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm shadow-indigo-100"
          >
            <Sparkles size={14} />
            针对追问
          </button>
        </div>
      </div>
    </motion.div>
  );
}
