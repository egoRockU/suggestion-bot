import { sendMessage } from '@/utils/messages';
import { extractCapture, findMessage, type FoundMessage } from '@/utils/sites';
import './style.css';

const HIDE_DELAY_MS = 300;
const BUTTON_SIZE = 40;
const EDGE = 8;

const ICON =
  '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 8h8M8 12h5"/></svg>';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default defineContentScript({
  matches: ['*://mail.google.com/*', '*://chat.google.com/*'],
  // Chat inside Gmail runs in chat.google.com frames.
  allFrames: true,
  cssInjectionMode: 'ui',

  async main(ctx) {
    let active: FoundMessage | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let ring!: HTMLDivElement;
    let action!: HTMLDivElement;

    // The highlight is drawn in our own shadow root on top of the page, so the
    // site's DOM and styles are never touched.
    const ui = await createShadowRootUi(ctx, {
      name: 'suggestion-bot-overlay',
      position: 'inline',
      anchor: 'body',
      onMount(container) {
        const layer = document.createElement('div');
        layer.className = 'layer';

        ring = document.createElement('div');
        ring.className = 'ring';
        ring.hidden = true;

        action = document.createElement('div');
        action.className = 'action';
        action.hidden = true;

        const button = document.createElement('button');
        button.className = 'button';
        button.type = 'button';
        button.setAttribute('aria-label', 'See suggestions');
        button.innerHTML = ICON;
        button.addEventListener('click', onClick);

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = 'See suggestions';

        action.append(button, label);
        layer.append(ring, action);
        container.append(layer);
      },
    });
    ui.mount();

    function position() {
      if (!active) return;
      if (!active.element.isConnected) return hide();
      const rect = active.element.getBoundingClientRect();
      const offscreen = rect.bottom < 0 || rect.top > innerHeight || rect.width === 0;
      ring.hidden = action.hidden = offscreen;
      if (offscreen) return;

      Object.assign(ring.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
      // Bottom-right corner of the message, kept inside the viewport for long emails.
      const top = clamp(rect.bottom - BUTTON_SIZE / 2, EDGE, innerHeight - BUTTON_SIZE - EDGE);
      const right = clamp(innerWidth - rect.right + 12, EDGE, innerWidth - BUTTON_SIZE - EDGE);
      Object.assign(action.style, { top: `${top}px`, right: `${right}px` });
    }

    function show(found: FoundMessage) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
      if (active?.element === found.element) return;
      active = found;
      position();
    }

    function hide() {
      active = null;
      ring.hidden = action.hidden = true;
    }

    function scheduleHide() {
      if (hideTimer === undefined) hideTimer = setTimeout(hide, HIDE_DELAY_MS);
    }

    function onClick() {
      if (!active) return;
      const capture = extractCapture(active);
      if (capture) void sendMessage({ type: 'capture', capture });
    }

    ctx.addEventListener(
      document,
      'mouseover',
      (event) => {
        // Pointer is on our own button: keep the current message highlighted.
        if (event.target === ui.shadowHost) {
          clearTimeout(hideTimer);
          hideTimer = undefined;
          return;
        }
        const found = findMessage(event.target);
        if (found) show(found);
        else if (active) scheduleHide();
      },
      { passive: true },
    );
    ctx.addEventListener(document.documentElement, 'mouseleave', () => active && scheduleHide(), { passive: true });
    ctx.addEventListener(window, 'scroll', position, { passive: true, capture: true });
    ctx.addEventListener(window, 'resize', position, { passive: true });
  },
});
