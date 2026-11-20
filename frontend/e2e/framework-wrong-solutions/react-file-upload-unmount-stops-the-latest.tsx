import React, { useEffect, useRef, useState } from 'react';
import './App.css';

/** The largest receipt the upload accepts, in bytes (2 MB). */
export const MAX_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];
/** Time between two progress reports of the fake upload, in ms. */
export const PROGRESS_STEP_MS = 150;

export interface UploadOptions {
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}

const failedOnce = new Set<string>();
let uploadsStarted = 0;

/**
 * Given: a fake receipt upload. It reports progress four times, 25% at a time, PROGRESS_STEP_MS apart, then resolves
 * with the receipt's id. An upload of a name containing "flaky" fails instead of reporting 75%, the first time an
 * upload of that name gets that far in this page; later ones succeed. Aborting the signal stops the reports and
 * rejects with an AbortError.
 */
export function uploadReceipt(file: File, { onProgress, signal }: UploadOptions): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    uploadsStarted += 1;
    const id = `receipt-${uploadsStarted}`;
    let percent = 0;
    let timer = 0;
    const abort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('The upload was cancelled.', 'AbortError'));
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    const tick = () => {
      percent += 25;
      if (percent === 75 && file.name.includes('flaky') && !failedOnce.has(file.name)) {
        failedOnce.add(file.name);
        signal.removeEventListener('abort', abort);
        reject(new Error('The server rejected the upload.'));
        return;
      }
      onProgress(percent);
      if (percent < 100) {
        timer = window.setTimeout(tick, PROGRESS_STEP_MS);
        return;
      }
      signal.removeEventListener('abort', abort);
      resolve({ id });
    };
    timer = window.setTimeout(tick, PROGRESS_STEP_MS);
  });
}

/**
 * Given: counts preview URLs, so the checks can read them. It wraps URL.createObjectURL and URL.revokeObjectURL and
 * writes the number of open URLs to document.body's data-preview-urls attribute, and the number ever created to
 * data-preview-urls-created. Both stay after App unmounts.
 */
const openPreviewUrls = new Set<string>();
let createdPreviewUrls = 0;
const createUrl = URL.createObjectURL.bind(URL);
const revokeUrl = URL.revokeObjectURL.bind(URL);
const showOpenPreviewUrls = () => {
  document.body.dataset.previewUrls = String(openPreviewUrls.size);
  document.body.dataset.previewUrlsCreated = String(createdPreviewUrls);
};
URL.createObjectURL = (object: Blob | MediaSource) => {
  const url = createUrl(object);
  createdPreviewUrls += 1;
  openPreviewUrls.add(url);
  showOpenPreviewUrls();
  return url;
};
URL.revokeObjectURL = (url: string) => {
  openPreviewUrls.delete(url);
  revokeUrl(url);
  showOpenPreviewUrls();
};
showOpenPreviewUrls();

type UploadStatus = 'uploading' | 'uploaded' | 'failed' | 'cancelled';

interface Upload {
  /** One per row, so two files with the same name stay two rows. */
  key: number;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  percent: number;
}

const STATUS_TEXT: Record<Exclude<UploadStatus, 'uploading'>, string> = {
  uploaded: 'Uploaded',
  failed: 'Upload failed',
  cancelled: 'Cancelled',
};

