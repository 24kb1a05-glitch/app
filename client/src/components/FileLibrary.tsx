import { BookOpen, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type LibraryFile = {
  id: number | string;
  name: string;
  type: string;
  size: string;
  subject: string;
  progress: string;
  status: string;
  pages?: number;
  lastPracticed: string;
};

type ApiFile = {
  id: string;
  name: string;
  subject: string;
  status: string;
  type?: string;
  size?: number;
};

const API_URL = 'http://localhost:4000';

function formatBytes(bytes = 0) {
  if (!bytes) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function mapApiFile(file: ApiFile): LibraryFile {
  return {
    id: file.id,
    name: file.name,
    type: file.type || file.name.split('.').pop()?.toUpperCase() || 'FILE',
    size: formatBytes(file.size),
    subject: file.subject || 'Uncategorized',
    progress: file.status === 'ready' ? '100%' : '0%',
    status: file.status === 'ready' ? 'Ready' : 'Processing',
    pages: 18,
    lastPracticed: 'Not practiced',
  };
}

export function FileLibrary({ files: initialFiles }: { files: LibraryFile[] }) {
  const [files, setFiles] = useState<LibraryFile[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadFiles = async () => {
      try {
        const response = await fetch(`${API_URL}/api/files`);
        if (!response.ok) throw new Error('Unable to load study materials.');

        const payload = (await response.json()) as { files?: ApiFile[] };
        if (isMounted && payload.files) {
          setFiles(payload.files.map(mapApiFile));
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load study materials.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadFiles();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return files;
    return files.filter((file) => `${file.name} ${file.subject} ${file.type}`.toLowerCase().includes(query));
  }, [files, searchTerm]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Library</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Study materials</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 md:w-56"
            placeholder="Search materials"
            aria-label="Search materials"
          />
        </div>
      </div>

      {isLoading ? <p className="mb-4 text-sm text-slate-400">Loading study materials…</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">{error} Showing available materials.</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredFiles.map((file) => (
          <div key={file.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400"><BookOpen className="h-4 w-4" /></div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">{file.status}</span>
            </div>
            <h3 className="text-base font-semibold text-white">{file.name}</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Type: {file.type}</p><p>Size: {file.size}</p><p>Subject: {file.subject}</p><p>Pages: {file.pages ?? 18}</p><p>Last practiced: {file.lastPracticed}</p>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-500" style={{ width: file.progress }} /></div>
            <div className="mt-4 flex flex-wrap gap-2"><button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500">Practice</button><button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500">Quiz</button><button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500">Open</button></div>
          </div>
        ))}
      </div>

      {!isLoading && !filteredFiles.length ? <p className="py-8 text-center text-sm text-slate-400">No study materials found.</p> : null}
    </div>
  );
}
