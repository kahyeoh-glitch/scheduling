import { useRef, useState } from "react";

export interface CsvSummary {
  fileName: string;
  rowCount: number;
  unmatched: { name: string; quantity: number }[];
}

export function UploadPanel({
  onFile,
  summary,
}: {
  onFile: (file: File) => void;
  summary: CsvSummary | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  return (
    <section className="panel upload-panel">
      <div
        className={`upload-drop${dragActive ? " upload-drop--active" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
      >
        <p className="upload-drop__title">Upload Papercut CSV</p>
        <p className="upload-drop__hint">Drag &amp; drop, or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {summary && (
        <div className="upload-summary">
          <span>
            <strong>{summary.fileName}</strong> · {summary.rowCount} rows parsed
          </span>
          {summary.unmatched.length > 0 && (
            <span className="upload-summary__muted">
              {summary.unmatched.length} unmatched line item{summary.unmatched.length === 1 ? "" : "s"} ignored
            </span>
          )}
        </div>
      )}
    </section>
  );
}
