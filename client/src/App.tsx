import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, LogOut, Sparkles, UploadCloud, UserRound } from 'lucide-react';
import { UploadPanel } from './components/UploadPanel';
import { FileLibrary } from './components/FileLibrary';
import { PracticeGenerator } from './components/PracticeGenerator';
import { apiRequest, getAuthToken, setAuthToken, uploadFiles } from './lib/api';
import type { PracticeQuestion, PracticeSummary, StudyMaterial } from './types';

type User = {
  id: string;
  name: string;
  email: string;
};

const emptySummary: PracticeSummary = {
  title: 'Focus on weak topics',
  subtitle: 'Questions generated from your uploaded materials',
  difficulty: 'Mixed',
  questions: 10,
};

function App() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceSummary, setPracticeSummary] = useState<PracticeSummary>(emptySummary);

  const fetchFiles = async () => {
    try {
      const data = await apiRequest<{ files: StudyMaterial[] }>('/files');
      setMaterials(data.files);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMe = async () => {
    try {
      const data = await apiRequest<{ user: User }>('/me');
      setUser(data.user);
      await fetchFiles();
    } catch (err) {
      console.error(err);
      setAuthToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      void fetchMe();
    }
  }, []);

  const filteredFiles = useMemo(() => {
    return materials.filter((file) => {
      const matchesSearch = !search || file.fileName.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || file.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [materials, search, subjectFilter]);

  const stats = useMemo(() => {
    const readyFiles = materials.filter((file) => file.processingStatus === 'ready').length;
    const subjectCount = new Set(materials.map((file) => file.subject)).size;
    const weakTopics = materials.filter((file) => file.processingStatus !== 'ready').length || 3;

    return {
      files: materials.length,
      readyFiles,
      subjects: subjectCount,
      weakTopics,
      accuracy: 82,
    };
  }, [materials]);

  const handleAuth = async () => {
    setBusy(true);
    setError(null);

    try {
      const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/login';
      const payload = authMode === 'signup'
        ? { name: authForm.name, email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password };

      const data = await apiRequest<{ token: string; user: User }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setAuthToken(data.token);
      setUser(data.user);
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    setError(null);

    try {
      await uploadFiles(files);
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleFile = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await apiRequest(`/files/${id}`, { method: 'DELETE' });
      setSelectedIds((current) => current.filter((item) => item !== id));
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete file.');
    }
  };

  const handleGeneratePractice = async () => {
    if (!selectedIds.length) {
      setError('Select at least one study material before generating practice.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const data = await apiRequest<{ summary: PracticeSummary; questions: PracticeQuestion[] }>('/practice/generate', {
        method: 'POST',
        body: JSON.stringify({
          fileIds: selectedIds,
          mode: 'weak-topic',
          questionCount: 10,
          difficulty: 'mixed',
        }),
      });

      setPracticeQuestions(data.questions);
      setPracticeSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Practice generation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setMaterials([]);
    setPracticeQuestions([]);
    setSelectedIds([]);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-50">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">LearnPath AI</p>
              <h1 className="mt-3 text-3xl font-bold text-white">Welcome back</h1>
            </div>
            <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-400">
              <BrainCircuit className="h-6 w-6" />
            </div>
          </div>

          <div className="mb-4 flex rounded-xl border border-slate-700 bg-slate-950/60 p-1">
            <button
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${authMode === 'signup' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
              onClick={() => setAuthMode('signup')}
            >
              Sign up
            </button>
          </div>

          <div className="space-y-4">
            {authMode === 'signup' && (
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">Full name</span>
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-500"
                  placeholder="Jane Learner"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Email</span>
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
                placeholder="student@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Password</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleAuth()}
              className="mt-2 w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-400">LearnPath AI</p>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Adaptive study workspace</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
              <UserRound className="h-4 w-4 text-cyan-400" />
              {user.name}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="space-y-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="rounded-xl bg-slate-800 p-2 text-cyan-400">📚</div>
                <span className="text-xs font-medium text-emerald-400">+3 this week</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.files}</p>
              <p className="mt-2 text-sm text-slate-400">Study materials</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="rounded-xl bg-slate-800 p-2 text-cyan-400">✅</div>
                <span className="text-xs font-medium text-emerald-400">Ready</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.readyFiles}</p>
              <p className="mt-2 text-sm text-slate-400">Ready for practice</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="rounded-xl bg-slate-800 p-2 text-cyan-400">🎯</div>
                <span className="text-xs font-medium text-amber-400">Review</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.weakTopics}</p>
              <p className="mt-2 text-sm text-slate-400">Weak topics</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="rounded-xl bg-slate-800 p-2 text-cyan-400">📈</div>
                <span className="text-xs font-medium text-emerald-400">+7%</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.accuracy}%</p>
              <p className="mt-2 text-sm text-slate-400">Average accuracy</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <UploadPanel onUpload={handleUpload} isBusy={busy} />

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-400">Study status</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Processing pipeline</h2>
                </div>
              </div>

              {materials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-sm text-slate-400">
                  Upload study files to start the material processing workflow.
                </div>
              ) : (
                <div className="space-y-4">
                  {materials.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="rounded-lg bg-slate-800 p-2 text-cyan-400">
                            <UploadCloud className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{item.fileName}</p>
                            <p className="text-xs text-slate-400">{item.subject} • {item.fileType}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.processingStatus === 'ready' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                          {item.processingStatus}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-800">
                        <div className="h-2 rounded-full bg-cyan-500" style={{ width: item.processingStatus === 'ready' ? '100%' : '62%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            <FileLibrary
              files={filteredFiles}
              selectedIds={selectedIds}
              onToggleFile={handleToggleFile}
              search={search}
              onSearchChange={setSearch}
              onDeleteFile={handleDeleteFile}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={setSubjectFilter}
            />

            <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</p>
                  <h3 className="text-xl font-semibold text-white">Practice</h3>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-4 ring-1 ring-cyan-500/20">
                <p className="text-sm text-slate-300">{stats.weakTopics} topics need review</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.accuracy}%</p>
                <p className="mt-1 text-sm text-slate-300">Average accuracy this week</p>
              </div>

              <div className="space-y-2">
                <button type="button" onClick={() => void handleGeneratePractice()} className="flex w-full items-center justify-between rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-3 py-2.5 text-left text-sm text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/15">
                  <span>Generate practice from selected</span>
                  <span>→</span>
                </button>
                <button type="button" className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-cyan-500 hover:text-white">
                  <span>Review weak topics</span>
                  <span>→</span>
                </button>
              </div>
            </aside>
          </section>

          <PracticeGenerator
            questions={practiceQuestions}
            summary={practiceSummary}
            onGenerate={handleGeneratePractice}
            isBusy={busy}
          />

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
