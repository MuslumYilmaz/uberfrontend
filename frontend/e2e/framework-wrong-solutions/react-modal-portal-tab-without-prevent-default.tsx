import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './App.css';

export const PROJECT_NAME = 'atlas-web';

/** Space between a tooltip and its button, and the least space between a tooltip and the page's sides, in px. */
export const TOOLTIP_GAP = 8;

export interface Help {
  /** The info button's accessible name. */
  name: string;
  /** What the tooltip says. */
  text: string;
}

export interface Field {
  label: string;
  value: string;
  help?: Help;
}

export const FIELDS: Field[] = [
  { label: 'Project name', value: PROJECT_NAME },
  {
    label: 'Region',
    value: 'Frankfurt',
    help: {
      name: 'About regions',
      text: 'Builds run and logs are stored in this region. Moving a project to another region pauses its deploys for up to an hour.',
    },
  },
  { label: 'Build cache', value: 'On' },
  {
    label: 'Log retention',
    value: '30 days',
    help: {
      name: 'About log retention',
      text: 'Logs older than this are deleted every night. Logs you exported are kept until you delete them yourself.',
    },
  },
  { label: 'Deploy alerts', value: 'Email' },
  { label: 'Preview deploys', value: 'Every branch' },
];

/** The kinds of control Tab can reach in this dialog; a disabled one is left out because Tab skips it. */
const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"]):not(:disabled)',
].join(', ');

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

