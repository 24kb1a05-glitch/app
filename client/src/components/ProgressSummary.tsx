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

type ProgressResponse = { progress?: ProgressItem[] };

type FileResponse = { files?: Array<{ id: string; name: string; status: string }> };

export function ProgressSummary() {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [progressResponse, filesResponse] = await Promise.all([
          fetch(`${API_URL}/api/progress`),
          fetch(`${API_URL}/api/files`),
        ]);

        if (!progressResponse.ok || !filesResponse.ok) {
          throw new Error('Unable to load progress summary.');
        }

        const progressPayload = (await progressResponse.json()) as ProgressResponse;
        const filesPayload = (await filesResponse.json()) as FileResponse;
        setProgress(progressPayload.progress ?? []);
        setFileCount(filesPayload.files?.length ?? 0);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load progress summary.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSummary();
  }, []);

  const totalAnswered = progress.reduce((sum, item) => sum + item.totalAnswered, 0);
  const totalCorrect = progress.reduce((sum, item) => sum + item.totalCorrect, 0);
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const averageMastery = progress.length
    ? Math.round((progress.reduce((sum, item) => sum + item.mastery, 0) / progress.length) * 100)
    : 0;

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
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center gap-2 text-slate-400"><BarChart3 className="h-4 w-4 text-cyan-400" /><span className="text-sm">Files</span></div><p className="mt-2 text-2xl font-bold text-white">{isLoading ? '—' : fileCount}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center gap-2 text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-400" /><span className="text-sm">Answered</span></div><p className="mt-2 text-2xl font-bold text-white">{isLoading ? '—' : totalAnswered}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center gap-2 text-slate-400"><Target className="h-4 w-4 text-violet-400" /><span className="text-sm">Accuracy</span></div><p className="mt-2 text-2xl font-bold text-white">{isLoading ? '—' : `${accuracy}%`}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center gap-2 text-slate-400"><TrendingUp className="h-4 w-4 text-cyan-400" /><span className="text-sm">Avg. mastery</span></div><p className="mt-2 text-2xl font-bold text-white">{isLoading ? '—' : `${averageMastery}%`}</p></div>
      </div>

      <div className="mt-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">By topic</h3>
        {isLoading ? <p className="text-sm text-slate-500">Loading progress…</p> : progress.length ? <div className="space-y-3">{progress.map((item) => <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-3"><span className="font-medium text-white">{item.topic}</span><span className="text-sm text-cyan-300">{Math.round(item.mastery * 100)}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.round(item.mastery * 100)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{item.totalCorrect} correct of {item.totalAnswered} answered</p></div>)}</div> : <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">Answer practice questions to see your progress here.</p>}
      </div>
    </section>
  );
}
