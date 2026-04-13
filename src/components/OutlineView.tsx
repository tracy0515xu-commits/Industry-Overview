import ReactMarkdown from "react-markdown";

interface FrameworkModule {
  id: string;
  title: string;
  content: string;
  grip: string;
}

interface OutlineViewProps {
  modules: FrameworkModule[];
}

export function OutlineView({ modules }: OutlineViewProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
      <div className="space-y-12">
        {modules.map((module) => (
          <section key={module.id} className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 text-sm font-mono">
                {modules.indexOf(module) + 1}
              </span>
              {module.title}
            </h2>
            <div className="pl-11 space-y-6">
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                <ReactMarkdown>{module.content}</ReactMarkdown>
              </div>
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                <h4 className="text-sm font-bold text-indigo-900 mb-1 uppercase tracking-wider">研究抓手</h4>
                <p className="text-slate-700">{module.grip}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
