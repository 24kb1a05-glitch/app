import { UploadCloud, X, CheckCircle2, FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

const sampleFiles = [
  'Mathematics.pdf',
  'Physics_Notes.pdf',
  'Biology.pptx',
  'DBMS_Unit_1.pdf',
  'LectureNotes.docx',
];

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">My study materials</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Upload files</h2>
        </div>
        <button className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-cyan-500">
          Clear completed
        </button>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 p-6 text-center transition hover:border-cyan-500">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
          <UploadCloud className="h-8 w-8" />
        </div>
        <p className="mt-4 text-lg font-medium text-white">Drag & drop your files here</p>
        <p className="mt-2 text-sm text-slate-400">PDF, DOCX, PPTX, TXT, CSV, JPG, PNG</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Choose Files
          </button>
          <button type="button" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500">
            Upload All
          </button>
        </div>
        <input ref={inputRef} type="file" className="hidden" multiple onChange={handleSelect} />
      </div>

      <div className="mt-5 space-y-3">
        {(files.length ? files : sampleFiles.map((file) => ({ name: file } as File))).map((file, index) => (
          <div key={file.name ?? `sample-${index}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-800 p-2 text-cyan-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-slate-400">{index + 1 === 1 ? 'PDF • 2.4 MB' : 'Ready for processing'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                {index % 2 === 0 ? 'Ready' : 'Queued'}
              </span>
              <button className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-red-500 hover:text-red-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>3 files uploaded and processing</span>
        </div>
        <button className="font-medium text-emerald-300 hover:text-emerald-200">View progress</button>
      </div>
    </div>
  );
}
