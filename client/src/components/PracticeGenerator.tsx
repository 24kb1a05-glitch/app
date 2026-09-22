import { BrainCircuit, Clock3, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

type PracticeQuestion = {
  id: number;
  question: string;
  answer: string;
  source: string;
  explanation?: string;
};

type PracticeSummary = {
  title: string;
  subtitle: string;
  difficulty: string;
  questions: number;
};

type PracticeFile = {
  id: string;
  name: string;
  status: string;
};

const API_URL = 'http://localhost:4000';

export function PracticeGenerator({
  questions: initialQuestions,
  summary: initialSummary,
}: {
  questions: PracticeQuestion[];
  summary: PracticeSummary;
}) {
  const [files, setFiles] = useState<PracticeFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [questions, setQuestions] = useState(initialQuestions);
  const [summary, setSummary] = useState(initialSummary);
  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('mixed');
  const [mode, setMode] = useState('weak-topic');
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await fetch(`${API_URL}/api/files`);
        if (!response.ok) throw new Error('Unable to load uploaded files.');
        const payload = (await response.json()) as { files?: PracticeFile[] };
        const readyFiles = (payload.files ?? []).filter((file) => file.status === 'ready');
        setFiles(readyFiles);
        if (readyFiles.length) setSelectedFileId(readyFiles[0].id);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load uploaded files.');
      } finally {
        setIsLoadingFiles(false);
      }
    };

    void loadFiles();
  }, []);

  const handleGenerate = async () => {
    if (!selectedFileId) {
      setError('Upload a text-readable file before generating practice.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/practice/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selectedFileId, mode, questionCount: Number(questionCount), difficulty }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        fileName?: string;
        questions?: PracticeQuestion[];
      };

      if (!response.ok) throw new Error(payload.message || 'Unable to generate practice.');

      const generatedQuestions = payload.questions ?? [];
      setQuestions(generatedQuestions);
      setSummary({
        title: 'Practice from your material',
        subtitle: payload.fileName ? `Questions generated from ${payload.fileName}` : 'Questions generated from your uploaded material',
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        questions: generatedQuestions.length,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to generate practice.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Practice</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Generate study session</h2>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || isLoadingFiles}
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? 'Generating…' : 'Generate Practice'}
          </button>
        </div>

        <label className="mb-4 block rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Study material</span>
          <select
            value={selectedFileId}
            onChange={(event) => setSelectedFileId(event.target.value)}
            className="w-full bg-transparent text-sm text-white outline-none"
            disabled={isLoadingFiles}
          >
            <option value="">{isLoadingFiles ? 'Loading files…' : files.length ? 'Choose a file' : 'No ready files available'}</option>
            {files.map((file) => <option key={file.id} value={file.id}>{file.name}</option>)}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Mode</span>
            <select value={mode} onChange={(event) => setMode(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
              <option value="weak-topic">Weak Topic Practice</option>
              <option value="exam">Exam Practice</option>
              <option value="quick">Quick Practice</option>
            </select>
          </label>

          <label className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Question count</span>
            <select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
              <option value="15">15 Questions</option>
              <option value="20">20 Questions</option>
            </select>
          </label>

          <label className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Difficulty</span>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>

        {error ? <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}

        <div className="mt-5 space-y-4">
          {questions.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-medium text-white">{item.question}</p>
                <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">{item.source}</span>
              </div>
              <p className="text-sm text-slate-400">Answer: {item.answer}</p>
              {item.explanation ? <p className="mt-2 text-xs text-slate-500">{item.explanation}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/15 p-2 text-violet-300"><BrainCircuit className="h-5 w-5" /></div>
          <div><p className="text-xs uppercase tracking-[0.18em] text-slate-400">AI insight</p><h3 className="text-xl font-semibold text-white">Learning path</h3></div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 p-4 ring-1 ring-violet-500/20">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Session summary</p>
          <h4 className="mt-3 text-xl font-bold text-white">{summary.title}</h4>
          <p className="mt-2 text-sm text-slate-300">{summary.subtitle}</p>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3"><span className="flex items-center gap-2 text-slate-200"><Sparkles className="h-4 w-4 text-cyan-400" />Difficulty</span><span className="font-medium text-white">{summary.difficulty}</span></div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3"><span className="flex items-center gap-2 text-slate-200"><Clock3 className="h-4 w-4 text-cyan-400" />Questions</span><span className="font-medium text-white">{summary.questions}</span></div>
        </div>
      </aside>
    </section>
  );
}
