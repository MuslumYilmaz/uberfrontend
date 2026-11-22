import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

// ---------------------------------------------------------------------------------------------------------------
// Given: the speech service's types and a fake implementation. Read the types; treat everything down to Studio as
// given and working.
// ---------------------------------------------------------------------------------------------------------------

export type VoiceId = string;

export interface Voice {
  id: VoiceId;
  name: string;
  /** The longest text this voice accepts, in characters. */
  maxCharacters: number;
}

export interface Clip {
  voiceId: VoiceId;
  /** The text the clip speaks. */
  text: string;
  /** Length of the audio in seconds. */
  seconds: number;
}

export type SpeechErrorCode = 'quota-exceeded' | 'text-rejected' | 'service-unavailable';

/**
 * Every failure the service reports is a SpeechError; a job stopped through its signal rejects with an AbortError
 * instead. A SpeechError's `message` is a code for logs, not for people.
 */
export class SpeechError extends Error {
  readonly code: SpeechErrorCode;

  constructor(code: SpeechErrorCode) {
    super(`speech_error:${code}`);
    this.name = 'SpeechError';
    this.code = code;
  }
}

/** What people should read for each failure. */
export const ERROR_MESSAGES: Record<SpeechErrorCode, string> = {
  'quota-exceeded': "You have used this month's characters.",
  'text-rejected': "This text can't be voiced. Edit it and try again.",
  'service-unavailable': 'The voice service is unavailable. Try again in a moment.',
};

export interface SynthesisOptions {
  /**
   * Aborting stops the job: its timers stop, `onProgress` is not called again, and the promise rejects with a
   * DOMException named 'AbortError'.
   */
  signal: AbortSignal;
  /** Called with 10, 20, … 100 as the job runs. */
  onProgress: (percent: number) => void;
}

export interface SpeechService {
  /** Resolves with the voices after 300 ms. Rejects with a SpeechError when the service is down. */
  listVoices(): Promise<Voice[]>;
  /**
   * Voices `text` with the voice. Resolves with the clip after progress reaches 100. Rejects with a SpeechError when
   * the job fails, or with an AbortError once it is stopped through `options.signal`.
   */
  synthesize(text: string, voiceId: VoiceId, options: SynthesisOptions): Promise<Clip>;
}

export type Scenario = 'normal' | 'slow' | 'voices-down' | 'quota' | 'rejected';

const VOICES: Voice[] = [
  { id: 'rowan', name: 'Rowan · narration', maxCharacters: 200 },
  { id: 'ines', name: 'Inès · conversational', maxCharacters: 120 },
  { id: 'kit', name: 'Kit · short form', maxCharacters: 40 },
];

/**
 * A fake service for one scenario. Progress moves every 100 ms (every 300 ms when slow). With 'voices-down' the
 * first listVoices fails and later ones answer; with 'quota' and 'rejected' a job fails after 30 %.
 */
export function createSpeechService(scenario: Scenario): SpeechService {
  let voiceCalls = 0;
  const every = scenario === 'slow' ? 300 : 100;
  return {
    listVoices() {
      voiceCalls += 1;
      const fail = scenario === 'voices-down' && voiceCalls === 1;
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          if (fail) reject(new SpeechError('service-unavailable'));
          else resolve(VOICES.map((voice) => ({ ...voice })));
        }, 300);
      });
    },
    synthesize(text, voiceId, { signal, onProgress }) {
      return new Promise((resolve, reject) => {
        const abortError = () => new DOMException('The job was cancelled.', 'AbortError');
        if (signal.aborted) {
          reject(abortError());
          return;
        }
        const voice = VOICES.find((candidate) => candidate.id === voiceId);
        let percent = 0;
        const stop = () => {
          window.clearInterval(timer);
          signal.removeEventListener('abort', onAbort);
        };
        const onAbort = () => {
          stop();
          reject(abortError());
        };
        const timer = window.setInterval(() => {
          if (percent === 30 && (scenario === 'quota' || scenario === 'rejected')) {
            stop();
            reject(new SpeechError(scenario === 'quota' ? 'quota-exceeded' : 'text-rejected'));
            return;
          }
          if (!voice || text.trim() === '' || text.length > voice.maxCharacters) {
            stop();
            reject(new SpeechError('text-rejected'));
            return;
          }
          percent += 10;
          onProgress(percent);
          if (percent === 100) {
            stop();
            resolve({ voiceId, text, seconds: Math.max(1, Math.round(text.length / 14)) });
          }
        }, every);
        signal.addEventListener('abort', onAbort);
      });
    },
  };
}

export type PanelStatus = 'loading-voices' | 'voices-failed' | 'idle' | 'generating' | 'done' | 'failed';

export interface SpeakerPanelProps {
  status: PanelStatus;
  /** Empty until the voices load. */
  voices: Voice[];
  voiceId: VoiceId | null;
  text: string;
  /** The job's last reported percentage while generating; null otherwise. */
  progress: number | null;
  clip: Clip | null;
  /** A message for people, shown whenever it is not null. */
  error: string | null;
  /** Generate is disabled when this is false. */
  canGenerate: boolean;
  onVoiceChange: (voiceId: VoiceId) => void;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  onRetryVoices: () => void;
}

const STATUS_TEXT: Record<PanelStatus, string> = {
  'loading-voices': 'Loading voices…',
  'voices-failed': 'Voices unavailable',
  idle: 'Ready',
  generating: 'Generating…',
  done: 'Done',
  failed: 'Failed',
};

