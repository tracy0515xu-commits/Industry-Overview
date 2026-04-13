import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, Sparkles, Copy, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | null;
  isLoading: boolean;
  onFollowUp: (question: string) => void;
}

export function DeepDiveModal({ isOpen, onClose, title, content, isLoading, onFollowUp }: DeepDiveModalProps) {
  const [question, setQuestion] = useState("");

  const copyContent = () => {
    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  const handleSend = () => {
    if (question.trim()) {
      onFollowUp(question);
      setQuestion("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{title} - 研究追问</h3>
                  <p className="text-xs text-slate-500">基于当前模块进行深度拆解或针对性追问</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              {content ? (
                <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
                  <ReactMarkdown>{content}</ReactMarkdown>
                  {isLoading && (
                    <div className="mt-8 flex items-center gap-3 text-indigo-600 font-medium animate-pulse">
                      <Loader2 className="animate-spin" size={20} />
                      正在思考并生成回答...
                    </div>
                  )}
                </div>
              ) : isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Loader2 className="animate-spin" size={40} />
                  <p className="text-sm font-medium animate-pulse">正在深度分析中，请稍候...</p>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  加载失败，请重试。
                </div>
              )}
            </div>

            {/* Follow-up Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="针对此模块输入您的追问问题..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!question.trim() || isLoading}
                  className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={copyContent}
                disabled={!content}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl border border-slate-200 transition-all disabled:opacity-50"
              >
                <Copy size={16} />
                复制全文
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
              >
                完成阅读
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
