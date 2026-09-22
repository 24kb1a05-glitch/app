import { BarChart3, CheckCircle2, Target, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:4000';

type ProgressItem = {
  id: string;
  topic: string;
  mastery: number;
  totalAnswered: number;
  totalCorrect: number;
  lastUpdated: string;
};

type AnalyticsResponse = {
  summary?: {
    totalFiles: number;
    totalAnswered: number;
    totalCorrect: number;
    accuracy: number;
    averageMastery: number;
  };
  progress?: ProgressItem[];
  recent?: Array<{
    id: string;
    topic: string;
    question: string;
    correct: boolean;
    answeredAt: string;
  }>;
};

export function ProgressSummary() {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [recent, setRecent] = useState<AnalyticsResponse['recent']>([]);
  const [summary, setSummary] = useState({
    totalFiles: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    accuracy: 0,
    averageMastery: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetch(`${API_URL}/api/analytics`);
        if (!response.ok) {
          throw new Error('Unable to load dashboard analytics.');
        }

        const payload = (await response.json()) as AnalyticsResponse;
        setSummary(
          payload.summary ?? {
            totalFiles: 0,
            totalAnswered: 0,
            totalCorrect: 0,
            accuracy: 0,
            averageMastery: 0,
          },
        );
        setProgress(payload.progress ?? []);
        setRecent(payload.recent ?? []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard analytics.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSummary();
  }, []);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Progress</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Your learning summary</h2>
        </div>
        <TrendingUp className="h-6 w-6 text-emerald-400" />
      </div>

      {error ? <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-sm">Files</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '—' : summary.totalFiles}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm">Answered</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '—' : summary.totalAnswered}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Target className="h-4 w-4 text-violet-400" />
            <span className="text-sm">Accuracy</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '—' : `${summary.accuracy}%`}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <span className="text-sm">Avg. mastery</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '—' : `${summary.averageMastery}%`}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">By topic</h3>
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading progress…</p>
          ) : progress.length ? (
            <div className="space-y-3">
              {progress.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{item.topic}</span>
                    <span className="text-sm text-cyan-300">{Math.round(item.mastery * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.round(item.mastery * 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.totalCorrect} correct of {item.totalAnswered} answered
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
              Answer practice questions to see your progress here.
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Recent activity</h3>
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading recent activity…</p>
          ) : recent && recent.length ? (
            <div className="space-y-3">
              {recent.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{item.topic}</span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.correct ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                      {item.correct ? 'Correct' : 'Retry'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.question}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {new Date(item.answeredAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
              No answers recorded yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
