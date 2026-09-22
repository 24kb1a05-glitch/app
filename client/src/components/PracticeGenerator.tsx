import { BrainCircuit, Clock3, Sparkles } from 'lucide-react';
import type { PracticeQuestion, PracticeSummary } from '../types';

type PracticeGeneratorProps = {
  questions: PracticeQuestion[];
  summary: PracticeSummary;
  onGenerate: () => void;
  isBusy: boolean;
};

export function PracticeGenerator({ questions, summary, onGenerate, isBusy }: PracticeGeneratorProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Practice</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Generate study session</h2>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isBusy}
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? 'Generating...' : 'Start Practice'}
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">
              Select uploaded study files and generate a practice set.
            </div>
          ) : (
            questions.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{item.question}</p>
                  <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                    {item.source}
                  </span>
                </div>
                <p className="text-sm text-slate-400">Answer: {item.answer}</p>
                <p className="mt-2 text-sm text-slate-500">{item.explanation}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/15 p-2 text-violet-300">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">AI insight</p>
            <h3 className="text-xl font-semibold text-white">Learning path</h3>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 p-4 ring-1 ring-violet-500/20">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Session summary</p>
          <h4 className="mt-3 text-xl font-bold text-white">{summary.title}</h4>
          <p className="mt-2 text-sm text-slate-300">{summary.subtitle}</p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="flex items-center gap-2 text-slate-200">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Difficulty
            </span>
            <span className="font-medium text-white">{summary.difficulty}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="flex items-center gap-2 text-slate-200">
              <Clock3 className="h-4 w-4 text-cyan-400" />
              Questions
            </span>
            <span className="font-medium text-white">{summary.questions}</span>
          </div>
        </div>
      </aside>
    </section>
  );
}
