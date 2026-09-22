import { BarChart3, BookOpen, BrainCircuit, Check, FileText, Folder, Sparkles, UploadCloud, ChevronRight, Target, Clock3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { UploadPanel } from './components/UploadPanel';
import { FileLibrary } from './components/FileLibrary';
import { PracticeGenerator } from './components/PracticeGenerator';
import { ProgressSummary } from './components/ProgressSummary';
import { RevisionQueue } from './components/RevisionQueue';
import { studyFiles, stats, quickActions, recentMaterials, practiceSummary, generatedQuestions } from './data/mockData';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-400">LearnPath AI</p>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Adaptive learning workspace</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-white">
              View Dashboard
            </button>
            <button className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Upload Files
            </button>
          </div>
        </header>

        <main className="space-y-8">
          <ProgressSummary />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-xl bg-slate-800 p-2 text-cyan-400">{stat.icon}</div>
                  <span className="text-xs font-medium text-emerald-400">{stat.trend}</span>
                </div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <UploadPanel />

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-400">Study status</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Processing pipeline</h2>
                </div>
                <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-cyan-500">
                  Retry failed
                </button>
              </div>

              <div className="space-y-4">
                {recentMaterials.map((item, index) => (
                  <div key={item.name} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="rounded-lg bg-slate-800 p-2 text-cyan-400">
                          {index % 2 === 0 ? <FileText className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.subject} • {item.type}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.status === 'Ready' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-800">
                      <div className="h-2 rounded-full bg-cyan-500" style={{ width: item.progress }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            <FileLibrary files={studyFiles} />

            <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-400">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</p>
                  <h3 className="text-xl font-semibold text-white">Practice</h3>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-4 ring-1 ring-cyan-500/20">
                <p className="text-sm text-slate-300">3 topics need review</p>
                <p className="mt-2 text-3xl font-bold text-white">82%</p>
                <p className="mt-1 text-sm text-slate-300">Average accuracy this week</p>
              </div>

              <div className="space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-cyan-500 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      {action.icon}
                      {action.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </aside>
          </section>

          <RevisionQueue />
          <PracticeGenerator questions={generatedQuestions} summary={practiceSummary} />
        </main>
      </div>
    </div>
  );
}

export default App;
