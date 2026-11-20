# Suggestion Bot

A Chrome extension that suggests replies to messages in Gmail and Google Chat. Hover a message, click the teal button, and a reply drafted by Claude appears in the side panel, ready to copy.

Replies are written by Claude Code running on your own computer with your existing login. No API key is needed.

## Requirements

- Chrome
- Node 20+ and pnpm
- [Claude Code](https://claude.com/claude-code) installed and logged in (`claude` works in a terminal)

## Run it

```bash
pnpm install
pnpm build        # writes the extension to .output/chrome-mv3
pnpm helper       # starts the local helper; keep this terminal open
```

Then load the extension once:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose `.output/chrome-mv3`.
3. Reload any Gmail or Chat tabs that were already open.

After changing code, run `pnpm build` again and press the reload icon on the extension's card.

## Use it

1. Hover a message in Gmail or Google Chat. It gets a teal outline and a round button at its bottom-right corner.
2. Click the button. The side panel opens and shows the reply.
3. Pick a tone (Friendly, Formal, Short) or press **Regenerate** for another version, then **Copy**.

The toolbar icon opens a popup showing the same latest suggestion. The sliders icon in the panel header opens settings, where you can set your name and standing instructions such as "Always reply in English".

If the panel says **Helper not running**, start `pnpm helper` and press **Try again**.

## What is sent to Claude

Only when you click the button: the hovered message, up to 12 earlier messages from the same conversation, the email subject, your tone choice and your settings. Nothing is read or sent on hover.

## How it fits together

| Part | Where |
|---|---|
| Hover highlight and button | `entrypoints/overlay.content/` |
| Finding and reading messages per site | `utils/sites/` (one adapter per site) |
| Request handling and state | `entrypoints/background.ts`, `utils/storage.ts` |
| Panel UI | `components/SuggestionView.tsx`, used by `entrypoints/sidepanel/` and `entrypoints/popup/` |
| Settings | `entrypoints/options/` |
| Local helper | `helper/server.mjs`, prompt in `helper/prompt.mjs` |

Gmail and Google Chat have no stable markup. If messages stop being highlighted after a Google update, the selectors at the top of `utils/sites/gmail.ts` and `utils/sites/gchat.ts` are what to fix. To support another site, add an adapter there and its URL to `matches` in the content script.

## Helper options

Environment variables for `pnpm helper`:

- `SUGGESTION_BOT_MODEL`: Claude model, default `haiku`.
- `SUGGESTION_BOT_PORT`: default `43117`. If you change it, also change `HELPER_URL` in `utils/helper-client.ts` and `host_permissions` in `wxt.config.ts`.
- `CLAUDE_BIN`: path to the `claude` command if it is not on `PATH`.

The helper listens on `127.0.0.1` only, refuses requests from web pages, and runs Claude with no tools in an empty folder.

## Scripts

- `pnpm dev`: build in watch mode with a throwaway Chrome profile (not logged in to Google, so mostly useful for the panel UI)
- `pnpm build`, `pnpm zip`
- `pnpm compile`: type-check
- `pnpm test`: unit tests
