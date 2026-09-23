# Smart Coach

The September 23 refresh uses the supplied Pinterest screen recording as a
reference for the action fan, selected-button emphasis, dimmed background and
large action labels. It retains Tally's theme and existing tool destinations.

- Tap the floating button to chat; hold for 240 ms to expand the actions.
- Slide over an action to enlarge it, show its name and feel selection feedback.
  Release to open it; slide back to the anchor or away from the fan to cancel.
- Release a stationary hold to leave the menu open, then tap an action. Outside
  taps and Android Back dismiss it. Drag without holding to move the button.
- The fan mirrors at the left/right edges and opens downward near the top.
  Drawing and hit testing share coordinates. Closed actions ignore touches.
- Calculator, Add Expense and Scan Receipt share a keyboard-aware sheet.
  Calculator results can fill the expense amount without changing native modals.
  Expense and receipt saving retain the dashboard completion/receipt flow.
- Chat preserves the existing authenticated `/api/chat` request contract. It adds
  question starters, a multiline composer, scroll following, pending status,
  timeout handling and retry without duplicating the user's message. Replies and
  drafts stay in memory while the floating coach is mounted. No chat API or OCR
  call is made by the tests; they use injected responses.

`node --test src/coach/coach.test.cjs` covers hit testing at all four edges, cancel
zones, small-screen fan bounds and chat authentication/response failures.

Device acceptance still required: hold and sweep every action, reverse a
selection, drag to both edges and near the top, tap actions after a stationary
hold, rotate the device, enable reduced motion/VoiceOver/TalkBack, enter amounts,
use a calculator result, scan a receipt and send/retry a chat message with the
keyboard open. The development browser was not connected during this refresh;
native exports verify compilation but not touch feel or keyboard placement.

Verified on 2026-09-23: all 74 repository tests, the whole-project TypeScript
check and iOS/Android bundle exports pass. Chat and OCR service availability
were not exercised against live accounts.