function InfoButton({ help, boundaryRef }: { help: Help; boundaryRef: { current: HTMLDivElement | null } }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  // Hover and focus each keep the tooltip open, so a pointer leaving a focused button does not close it. Escape
  // dismisses it until the next hover or focus.
  const shown = (hovered || focused) && !dismissed;

  // The first render puts the tooltip in the page hidden, so it has a size; this measures it and places it before
  // the browser paints, below the button when it fits inside the panel and above it when it does not.
  useLayoutEffect(() => {
    const button = buttonRef.current;
    const tooltip = tooltipRef.current;
    const boundary = boundaryRef.current;
    if (!shown || !button || !tooltip || !boundary) {
      setPosition(null);
      return;
    }
    const anchor = button.getBoundingClientRect();
    const size = tooltip.getBoundingClientRect();
    const fitsBelow = anchor.bottom + TOOLTIP_GAP + size.height <= boundary.getBoundingClientRect().bottom;
    const centered = anchor.left + anchor.width / 2 - size.width / 2;
    const rightmost = document.documentElement.clientWidth - TOOLTIP_GAP - size.width;
    // Rects are relative to the window; the tooltip is placed in the page, so it scrolls with the page.
    setPosition({
      top: (fitsBelow ? anchor.bottom + TOOLTIP_GAP : anchor.top - TOOLTIP_GAP - size.height) + window.scrollY,
      left: Math.max(TOOLTIP_GAP, Math.min(centered, rightmost)) + window.scrollX,
      placement: fitsBelow ? 'bottom' : 'top',
    });
  }, [shown, boundaryRef, layoutVersion]);

  // While the tooltip shows, Escape dismisses it wherever focus is. A scroll of the panel places it again while its
  // button is inside the panel, give or take a pixel, as after the scroll a browser makes to reveal a button it has
  // just focused, and hides it once the button is partly scrolled out. A resize places it again.
  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!shown || !boundary) return;
    const place = () => setLayoutVersion((version) => version + 1);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDismissed(true);
    };
    const onScroll = () => {
      const button = buttonRef.current?.getBoundingClientRect();
      const panel = boundary.getBoundingClientRect();
      // A pixel of slack: the scroll that reveals a focused button can stop half a pixel short of the edge.
      if (!button || button.top < panel.top - 1 || button.bottom > panel.bottom + 1) setDismissed(true);
      else place();
    };
    const onResize = place;
    document.addEventListener('keydown', onKeyDown);
    boundary.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      boundary.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [shown, boundaryRef]);

  return (
    <span className="info-anchor">
      <button
        ref={buttonRef}
        type="button"
        className="info"
        aria-label={help.name}
        aria-describedby={shown ? tooltipId : undefined}
        onMouseEnter={() => {
          setHovered(true);
          setDismissed(false);
        }}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => {
          setFocused(true);
          setDismissed(false);
        }}
        onBlur={() => setFocused(false)}
      >
        i
      </button>
      {shown &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className="tooltip"
            data-placement={position?.placement}
            style={position ? { top: position.top, left: position.left } : { top: 0, left: 0, visibility: 'hidden' }}
          >
            {help.text}
          </div>,
          document.body,
        )}
    </span>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState('');
  const pageRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const pressOnBackdrop = useRef({ down: false, up: false });
  const wasOpen = useRef(false);
  const titleId = useId();

  const closeDialog = () => {
    setOpen(false);
    setConfirmText('');
  };

  // While the dialog is open, the page behind it is inert and does not scroll, and Escape closes it wherever focus
  // is: focus can still end up outside the dialog, on the body after a focused control is disabled or after the
  // user comes back from the browser's toolbar. A layout effect's cleanup runs in the commit that removes the
  // dialog, on close and on unmount alike, so the page is never left inert without it. Focus goes back to the
  // trigger only on a close, after the cleanup has freed the page, because an inert button cannot take focus.
  useLayoutEffect(() => {
    if (!open) {
      if (wasOpen.current) deleteRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const page = pageRef.current;
    // Escape also cancels an input method's composition; that one is not meant for the dialog.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return;
      event.preventDefault();
      closeDialog();
    };
    page?.setAttribute('inert', '');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKeyDown);
    confirmRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      page?.removeAttribute('inert');
      document.body.classList.remove('modal-open');
    };
  }, [open]);

  const deleteProject = () => {
    closeDialog();
    setStatus(`${PROJECT_NAME} is scheduled for deletion.`);
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    // Read the controls on every Tab: the delete button joins them only once the name matches.
    const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    // A click on the dialog's text focuses the dialog itself; Shift+Tab from there goes to the last control too.
    if (event.shiftKey && (active === first || active === dialogRef.current)) {
      last.focus();
    } else if (!event.shiftKey && active === last) {
      first.focus();
    }
  };

  return (
    <main className="page" ref={pageRef}>
      <header className="topbar">
        <a className="back" href="#deployments">
          Deployments
        </a>
        <span className="crumb">/ {PROJECT_NAME} / Settings</span>
      </header>
      <section className="card">
        <header className="card-header">
          <h1 className="title">Project settings</h1>
          <p className="subtitle">{PROJECT_NAME} · Production</p>
        </header>

        <div className="settings" ref={settingsRef}>
          {FIELDS.map((field) => (
            <div className="field" key={field.label}>
              <span className="field-label">
                {field.label}
                {field.help && <InfoButton help={field.help} boundaryRef={settingsRef} />}
              </span>
              <span className="field-value">{field.value}</span>
            </div>
          ))}
        </div>

        <footer className="danger">
          <div className="danger-copy">
            <h2 className="danger-title">Delete project</h2>
            <p className="danger-text">Removes every deployment, environment and log.</p>
          </div>
          <button ref={deleteRef} type="button" className="delete" onClick={() => setOpen(true)}>
            Delete project
          </button>
        </footer>
        <p className="status" role="status">{status}</p>
      </section>

      {open &&
        createPortal(
          <div
            className="modal-backdrop"
            // A drag between the dialog and the backdrop, such as selecting the typed name, ends in a click on the
            // backdrop, the element that holds both. Only a press and a release that both land on the backdrop close
            // the dialog; a click inside it bubbles here too and is ignored.
            onMouseDown={(event) => {
              const onBackdrop = event.target === event.currentTarget;
              // A press on the backdrop would move focus to the body, out of reach of the dialog's Tab handling.
              if (onBackdrop) event.preventDefault();
              pressOnBackdrop.current = { down: onBackdrop, up: false };
            }}
            onMouseUp={(event) => {
              pressOnBackdrop.current.up = event.target === event.currentTarget;
            }}
            onClick={(event) => {
              const { down, up } = pressOnBackdrop.current;
              pressOnBackdrop.current = { down: false, up: false };
              if (event.target === event.currentTarget && down && up) closeDialog();
            }}
          >
            <div
              ref={dialogRef}
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              onKeyDown={handleDialogKeyDown}
            >
              <h2 id={titleId} className="modal-title">Delete {PROJECT_NAME}?</h2>
              <p className="modal-text">This removes 14 deployments, 3 environments and every log within the hour.</p>
              <label className="confirm-label" htmlFor="confirm-name">
                Type <strong>{PROJECT_NAME}</strong> to confirm
              </label>
              <input
                ref={confirmRef}
                id="confirm-name"
                className="confirm-input"
                autoComplete="off"
                spellCheck={false}
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
              />
              <div className="modal-actions">
                <button type="button" className="cancel" onClick={closeDialog}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-delete"
                  disabled={confirmText !== PROJECT_NAME}
                  onClick={deleteProject}
                >
                  Delete this project
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
