import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  LayoutGrid, 
  List, 
  Download, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  Sparkles,
  History,
  Info,
  Globe,
  Layers,
  Target,
  Share2,
  FileText,
  FileJson,
  Printer,
  ChevronDown
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { FrameworkCard } from "./components/FrameworkCard";
import { OutlineView } from "./components/OutlineView";
import { DeepDiveModal } from "./components/DeepDiveModal";
import confetti from "canvas-confetti";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface FrameworkModule {
  id: string;
  title: string;
  content: string;
  grip: string;
  suggestedSources?: string[];
}

interface FrameworkData {
  summary: string;
  modules: FrameworkModule[];
}

const PERSPECTIVES = ["一级投资", "二级投资", "整体介绍"];
const REGIONS = ["中国", "全球", "美国", "东南亚", "欧洲"];
const POSITIONS = ["全产业链", "上游", "中游", "下游"];

const EXAMPLES = ["游泳机器人", "RISC-V", "保险资管", "AI 搜索", "低空经济"];

export default function App() {
  const [industry, setIndustry] = useState("");
  const [perspective, setPerspective] = useState("一级投资");
  const [region, setRegion] = useState("中国");
  const [position, setPosition] = useState("全产业链");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<FrameworkData | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "outline">("card");
  const [history, setHistory] = useState<{ name: string; date: string }[]>([]);

  // Deep Dive / Follow-up state
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [deepDiveTitle, setDeepDiveTitle] = useState("");
  const [deepDiveContent, setDeepDiveContent] = useState<string | null>(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);

  // Export menu state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!industry.trim()) return;

    setIsGenerating(true);
    setResult(null);

    const prompt = `
      You are a world-class industry researcher. Your task is to generate a structured industry research framework for: "${industry}".

      ### CURRENT PERSPECTIVE: ${perspective} (CRITICAL)
      You MUST strictly adhere to the following persona and constraints for the "${perspective}" perspective.

      ${perspective === '一级投资' ? `
      ### PERSONA: VC/PE Partner (一级市场投资人)
      - **Focus**: Private startups, early-stage tech, financing rounds (Seed, Series A/B/C), and founder teams.
      - **Mandatory Module**: "初创生态与融资动态". You MUST list 3-5 PRIVATE startups.
      - **STRICT FORBIDDEN**: Do NOT mention ANY public companies, stock tickers (e.g., 000001.SZ), or secondary market metrics (ROE, P/E). If you mention a stock code, you have FAILED.
      - **Tone**: Qualitative, future-oriented, focused on disruptive potential.
      ` : perspective === '二级投资' ? `
      ### PERSONA: Equity Analyst (二级市场分析师)
      - **Focus**: Listed companies, financial reports, market valuation, and earnings quality.
      - **Mandatory Module**: "核心标的与财务指标". You MUST list 3-5 LISTED companies with stock tickers.
      - **Mandatory Data**: Include ROE, P/E, Revenue Growth, and Gross Margin for each target.
      - **STRICT FORBIDDEN**: Do NOT focus on early-stage private startups.
      - **Tone**: Quantitative, data-driven, focused on financial stability and valuation.
      ` : `
      ### PERSONA: Industry Consultant (整体介绍)
      - **Focus**: General industry structure, macro trends, and overall landscape.
      `}

      ### MODULES TO GENERATE:
      1. **行业定义与边界**: Define the scope of ${industry}.
      2. **产业链结构**: Breakdown of ${position}.
      3. ${perspective === '一级投资' ? '初创生态与融资动态' : perspective === '二级投资' ? '核心标的与财务指标' : '主要参与者'}: ${perspective === '一级投资' ? 'Focus ONLY on private startups and their tech/funding.' : 'Focus ONLY on listed companies and their financial metrics.'}
      4. **核心矛盾与瓶颈**: What is stopping growth?
      5. **竞争格局**: Market concentration and moats.
      6. **风险点**: Risks specific to ${perspective}.
      7. **关键数据**: Market size, CAGR, and ${perspective === '二级投资' ? 'financial ratios' : 'funding trends'}.

      ### OUTPUT FORMAT (JSON):
      {
        "summary": "Professional overview including market size and CAGR.",
        "modules": [
          { "id": "...", "title": "...", "content": "...", "grip": "...", "suggestedSources": [...] }
        ]
      }

      Language: Professional Chinese.
      Search: Use Google Search to find REAL, CURRENT companies and data.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        config: {
          responseMimeType: "application/json"
        }
      } as any);

      const text = response.text;
      if (!text) throw new Error("Empty response");

      const jsonData = JSON.parse(text);
      setResult(jsonData);
      setHistory(prev => [{ name: industry, date: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#818cf8', '#c7d2fe']
      });
    } catch (error) {
      console.error("Generation error:", error);
      alert("生成失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeepDive = async (moduleId: string, customQuestion?: string) => {
    const module = result?.modules.find(m => m.id === moduleId);
    if (!module) return;

    setActiveModuleId(moduleId);
    setDeepDiveTitle(module.title);
    if (!customQuestion) {
      setDeepDiveContent(null);
    }
    setIsDeepDiveLoading(true);
    setIsDeepDiveOpen(true);

    const prompt = customQuestion 
      ? `
        You are a world-class industry expert. 
        The user is researching: "${industry}".
        They have a specific follow-up question regarding the section "${module.title}":
        
        Question: "${customQuestion}"

        Context from the previous summary:
        "${module.content}"

        Perspective: ${perspective}
        Region: ${region}

        Please provide a professional, detailed answer to this specific question. 
        Use Google Search to find real-time data or recent news if relevant.
        Include source links where possible.
        Format in Markdown.
      `
      : `
        You are a world-class industry expert. 
        The user is researching: "${industry}".
        They want a "Deep Dive" into the specific section: "${module.title}".
        
        Current summary of this section:
        "${module.content}"

        Context:
        - Perspective: ${perspective}
        - Region: ${region}

        Please provide a highly detailed, granular analysis for this specific section. 
        1. Break it down into 3-5 sub-points.
        2. Provide specific real-world examples or case studies.
        3. Suggest 5 critical, high-level questions a professional researcher should ask in an interview or due diligence.
        4. If applicable, provide specific data ranges or benchmarks.
        5. Use Google Search to find real-time data or recent news and include source links.

        Format the output in clean, professional Markdown with clear headings.
        Language: Professional Chinese.
      `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      } as any);

      if (!response.text) throw new Error("Deep dive failed");
      
      const responseText = response.text;
      if (customQuestion) {
        setDeepDiveContent(prev => (prev ? `${prev}\n\n---\n\n**追问: ${customQuestion}**\n\n${responseText}` : responseText));
      } else {
        setDeepDiveContent(responseText);
      }
    } catch (error) {
      console.error(error);
      setDeepDiveContent("深度分析生成失败，请稍后重试。原因可能是网络连接或模型响应异常。");
    } finally {
      setIsDeepDiveLoading(false);
    }
  };

  const handleRegenerateModule = (moduleId: string) => {
    alert(`正在重新生成模块 [${moduleId}]... (MVP功能演示)`);
  };

  const handleShare = () => {
    if (!result) return;
    const text = `【${industry} 行业研究框架】\n摘要：${result.summary}\n\n查看完整框架：${window.location.href}`;
    navigator.clipboard.writeText(text);
    alert("研究框架摘要已复制到剪贴板，快去分享吧！");
  };

  const exportMarkdown = () => {
    if (!result) return;
    let md = `# ${industry} 行业研究框架\n\n`;
    md += `> ${result.summary}\n\n`;
    result.modules.forEach((m, idx) => {
      md += `## ${idx + 1}. ${m.title}\n\n`;
      md += `${m.content}\n\n`;
      md += `**研究抓手：** ${m.grip}\n\n`;
      md += `---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    downloadBlob(blob, `${industry}_研究框架.md`);
  };

  const exportWord = () => {
    if (!result) return;
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${industry} 研究框架</title></head>
      <body>
        <h1>${industry} 行业研究框架</h1>
        <p><i>${result.summary}</i></p>
        ${result.modules.map((m, idx) => `
          <h2>${idx + 1}. ${m.title}</h2>
          <div>${m.content.replace(/\n/g, '<br>')}</div>
          <p><b>研究抓手：</b> ${m.grip}</p>
          <hr>
        `).join('')}
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: "application/msword" });
    downloadBlob(blob, `${industry}_研究框架.doc`);
  };

  const exportPDF = () => {
    window.print();
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans print:bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setResult(null)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              Industry Research <span className="text-indigo-600">Framework</span>
            </span>
          </div>
          
          {result && (
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("card")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                  viewMode === "card" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutGrid size={16} />
                卡片视图
              </button>
              <button
                onClick={() => setViewMode("outline")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                  viewMode === "outline" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <List size={16} />
                大纲视图
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto pt-12"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
                  快速搭建结构化研究框架
                </h1>
                <p className="text-lg text-slate-600">
                  输入一个行业，AI 助你快速拆解核心逻辑，告别从零开始的焦虑。
                </p>
              </div>

              <form onSubmit={handleGenerate} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="输入行业关键词，如：低空经济、合成生物..."
                    className="w-full pl-14 pr-4 py-5 bg-slate-50 border-none rounded-2xl text-xl font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Target size={14} /> 研究视角
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PERSPECTIVES.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPerspective(p)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                            perspective === p ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Globe size={14} /> 地域范围
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {REGIONS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRegion(r)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                            region === r ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Layers size={14} /> 产业链位置
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {POSITIONS.map(pos => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setPosition(pos)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                            position === pos ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200"
                          )}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || !industry.trim()}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      正在构建研究框架...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      开始生成框架
                    </>
                  )}
                </button>
              </form>

              <div className="mt-12">
                <div className="flex items-center gap-2 text-slate-400 mb-4">
                  <History size={16} />
                  <span className="text-sm font-medium">大家都在搜</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex}
                      onClick={() => {
                        setIndustry(ex);
                        // Optional: auto trigger generate
                      }}
                      className="px-4 py-2 bg-slate-200/50 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-medium transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
                <div>
                  <button
                    onClick={() => setResult(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
                  >
                    <ArrowLeft size={16} />
                    返回修改
                  </button>
                  <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                    {industry}
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full uppercase">
                      {perspective}
                    </span>
                  </h2>
                  <p className="text-slate-500 mt-2 max-w-2xl">
                    {result.summary}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Export Dropdown */}
                  <div className="relative" ref={exportMenuRef}>
                    <button 
                      onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <Download size={16} />
                      导出框架
                      <ChevronDown size={14} className={cn("transition-transform", isExportMenuOpen && "rotate-180")} />
                    </button>
                    
                    <AnimatePresence>
                      {isExportMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                        >
                          <button
                            onClick={exportMarkdown}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <FileText size={16} />
                            Markdown (.md)
                          </button>
                          <button
                            onClick={exportWord}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <FileJson size={16} />
                            Word 文档 (.doc)
                          </button>
                          <button
                            onClick={exportPDF}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <Printer size={16} />
                            PDF 打印 / 保存
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
                  >
                    <Share2 size={16} />
                    分享结果
                  </button>
                </div>
              </div>

              {/* Print Header */}
              <div className="hidden print:block mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{industry} 行业研究框架</h1>
                <p className="text-slate-600 italic border-l-4 border-indigo-500 pl-4 py-2">{result.summary}</p>
              </div>

              {viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.modules.map((module, idx) => (
                    <FrameworkCard
                      key={module.id}
                      module={module}
                      onDeepDive={handleDeepDive}
                      onFollowUp={(id) => handleDeepDive(id)}
                      onRegenerate={handleRegenerateModule}
                    />
                  ))}
                  <div className="bg-slate-900 rounded-2xl p-8 flex flex-col justify-center items-center text-center text-white print:hidden">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <Sparkles size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">需要更深度的报告？</h3>
                    <p className="text-slate-400 text-sm mb-6">
                      基于此框架，我们可以为您生成完整的尽调清单或访谈提纲。
                    </p>
                    <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                      生成访谈提纲
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <OutlineView modules={result.modules} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Deep Dive / Follow-up Modal */}
      <DeepDiveModal
        isOpen={isDeepDiveOpen}
        onClose={() => setIsDeepDiveOpen(false)}
        title={deepDiveTitle}
        content={deepDiveContent}
        isLoading={isDeepDiveLoading}
        onFollowUp={(q) => activeModuleId && handleDeepDive(activeModuleId, q)}
      />

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 py-12 bg-white print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            © 2024 Industry Research Framework Generator. Powered by Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
