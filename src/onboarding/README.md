# Product introduction

Both product introduction (including Replay Introduction) and post-signup setup
now use the fixed light Aurora Violet brand in brand.ts, independent of selected
themes or Light/Dark/System preferences. This does not change saved app settings.
Background atmosphere, logo gradients and motion also use this fixed identity.
Goals, employment, PIN and completion share the introduction's visual language;
form content scrolls while Continue/Get Started remains outside entrance effects.
The onboarding folder has a nested layout under the root's existing signup guard.
Failed preference writes remain actionable and cannot advance setup.

Verify a fresh install sees introduction before auth, skip/complete stays saved,
then signup proceeds goals > employment > six-digit PIN > completion. Test with
large text and a small phone. Replay Introduction should look the same after
changing any theme or appearance; reduce-motion disables optional ambient motion.
Run brand.test.cjs, intro.test.cjs and completion.test.cjs for the brand boundary,
first-visit/persistence behavior and completion/retry checks.

The four-screen product introduction is separate from account setup. Its exact
headlines and descriptions come from the supplied brief, and the website's live
HTML confirms the positioning “Understand Your Money. Own Your Future.” and
theme color #20142A. No reference video was attached with this brief.

`app/intro.tsx` mounts `components/onboarding/OnboardingScreen.tsx`. That component
contains the reusable page, copy reveal, progress indicator, and navigation.
`AnimatedBackground.tsx` keeps one atmosphere behind the entire gesture-driven
pager. `OnboardingVisual.tsx` implements the existing logo reveal, drawing chart,
organizing budget cards/ring, and Smart Coach orb. `motion.ts` derives the active
brand palette from the central theme tokens and provides a cancellable ambient
animation hook. No runtime dependency was added. The original splash-mark-dark.png
is an alpha mask for the active theme gradient, preserving its exact geometry;
the wordmark uses the same system typography as the existing app.

The horizontal scroll position is a Reanimated shared value on the UI thread.
It drives background color, parallax, fading, and progress-bar widths. Worklets
schedule only page-index changes on the React Native thread. The logo precedes
the wordmark and copy. SVG dash offsets reveal the chart and progress ring;
budget rows use damped springs. Ambient loops run only while the screen is
focused and foregrounded and their visual is selected. Reduced motion cancels
loops, skips parallax/reveals and uses nonanimated button navigation. Swiping
and visible progress buttons remain available. No financial/account API is called
and no account balances, real transactions, or personalized advice are fabricated.

Root routing waits for the intro preference for signed-out visitors.
The login/signup and account-setup routes are unavailable until that preference
is completed or skipped, so a fresh visitor cannot bypass the introduction by
opening an auth route directly.
Authenticated users keep the existing PIN/security routing and skip the automatic introduction.
They can replay the same design from Settings > About > Replay introduction.
`app/intro-preview.tsx` is protected by authentication and the unlocked security
gate. Preview exits return to the app without changing either completion flag
or navigating to authentication. The floating coach is hidden during preview.
AsyncStorage key `ts_product_intro_v1` is set to `1` after Get Started, Skip, or
the sign-in action. Existing `ts_onboarding_completed=true` also bypasses the
introduction, without changing or deleting that account-setup flag. Storage
failures are actionable and never claim completion. The current intro route stays
mounted while saving/navigating so persistence cannot unmount the CTA before its
authentication destination is selected. A completed direct intro link redirects
to login; Android Back cannot return to it after leaving.

Get Started replaces the route with `/auth?mode=signup`. Skip and “I already have
an account” use `/auth?mode=login`. `app/auth.tsx` only reads that initial mode;
its registration, login requests, validation, token handling, and account setup
remain unchanged. Goals, employment, secure six-digit PIN setup and “You're all
set” remain in the existing onboarding folder. Android Back moves to the previous
introduction page; at the first page it uses normal OS back behavior. An incomplete
visit is not marked as skipped just because the app closes.

Safe-area-aware controls have at least 44-point targets. Main text follows system
font size and pages can scroll vertically at large text sizes or short heights.
Decorative preview labels keep their proportions and are exposed as a single
descriptive illustration to screen readers; offscreen pages are hidden from the
accessibility tree. Real navigation is separate from decorative mock cards.

Run `node src/onboarding/intro.test.cjs` for persistence, legacy-account bypass,
failed read/write handling, and auth-route contract checks. The repository's
existing ESLint configuration is reused; its missing development packages were
restored for validation. Whole-project TypeScript currently includes the existing
inactive `appp` copy, with its two unrelated absoluteFillObject errors.
The onboarding files and auth entry pass ESLint; linting the root layout also
reports its existing icon-loader effect update and JSX apostrophe errors.

Physical-device acceptance remains required: fresh app data opens the story;
existing signed-in/completed users bypass it; swipe/Next/progress/Skip/Back all
work; both CTAs select the proper auth tab; completion survives restart; safe
areas, large fonts, screen readers, reduce motion, landscape/tablet resizing,
background/resume and touch feel remain correct. Measure frame rate on supported
Android/iOS hardware; a bundle export does not establish 60 FPS. Use fresh test
app data rather than deleting a real user's preferences or secure PIN.
