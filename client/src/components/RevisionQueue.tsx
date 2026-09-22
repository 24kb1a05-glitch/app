import { AlertTriangle, ArrowRight } from 'lucide-react';
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

export function RevisionQueue() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const response = await fetch(`${API_URL}/api/recommendations`);
        if (!response.ok) {
          throw new Error('Unable to load recommendations.');
        }

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

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Revision</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Weakest topics</h2>
        </div>
        <AlertTriangle className="h-6 w-6 text-amber-400" />
      </div>

      {error ? <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">{error}</p> : null}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading revision queue…</p>
      ) : recommendations.length ? (
        <div className="space-y-3">
          {recommendations.slice(0, 3).map((item) => (
            <div key={item.topic} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{item.topic}</p>
                  <p className="text-xs text-slate-500">{item.totalCorrect} correct of {item.totalAnswered} answered</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.priority === 'High' ? 'bg-amber-500/15 text-amber-300' : item.priority === 'Medium' ? 'bg-violet-500/15 text-violet-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                  {item.priority}
                </span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-amber-400" style={{ width: `${item.masteryPercent}%` }} />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm text-slate-300">{item.masteryPercent}% mastery</span>
                <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
                  Review <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">{item.nextAction}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
          Complete a few practice sets to receive revision suggestions.
        </p>
      )}
    </section>
  );
}