/** Given and working: it renders what its props say and reports what the user does. */
export function SpeakerPanel(props: SpeakerPanelProps) {
  const voice = props.voices.find((candidate) => candidate.id === props.voiceId) ?? null;
  const clipVoice = props.clip ? props.voices.find((candidate) => candidate.id === props.clip?.voiceId) : null;
  return (
    <section className="panel" aria-label="Speech studio">
      <p className="status" role="status">
        {STATUS_TEXT[props.status]}
      </p>
      {props.status === 'generating' && props.progress !== null && (
        <p className="progress" data-percent={props.progress}>
          {props.progress}%
        </p>
      )}
      {props.error !== null && (
        <p className="error" role="alert">
          {props.error}
        </p>
      )}
      {props.status === 'voices-failed' && (
        <button type="button" className="retry-voices" onClick={props.onRetryVoices}>
          Load voices again
        </button>
      )}
      <label className="field">
        <span className="field-label">Voice</span>
        <select
          className="voice"
          value={props.voiceId ?? ''}
          disabled={props.voices.length === 0}
          onChange={(event) => props.onVoiceChange(event.target.value)}
        >
          {props.voices.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Text</span>
        <textarea className="text" rows={4} value={props.text} onChange={(event) => props.onTextChange(event.target.value)} />
      </label>
      <p className={voice && props.text.length > voice.maxCharacters ? 'char-count over' : 'char-count'}>
        {props.text.length} / {voice ? voice.maxCharacters : '—'}
      </p>
      <div className="actions">
        <button type="button" className="generate" disabled={!props.canGenerate} onClick={props.onGenerate}>
          Generate
        </button>
        {props.status === 'generating' && (
          <button type="button" className="cancel" onClick={props.onCancel}>
            Cancel
          </button>
        )}
      </div>
      {props.clip && (
        <figure className="clip">
          <figcaption className="clip-voice">{clipVoice ? clipVoice.name : props.clip.voiceId}</figcaption>
          <blockquote className="clip-text">{props.clip.text}</blockquote>
          <span className="clip-seconds">{props.clip.seconds} s</span>
        </figure>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------------------------

const messageFor = (reason: unknown) =>
  reason instanceof SpeechError ? ERROR_MESSAGES[reason.code] : ERROR_MESSAGES['service-unavailable'];

function Studio({ service }: { service: SpeechService }) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<PanelStatus>('loading-voices');
  const [progress, setProgress] = useState<number | null>(null);
  const [clip, setClip] = useState<Clip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceRequest, setVoiceRequest] = useState(0);
  // The job that may change the screen. Any other job's progress, clip or failure is ignored.
  const jobRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let current = true;
    service.listVoices().then(
      (list) => {
        if (!current) return;
        setVoices(list);
        setVoiceId(list[0]?.id ?? null);
        setStatus('idle');
      },
      (reason) => {
        if (!current) return;
        setStatus('voices-failed');
        setError(messageFor(reason));
      },
    );
    return () => {
      current = false;
    };
  }, [service, voiceRequest]);

  // Unmounting stops the job still running, which stops its timers.
  useEffect(
    () => () => {
      const job = jobRef.current;
      jobRef.current = null;
      job?.abort();
    },
    [],
  );

  const voice = voices.find((candidate) => candidate.id === voiceId) ?? null;
  // A voice is selected only once the voices are in, so this is false while they load or after they fail.
  const canGenerate = voice !== null && text.trim() !== '' && text.length <= voice.maxCharacters;

  const generate = () => {
    if (!canGenerate || voice === null) return;
    jobRef.current?.abort();
    const job = new AbortController();
    jobRef.current = job;
    setStatus('generating');
    setProgress(null);
    setClip(null);
    setError(null);
    service
      .synthesize(text, voice.id, {
        signal: job.signal,
        onProgress: (percent) => {
          if (jobRef.current === job) setProgress(percent);
        },
      })
      .then(
        (result) => {
          if (jobRef.current !== job) return;
          jobRef.current = null;
          setProgress(null);
          setClip(result);
          setStatus('done');
        },
        (reason) => {
          // A replaced or cancelled job has already handed the screen on; its AbortError changes nothing.
          if (jobRef.current !== job) return;
          jobRef.current = null;
          setProgress(null);
          setStatus('failed');
          setError(String((reason as Error).message));
        },
      );
  };

  const retryVoices = () => {
    setStatus('loading-voices');
    setError(null);
    setVoiceRequest((count) => count + 1);
  };

  const cancel = () => {
    const job = jobRef.current;
    if (job === null) return;
    jobRef.current = null;
    job.abort();
    setProgress(null);
    setStatus('idle');
  };

  return (
    <SpeakerPanel
      status={status}
      voices={voices}
      voiceId={voiceId}
      text={text}
      progress={progress}
      clip={clip}
      error={error}
      canGenerate={canGenerate}
      onVoiceChange={setVoiceId}
      onTextChange={setText}
      onGenerate={generate}
      onCancel={cancel}
      onRetryVoices={retryVoices}
    />
  );
}

// Given: the page around Studio. A scenario switch builds a new service and mounts a new Studio for it.
export default function App() {
  const [scenario, setScenario] = useState<Scenario>('normal');
  const service = useMemo(() => createSpeechService(scenario), [scenario]);
  return (
    <main className="main">
      <header className="header">
        <h1 className="title">Speech Studio</h1>
        <label className="scenario-field">
          <span className="field-label">Service scenario</span>
          <select className="scenario" value={scenario} onChange={(event) => setScenario(event.target.value as Scenario)}>
            <option value="normal">Normal</option>
            <option value="slow">Slow jobs</option>
            <option value="voices-down">Voices down at first</option>
            <option value="quota">Quota used up</option>
            <option value="rejected">Text rejected</option>
          </select>
        </label>
      </header>
      <Studio key={scenario} service={service} />
    </main>
  );
}
