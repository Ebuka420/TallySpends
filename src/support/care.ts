export const supportEmail = "tallyspends@gmail.com";
export const careGreeting = "Hi! I'm TallySpends Care, your automated help assistant. I can explain app features and common problems. I can't view your account, move money, or open support tickets. For account-specific help, use Email Support. Never share your password, PIN, OTP, full card number or NIN here.";
export const helpTopics = [
  { id: 1, category: "Disputes", question: "I don't recognize a charge. What should I do?", answer: "Contact your bank promptly about an unrecognized charge. Email TallySpends support with the transaction date, amount and reference if available. Don't include card numbers, PINs or OTPs. Care cannot freeze cards, reverse transactions or open a dispute ticket." },
  { id: 2, category: "Sync", question: "Why is a transaction missing from my history?", answer: "Check whether your bank shows the transaction as completed, then reopen Transaction History and refresh your linked accounts. Bank data can be delayed; the app cannot guarantee a sync time. If it is still missing, email support with the date, amount, bank name and transaction reference." },
  { id: 3, category: "Cards", question: "How do I link a bank account?", answer: "Open Linked Cards or the dashboard's add-account card, then tap Link Bank Account. Mono handles bank selection and authentication. The app adds the account only after the backend confirms linking, then refreshes the dashboard. Linking currently uses Mono sandbox; it does not issue a debit card or enable real-bank payments." },
  { id: 4, category: "Budget", question: "How do I change a category budget?", answer: "Open the Budget tab and select the category or budget you want to manage. Use its edit controls to change the limit and save. Some budgeting and wallet features currently use local demo data; changing a budget does not change your bank balance." },
  { id: 5, category: "Privacy", question: "How do I hide my dashboard balance?", answer: "Use the balance visibility control on your dashboard, or open Settings > Security Center and enable Private Mode. This hides displayed balances; it does not change the amount in your account." },
];
type Reply = { text: string; topic: string | null };
const extra = {
  login: "Check your internet connection and try signing in again. A hostname or server connection error means the app could not reach its backend; resetting your password won't fix that connection. If it continues, email support with the error text and whether you're using Wi-Fi or mobile data. Don't send your password or access token.",
  profile: "Open My Profile to change your name, phone number or photo. Photos upload to the backend and are reloaded from your account. Select an old device-only photo again to upload it. Nickname, gender, DOB and address currently remain local preferences for your account. Email and TallyTag changes require backend support.",
  youngins: "Youngins is for an authenticated parent or legal guardian to create a child profile. Registration remains unavailable until the backend provides the required registration endpoints and approved privacy/consent notice. Care cannot bypass that requirement or create a wallet for the child.",
  qr: "Open Tally Request to share your personal payment QR. It requires a backend-issued payment identity. Scanning verifies the recipient through the backend when that service is available. QR payment execution is not connected yet, so scanning does not move money or confirm a payment.",
  password: "Open Settings > Login Settings > Reset Password to change your password using your current password. Forgot your app PIN? Choose Forgot PIN on the lock screen and verify your account password to create a new PIN. If you've forgotten your account password too, use Email Support for account recovery help; never include passwords, PINs or OTPs.",
};
export function careReply(message: string, previousTopic: string | null = null): Reply {
  const text = message.toLowerCase().replace(/[’']/g, "");
  if (/\b(otp|pin|password|nin|bvn|card number)\s*[:=]\s*\S+|\b\d{11,19}\b/.test(text)) return { text: "Please don't share sensitive account details here. Care doesn't need your password, PIN, OTP, NIN or full card number. Use Email Support with a description of the issue and non-sensitive references only.", topic: null };
  if (/\b(human|agent|email|ticket|support team|contact support|still not|didnt work|doesnt work|not working|did not work)\b/.test(text)) return { text: `Use Email Support to contact ${supportEmail}. Describe what happened, the screen involved and the error message. This opens your email app; you must send the email yourself. No ticket has been opened by this chat.`, topic: null };
  const topics: string[] = [];
  if (/\b(dispute|unauthori[sz]ed|unrecogni[sz]\w*|fraud|charged twice|stolen|stole|refund|missing money|lost money)\b/.test(text)) return { text: helpTopics[0].answer, topic: "Disputes" };
  if (/\b(login|log in|sign in|signin|hostname|network|server|authentication)\b/.test(text)) topics.push("login");
  if (/\b(password|reset password)\b/.test(text)) topics.push("password");
  if (/\b(profile|photo|picture|avatar|nickname|tallytag|tally tag|username)\b/.test(text)) topics.push("profile");
  if (/\b(youngins|child|guardian|children)\b/.test(text)) topics.push("youngins");
  if (/\b(qr|scan|transfer|receive|send money|payment request)\b/.test(text)) topics.push("qr");
  if (/\b(bank|card|mono|link|connect)\b/.test(text)) topics.push("Cards");
  if (/\b(budget|limit|allowance)\b/.test(text)) topics.push("Budget");
  if (/\b(hide|privacy|private|mask|show balance)\b/.test(text)) topics.push("Privacy");
  if (/\b(transaction|history|sync|missing transaction)\b/.test(text) && !topics.includes("Disputes")) topics.push("Sync");
  const answer = (topic: string) => helpTopics.find(item => item.category === topic)?.answer || extra[topic as keyof typeof extra];
  if (topics.length) return { text: topics.slice(0, 3).map(answer).filter(Boolean).join("\n\n"), topic: topics[0] };
  if (previousTopic && /\b(how|where|why|explain|more|next|steps)\b/.test(text) && answer(previousTopic)) return { text: answer(previousTopic) + " If that doesn't address the problem, describe the exact step or use Email Support for account-specific help.", topic: previousTopic };
  if (/^(hi|hey|hello|good morning|good evening)[!. ]*$/.test(text)) return { text: "Hi! What would you like help with: signing in, linked banks, budgets, your profile, QR requests or Youngins?", topic: null };
  if (/\b(thanks|thank you)\b/.test(text)) return { text: "You're welcome. If you need account-specific help, Email Support is available.", topic: previousTopic };
  return { text: "I don't have a reliable answer to that yet. Which screen are you using, and what happened? I can help with sign-in, linked banks, budgets, profiles, QR requests and Youngins. For anything account-specific, use Email Support.", topic: null };
}
export function supportMailUrl() { return `mailto:${supportEmail}?subject=${encodeURIComponent("TallySpends support request")}&body=${encodeURIComponent("Please describe the issue, the screen involved, and any error message.\n\nDo not include passwords, PINs, OTPs, NIN, full card numbers or access tokens.\n\n")}`; }
