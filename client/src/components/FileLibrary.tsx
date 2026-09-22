import { BookOpen, Download, Eye, FolderOpen, Search, Trash2 } from 'lucide-react';

export function FileLibrary({ files }: { files: Array<{ id: number; name: string; type: string; size: string; subject: string; progress: string; status: string; pages?: number; lastPracticed: string }> }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Library</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Study materials</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 md:w-56" placeholder="Search materials" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => (
          <div key={file.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                {file.status}
              </span>
            </div>

            <h3 className="text-base font-semibold text-white">{file.name}</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Type: {file.type}</p>
              <p>Size: {file.size}</p>
              <p>Subject: {file.subject}</p>
              <p>Pages: {file.pages ?? 18}</p>
              <p>Last practiced: {file.lastPracticed}</p>
            </div>

            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-cyan-500" style={{ width: file.progress }} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500">Practice</button>
              <button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500">Quiz</button>
              <button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500">Open</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
