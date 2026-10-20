# TallySpends accent themes

Current visual policy (20 October 2026): white is an integral part of the app.
Themes primarily change buttons, accents, selected controls, icons, chart accents
and restrained logo ink. They do not recolour every screen or dashboard card.

## Stable surfaces

All eight Light themes share white surfaces, a near-white canvas, neutral text,
neutral borders and black shadows. All eight Dark themes share one readable dark
surface system. Light/Dark/System appearance remains independent of the selected
accent, and Aurora Violet remains the default. Base motion and shadow intensity
are shared rather than changing the whole atmosphere for each accent.

Dashboard wallet/bank cards and HomeCarousel insight/planning cards use
getDashboardPalette(mode), independent of theme selection. The overview wallet
keeps its original light surface/dark counterpart. Bank cards retain bank brand
colours and official logos. Insight/Ajo/savings cards retain their established
pastel tints; text/icon contrast follows appearance, not accent selection.
Links, controls and indicators outside those cards can use the selected accent.

## Main files

- src/theme.ts: shared neutral surfaces, eight accent sets, semantic status colours,
  fixed dashboard palette, logo ink, interpolation and compatibility exports.
- src/appearance.ts: shared preference snapshot, single hydration, immediate
  selection and serialized saves using existing storage keys. Failed saves report
  that the current selection is a preview; selecting it again retries saving.
- src/ThemeExperience.tsx: shared colour transition and status/native root colours.
  Reduced motion disables interpolation. Appearance switches are atomic to avoid
  unreadable foreground/background blends. No screen capture or remount is used.
- components/BrandMark.tsx: gradients through the alpha mask of the exact original
  288x288 splash-mark-dark.png. No replacement geometry or crude image filter.
- components/DynamicLogo.tsx: neutral framing and restrained shadow around the mark.
- app/settings-themes.tsx: white/neutral preview cards, original logo, accent palette,
  miniature UI, mood, selected state and separate appearance controls.
- components/DashboardBankCarousel.tsx: fixed wallet/bank card appearance.
- components/HomeCarousel.tsx and PlanningCarousels.tsx: stable insight/Ajo/savings
  card colours, independent of the selected accent.
- src/store.ts: delegates appearance to the shared repository; financial logic is
  separate. Profile photo data, editing, storage and rendering were left alone
  during the scope correction at the user's instruction.

The accent choices remain Aurora Violet, Sage Green, Sunset Peach, Ocean Breeze,
Forest Pine, Crimson Rose, Midnight Gold and Blossom Pink. Their accent colours
and logo gradients differ; the surrounding application retains its familiar base.

Native splash assets are static Expo launch resources. The in-app launch screen
uses the saved accent and current appearance. No restart is needed to switch.
Financial success/warning/danger retain semantic hues. Bank branding and QR
black-on-white scanning surfaces remain independent of accent selection.

## Validation

node src/theme.test.cjs checks all eight themes in both appearances, normal text,
action/status/hero contrast, shared neutral-surface invariants, intermediate
frames across all theme pairs, persistence, rapid saves, delayed hydration and
storage failures. Previewing or changing accents must never reset account data.

Physical QA: change each accent in Light and Dark; confirm white remains the
Light base, card colours and photos do not change, buttons/icons update, saved
choices survive restart, and accessibility/reduced motion remain correct.
Whole-project TypeScript has two pre-existing absoluteFillObject errors in the
inactive appp snapshot. Device visual/performance checks remain necessary.
