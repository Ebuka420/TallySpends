export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  "https://tallyspendapi-production.up.railway.app"
).replace(/\/+$/, "");
