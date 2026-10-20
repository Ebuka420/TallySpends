# TallySpends Care

Care is an on-device guided help assistant, using curated guidance rather than a
generative AI service or a live support queue. FAQ answers and chat guidance share
the same source. It recognizes app topics, supports limited topic follow-ups,
prioritizes unrecognized charges, and admits when it lacks a reliable answer.

It cannot view accounts, move money, freeze cards, open tickets or confirm dispute
resolution. Copy reflects the current sandbox bank-linking flow and backend
limitations for QR payments, Youngins and profile edits. Update this guidance as
those backend capabilities become available.

Email Support is available on the help page and inside Care. It opens a mailto
draft addressed to tallyspends@gmail.com; the user sends it themselves. No chat
transcript or account data is attached automatically. Missing email apps produce
a fallback message containing the support address.

Chat stays in memory and is reset when the displayed account identity changes.
Pending reply/scroll timers are cleaned up. Duplicate replies are guarded and
sensitive-looking inputs receive a warning. This warning is not a comprehensive
PII detector; messages are never sent to an AI provider or persisted by Care.

Verification: `node src/support/care.test.cjs` covers supported topics, follow-ups,
unknown questions, escalation, sensitive-input warnings and the email draft.
Physical device testing of the email app launch remains necessary.
