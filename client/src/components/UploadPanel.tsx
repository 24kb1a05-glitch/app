import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { FileText, X } from 'lucide-react';

type UploadPanelProps = {
  onUpload: (files: File[]) => Promise<void> | void;
  isBusy: boolean;
};

export function UploadPanel({ onUpload, isBusy }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;
    await onUpload(files);
    setFiles([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">My study materials</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Upload files</h2>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 p-6 text-center transition hover:border-cyan-500">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
          <FileText className="h-8 w-8" />
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
          <button
            type="button"
            disabled={isBusy || !files.length}
            onClick={() => void handleUpload()}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
        <input ref={inputRef} type="file" className="hidden" multiple onChange={handleSelect} />
      </div>

      <div className="mt-5 space-y-3">
        {files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-400">
            No files selected yet.
          </div>
        ) : (
          files.map((file) => (
            <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-800 p-2 text-cyan-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-400">{file.type || 'file'} • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((item) => `${item.name}-${item.size}` !== `${file.name}-${file.size}`))}
                className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-red-500 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
