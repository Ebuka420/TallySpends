# Bank logos

Existing local PNG assets and catalogue originate from
https://github.com/ridbay/nigerian-banks (see LICENSE). They contain bank branding,
not generated approximations. Bank names and account details are never replaced
by the catalogue. `src/data/banks.ts` resolves codes first, then known provider
slugs, then exact normalized names and explicit aliases. Unavailable assets use
the existing generic building icon; the generic default-image asset is not used
as an official logo.

`components/BankLogo.tsx` renders with contain sizing, no tint or crop, and a
white backing inside the icon bounds so original colors remain visible on dark
surfaces. Existing bank selection containers and transaction actions are retained.
Withdrawal choices remain the existing demo accounts; this visual change does
not connect those choices to a new payment or account-selection backend.

The Mono-hosted bank picker is rendered by Mono and is not modified here.
