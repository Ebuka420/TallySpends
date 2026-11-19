# Support and Smart Coach

The help page retains static FAQs. Its chat uses authenticated POST /api/chat
and displays only the returned assistantMessage.content. It is labeled Smart
Coach, and users are told messages are saved in coach history. No canned reply,
simulated typing delay, human-agent status or ticket confirmation is generated.

Requests use the shared authenticated client, with session refresh, timeout,
unmount cancellation and account-change guards. Failures display an inline
error and retain the question for an explicit retry.

Email Support opens a mailto draft addressed to tallyspends@gmail.com. The user
sends it themselves. No chat transcript or account data is attached automatically.
Missing email apps show the support address. The backend has no documented
human-support or ticket endpoint.

Run node --test src/support/care.test.cjs for the chat contract, malformed/error
responses and email-draft checks. Authenticated chat and native email launching
still require device verification.