/** Why a file cannot be uploaded, or null when it can. The type comes first: a large PDF is the wrong type. */
function rejectionOf(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name} is not a PNG or JPEG image.`;
  if (file.size > MAX_BYTES) return `${file.name} is larger than ${MAX_BYTES / 1024 / 1024} MB.`;
  return null;
}

/** Whether a drag carries files, rather than text or a link dragged from the page. */
const carriesFiles = (transfer: DataTransfer | null) => !!transfer && Array.from(transfer.types).includes('Files');

/** Where focus goes after the render a click causes, so a keyboard user stays in the list. */
type PendingFocus = { key: number; control: 'retry' | 'cancel-upload' | 'remove' } | 'choose' | null;

export default function App() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [rejections, setRejections] = useState<{ id: number; text: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pendingFocus = useRef<PendingFocus>(null);
  const nextKey = useRef(1);
  const nextRejection = useRef(1);
  const dragDepth = useRef(0);
  // Kept outside state, so a handler and the unmount cleanup always see the current ones.
  const controllers = useRef(new Map<number, AbortController>());
  const previewUrls = useRef(new Map<number, string>());

  // When App unmounts, stop every running upload and release every preview URL.
  useEffect(() => {
    const running = controllers.current;
    const urls = previewUrls.current;
    return () => {
      Array.from(running.values()).pop()?.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // A file dropped next to the zone would replace the page, so file drags are cancelled everywhere; only the zone
  // adds the files.
  useEffect(() => {
    const guard = (event: DragEvent) => {
      if (!carriesFiles(event.dataTransfer)) return;
      event.preventDefault();
      // Outside the zone, the cursor shows that a drop would do nothing.
      if (event.type === 'dragover' && event.dataTransfer && !zoneRef.current?.contains(event.target as Node)) {
        event.dataTransfer.dropEffect = 'none';
      }
      if (event.type === 'drop') {
        dragDepth.current = 0;
        setDragActive(false);
      }
    };
    window.addEventListener('dragover', guard);
    window.addEventListener('drop', guard);
    return () => {
      window.removeEventListener('dragover', guard);
      window.removeEventListener('drop', guard);
    };
  }, []);

  // Cancel, Retry and Remove each take away the button that was clicked; move focus to its counterpart.
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target === 'choose') {
      chooseRef.current?.focus();
      return;
    }
    // A row that finished just before Cancel has no Retry; its Remove is the closest control left.
    const row = listRef.current?.querySelector<HTMLElement>(`[data-key="${target.key}"]`);
    (row?.querySelector<HTMLElement>(`.${target.control}`) ?? row?.querySelector<HTMLElement>('.remove'))?.focus();
  });

  const update = (key: number, change: Partial<Upload>) => {
    setUploads((current) => current.map((upload) => (upload.key === key ? { ...upload, ...change } : upload)));
  };

  const startUpload = (key: number, file: File) => {
    const controller = new AbortController();
    controllers.current.set(key, controller);
    update(key, { status: 'uploading', percent: 0 });
    uploadReceipt(file, { signal: controller.signal, onProgress: (percent) => update(key, { percent }) })
      .then(() => update(key, { status: 'uploaded', percent: 100 }))
      .catch(() => {
        // A cancel has already marked the row, and a remove has dropped it.
        if (!controller.signal.aborted) update(key, { status: 'failed' });
      })
      .finally(() => {
        if (controllers.current.get(key) === controller) controllers.current.delete(key);
      });
  };

  const stopUpload = (key: number) => {
    controllers.current.get(key)?.abort();
    controllers.current.delete(key);
  };

  const addFiles = (files: FileList | null) => {
    const accepted: Upload[] = [];
    const problems: string[] = [];
    for (const file of Array.from(files ?? [])) {
      const problem = rejectionOf(file);
      if (problem) {
        problems.push(problem);
        continue;
      }
      const key = nextKey.current;
      nextKey.current += 1;
      // One URL per file, made here rather than in render, so re-renders reuse it.
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.set(key, previewUrl);
      accepted.push({ key, file, previewUrl, status: 'uploading', percent: 0 });
    }
    setRejections(problems.map((text) => ({ id: nextRejection.current++, text })));
    setUploads((current) => [...current, ...accepted]);
    accepted.forEach((upload) => startUpload(upload.key, upload.file));
  };

  const cancel = (key: number) => {
    stopUpload(key);
    // An upload that finished just before the click stays Uploaded.
    setUploads((current) =>
      current.map((upload) =>
        upload.key === key && upload.status === 'uploading' ? { ...upload, status: 'cancelled' } : upload,
      ),
    );
    pendingFocus.current = { key, control: 'retry' };
  };

  const retry = (upload: Upload) => {
    startUpload(upload.key, upload.file);
    pendingFocus.current = { key: upload.key, control: 'cancel-upload' };
  };

  const remove = (key: number) => {
    const index = uploads.findIndex((upload) => upload.key === key);
    const neighbour = uploads[index + 1] ?? uploads[index - 1];
    pendingFocus.current = neighbour ? { key: neighbour.key, control: 'remove' } : 'choose';
    stopUpload(key);
    const url = previewUrls.current.get(key);
    if (url) URL.revokeObjectURL(url);
    previewUrls.current.delete(key);
    setUploads((current) => current.filter((upload) => upload.key !== key));
  };

  // Moving onto a child fires dragenter on the child before dragleave on the zone, so the zone counts enters and
  // leaves instead of switching off on the first leave.
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragActive(true);
  };

  // Leaves are not filtered: a text drag never raised the count, and the floor of zero keeps it there.
  const handleDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragActive(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event.dataTransfer)) return;
    // Without this, the browser does not allow a drop here.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <main className="page">
      <section className="card">
        <header className="card-header">
          <h1 className="title">Receipts</h1>
          <p className="subtitle">Expense report · Spring offsite</p>
        </header>

        <div
          ref={zoneRef}
          className="dropzone"
          data-active={dragActive ? 'true' : undefined}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="dropzone-hint">Drop receipts here</p>
          <p className="dropzone-note">PNG or JPEG, up to 2 MB each</p>
          <button ref={chooseRef} type="button" className="choose" onClick={() => inputRef.current?.click()}>
            Choose files
          </button>
          <input
            ref={inputRef}
            className="picker"
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            hidden
            onChange={(event) => {
              addFiles(event.target.files);
              // Clearing the value lets the same file be chosen again.
              event.target.value = '';
            }}
          />
        </div>

        <ul className="rejections" aria-live="polite">
          {/* New ids for every batch, so a repeated message is a new node that screen readers announce again. */}
          {rejections.map((rejection) => (
            <li key={rejection.id}>{rejection.text}</li>
          ))}
        </ul>

        <ul className="uploads" ref={listRef}>
          {uploads.map((upload) => {
            const name = upload.file.name;
            const stopped = upload.status === 'failed' || upload.status === 'cancelled';
            const statusText =
              upload.status === 'uploading' ? `Uploading ${upload.percent}%` : STATUS_TEXT[upload.status];
            // A stopped row keeps its percent; say it, since aria-valuetext replaces the number for screen readers.
            const valueText = stopped ? `${statusText} at ${upload.percent}%` : statusText;
            return (
              <li className="upload" key={upload.key} data-key={upload.key}>
                <img className="thumb" src={upload.previewUrl} alt="" />
                <div className="upload-body">
                  <span className="upload-name">{name}</span>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label={`Upload of ${name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={upload.percent}
                    aria-valuetext={valueText}
                  >
                    <div className="progress-fill" style={{ width: `${upload.percent}%` }} />
                  </div>
                  <span className="upload-status">{statusText}</span>
                </div>
                <div className="upload-actions">
                  {upload.status === 'uploading' && (
                    <button
                      type="button"
                      className="cancel-upload"
                      aria-label={`Cancel the upload of ${name}`}
                      onClick={() => cancel(upload.key)}
                    >
                      Cancel
                    </button>
                  )}
                  {stopped && (
                    <button
                      type="button"
                      className="retry"
                      aria-label={`Retry the upload of ${name}`}
                      onClick={() => retry(upload)}
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    className="remove"
                    aria-label={`Remove ${name}`}
                    onClick={() => remove(upload.key)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
