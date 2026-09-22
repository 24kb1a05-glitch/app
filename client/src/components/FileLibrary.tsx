import { BookOpen, Search, Trash2 } from 'lucide-react';
import type { StudyMaterial } from '../types';

type FileLibraryProps = {
  files: StudyMaterial[];
  selectedIds: string[];
  onToggleFile: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onDeleteFile: (id: string) => void;
  subjectFilter: string;
  onSubjectFilterChange: (value: string) => void;
};

export function FileLibrary({
  files,
  selectedIds,
  onToggleFile,
  search,
  onSearchChange,
  onDeleteFile,
  subjectFilter,
  onSubjectFilterChange,
}: FileLibraryProps) {
  const subjectOptions = ['all', ...new Set(files.map((file) => file.subject))];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Library</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Study materials</h2>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 md:w-56"
              placeholder="Search materials"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(event) => onSubjectFilterChange(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
          >
            {subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All subjects' : option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => (
          <div key={file.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(file.id)}
                  onChange={() => onToggleFile(file.id)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-cyan-500"
                />
                Select
              </label>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${file.processingStatus === 'ready' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                {file.processingStatus}
              </span>
            </div>

            <div className="mb-3 rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
              <BookOpen className="h-5 w-5" />
            </div>

            <h3 className="text-base font-semibold text-white">{file.fileName}</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Type: {file.fileType}</p>
              <p>Size: {(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              <p>Subject: {file.subject}</p>
              <p>Topic: {file.topic}</p>
              <p>Last updated: {new Date(file.uploadDate).toLocaleDateString()}</p>
            </div>

            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-cyan-500" style={{ width: file.processingStatus === 'ready' ? '100%' : '65%' }} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500">Practice</button>
              <button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500">Open</button>
              <button
                type="button"
                onClick={() => onDeleteFile(file.id)}
                className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:border-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
