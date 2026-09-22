import { AlertTriangle, ArrowRight, BookOpen, CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:4000';

type Recommendation = {
  topic: string;
  mastery: number;
  masteryPercent: number;
  totalAnswered: number;
  totalCorrect: number;
  priority: 'High' | 'Medium' | 'Low';
  nextAction: string;
};

function priorityClasses(priority: Recommendation['priority']) {
  if (priority === 'High') return 'bg-amber-500/15 text-amber-300';
  if (priority === 'Medium') return 'bg-violet-500/15 text-violet-300';
  return 'bg-emerald-500/15 text-emerald-300';
}

export function RevisionQueue() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const response = await fetch(`${API_URL}/api/recommendations`);
        if (!response.ok) throw new Error('Unable to load recommendations.');
        const payload = (await response.json()) as { recommendations?: Recommendation[] };
        setRecommendations(payload.recommendations ?? []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load recommendations.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecommendations();
  }, []);

  const startReview = (topic: Recommendation) => {
    setSelectedTopic(topic);
    window.setTimeout(() => document.getElementById('practice-generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Revision plan</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Focus where it matters</h2>
          <p className="mt-1 text-sm text-slate-400">Targeted reviews based on your saved practice results.</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-300"><AlertTriangle className="h-5 w-5" /></div>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">{error}</p> : null}

      {isLoading ? <p className="text-sm text-slate-500">Loading revision queue…</p> : recommendations.length ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {recommendations.slice(0, 3).map((item) => (
            <article key={item.topic} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate font-medium text-white">{item.topic}</p><p className="mt-1 text-xs text-slate-500">{item.totalCorrect} correct of {item.totalAnswered} answered</p></div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${priorityClasses(item.priority)}`}>{item.priority}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm"><span className="text-slate-300">Mastery</span><span className="font-semibold text-cyan-300">{item.masteryPercent}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-slate-800"><div className={`h-2 rounded-full ${item.priority === 'High' ? 'bg-amber-400' : 'bg-cyan-500'}`} style={{ width: `${item.masteryPercent}%` }} /></div>
              <p className="mt-3 min-h-10 text-xs leading-5 text-slate-500">{item.nextAction}</p>
              <button type="button" onClick={() => startReview(item)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/50 px-3 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/10"><BookOpen className="h-4 w-4" />Review this topic<ArrowRight className="h-4 w-4" /></button>
            </article>
          ))}
        </div>
      ) : <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">Complete a few practice questions to receive revision suggestions.</p>}

      {selectedTopic ? (
        <div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Selected revision</p><h3 className="mt-1 text-lg font-semibold text-white">{selectedTopic.topic}</h3><p className="mt-1 text-sm text-slate-400">The practice generator is ready below. Choose this topic’s source file and generate a short retry set.</p></div><button type="button" onClick={() => setSelectedTopic(null)} aria-label="Close selected revision" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button></div><div className="mt-3 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />Previous mastery: {selectedTopic.masteryPercent}%</div></div>
      ) : null}
    </section>
  );
}
