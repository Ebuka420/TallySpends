import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, AppState, Keyboard, Text, View } from "react-native";
import { BudgetButton, BudgetCard, BudgetCopy, BudgetFrame } from "../components/BudgetUI";
import YounginsForm, { younginsBrand } from "../components/YounginsForm";
import { createSubmissionGate, younginsApi } from "../src/youngins/api";
import { useYounginsResource } from "../src/youngins/hooks";
import { validateDraft, type FieldErrors, type PrivacyNotice, type YounginsDraft } from "../src/youngins/model";

const emptyDraft: YounginsDraft = { firstName: "", lastName: "", dateOfBirth: "", guardianRelationship: "", nin: "" };
const newKey = () => `youngins-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
const PREVIEW_NOTICE: PrivacyNotice = Object.freeze({ version: "preview-only", notice: "Developer preview only. This is not an approved privacy notice.", guardianDeclaration: "No consent is requested or recorded in preview mode.", ninCollectionEnabled: true });
type RegistrationStep = 1 | 2 | 3;
const stepFields: Record<1 | 2, (keyof YounginsDraft)[]> = {
  1: ["firstName", "lastName", "dateOfBirth"],
  2: ["guardianRelationship", "nin"],
};

export default function YounginsCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preview?: string }>();
  // A local-only screen preview lets developers inspect the registration UX
  // without fabricating guardian consent or sending child data to production.
  const previewMode = __DEV__ && params.preview === "true";
  const client = useYounginsResource(previewMode ? async () => PREVIEW_NOTICE : younginsApi.notice, previewMode ? "local-preview" : "production-notice");
  const { theme, themeMode, data: notice } = client;
  const [consented, setConsented] = useState(false);
  const [step, setStep] = useState<RegistrationStep>(1);
  const [draft, setDraft] = useState<YounginsDraft>(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [previewComplete, setPreviewComplete] = useState(false);
  const gate = useRef(createSubmissionGate());
  const active = useRef(true);
  const key = useRef(newKey());
  const consentVersion = useRef<string | null>(null);

  const refreshAndOpen = async (id: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const profiles = await client.run(younginsApi.list);
      if (!profiles.some(profile => profile.id === id)) throw new Error("Account created, but it hasn't appeared in your Youngins list yet. Refresh before continuing.");
      if (active.current) router.replace({ pathname: "/youngins-overview", params: { id } });
    } catch {
      if (active.current) setError("Account created, but we couldn't refresh your Youngins accounts. Try refreshing again; do not register again.");
    } finally { setSubmitting(false); }
  };

  useFocusEffect(useCallback(() => {
    active.current = true;
    return () => {
      active.current = false;
      client.cancel();
      setDraft(value => ({ ...value, nin: "" }));
      setConsented(false);
      setStep(1);
      consentVersion.current = null;
    };
  }, [client.cancel]));

  useEffect(() => {
    const listener = AppState.addEventListener("change", state => {
      if (state === "background") {
        active.current = false;
        client.cancel();
        setDraft(value => ({ ...value, nin: "" }));
        setConsented(false);
        setStep(1);
        consentVersion.current = null;
      } else if (state === "active") active.current = true;
    });
    return () => listener.remove();
  }, [client.cancel]);

  const change = (field: keyof YounginsDraft, value: string) => {
    if (gate.current.busy || gate.current.completed) return;
    if (draft[field] === value) return;
    key.current = newKey();
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setError(null);
  };

  const submit = async () => {
    if (gate.current.busy || gate.current.completed || !active.current) return;
    const nextErrors = validateDraft(draft, undefined, !previewMode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStep(stepFields[1].some(field => nextErrors[field]) ? 1 : 2);
      return;
    }
    if (previewMode) {
      // Never send preview data, NIN, or fabricated consent to the API.
      setDraft(emptyDraft);
      setPreviewComplete(true);
      setError(null);
      return;
    }
    if (!notice || !consented || consentVersion.current !== notice.version) { setError("Review and accept the privacy notice before continuing."); return; }
    setError(null);
    try {
      const profile = await gate.current.run(() => client.run(request => younginsApi.create(draft, notice,
        { accepted: consented, noticeVersion: consentVersion.current ?? "" }, key.current, request)), setSubmitting);
      if (!profile) return;
      setDraft(emptyDraft);
      setCreatedId(profile.id);
      if (!active.current) return;
      await refreshAndOpen(profile.id);
    } catch (failure) {
      if (active.current) setError(failure instanceof Error ? failure.message : "Couldn't create the Youngins profile. Please try again.");
    } finally {
      // Drop the entered NIN after every submission attempt, including failures.
      setDraft(value => ({ ...value, nin: "" }));
    }
  };

  const continueStep = () => {
    if (!consented || (!previewMode && (!notice || consentVersion.current !== notice?.version))) {
      setError("Review and accept the privacy notice before continuing.");
      return;
    }
    if (step === 3) { void submit(); return; }
    const allErrors = validateDraft(draft, undefined, !previewMode);
    const nextErrors = Object.fromEntries(stepFields[step].map(field => [field, allErrors[field]]).filter(([, message]) => !!message)) as FieldErrors;
    setErrors(current => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length) return;
    Keyboard.dismiss();
    setError(null);
    setStep((step + 1) as RegistrationStep);
  };

  const goBack = () => {
    if (submitting) return;
    setError(null);
    if (step > 1) setStep((step - 1) as RegistrationStep);
    else {
      setConsented(false);
      consentVersion.current = null;
    }
  };

  const dateLabel = () => {
    if (!draft.dateOfBirth) return "Not provided";
    const date = new Date(`${draft.dateOfBirth}T12:00:00`);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "Not provided";
  };

  const renderReview = () => <View style={{ gap: 4 }}>
    {[
      ["Child's name", `${draft.firstName.trim()} ${draft.lastName.trim()}`],
      ["Date of birth", dateLabel()],
      ["Your relationship", draft.guardianRelationship],
      ["NIN", previewMode ? (draft.nin ? "Entered · hidden in this preview" : "Not entered · preview only") : "Provided · hidden for your privacy"],
    ].map(([label, value]) => <View key={label} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 5 }}>{label}</Text>
      <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "600" }}>{value}</Text>
    </View>)}
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingTop: 12 }}>
      <Ionicons name="shield-checkmark-outline" size={19} color={theme.accent} />
      <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 }}>
        Your NIN is not shown on this review page. No child login, wallet, or bank account is created by this registration.
      </Text>
    </View>
  </View>;

  return <BudgetFrame title="Create a Youngins Account" theme={theme} backTo="/youngins" backLabel="Youngins">
    <BudgetCopy theme={theme}>A smarter financial start for your little one.</BudgetCopy>
    {previewMode && !consented && !previewComplete ? <BudgetCard theme={theme}>
      <BudgetCopy theme={theme}>Developer preview only. This is not the approved privacy notice, and continuing here does not record consent or create an account. Use synthetic details only. Nothing entered will be sent to the backend.</BudgetCopy>
      <BudgetButton theme={younginsBrand(theme)} title="Open registration preview" onPress={() => { setConsented(true); setError(null); setStep(1); }} />
      <BudgetButton theme={theme} title="Cancel" secondary onPress={() => router.back()} />
    </BudgetCard> : previewComplete ? <BudgetCard theme={theme}>
      <BudgetCopy theme={theme}>Preview complete. No Youngins account was created and no information was sent.</BudgetCopy>
      <BudgetButton theme={younginsBrand(theme)} title="Return to Youngins" onPress={() => router.replace("/youngins")} />
    </BudgetCard> : createdId ? <BudgetCard theme={theme}>
      <BudgetCopy theme={theme}>Youngins account created successfully!</BudgetCopy>
      {error && <BudgetCopy theme={theme} error>{error}</BudgetCopy>}
      {submitting && <ActivityIndicator color={theme.accent} />}
      <BudgetButton theme={younginsBrand(theme)} title="Refresh and view Youngins profile" disabled={submitting} onPress={() => refreshAndOpen(createdId)} />
    </BudgetCard> : !previewMode && (!consented || !notice) ? <BudgetCard theme={theme}>
      {client.loading ? <><ActivityIndicator color={theme.accent} /><BudgetCopy theme={theme}>Loading privacy information…</BudgetCopy></>
        : client.error ? <><BudgetCopy theme={theme} error>{client.error}</BudgetCopy><BudgetButton theme={younginsBrand(theme)} title="Try again" onPress={client.retry} /></>
        : notice ? <>
          <BudgetCopy theme={theme}>{notice.notice}</BudgetCopy>
          <BudgetCopy theme={theme}>{notice.guardianDeclaration}</BudgetCopy>
          <BudgetCopy theme={theme}>By continuing, you agree to this notice (version {notice.version}). Your consent will be recorded when the profile is created. No child login or financial account will be created.</BudgetCopy>
          <BudgetButton theme={younginsBrand(theme)} title="I have read and agree" disabled={submitting || gate.current.completed} onPress={() => {
            consentVersion.current = notice.version; setConsented(true); setError(null); setStep(1);
          }} />
          <BudgetButton theme={theme} title="Cancel" secondary onPress={() => router.back()} />
        </> : null}
    </BudgetCard> : <>
      <View accessibilityRole="progressbar" accessibilityLabel={`Registration step ${step} of 3`} style={{ gap: 9, paddingVertical: 8 }}>
        <View style={{ flexDirection: "row", gap: 7 }}>
          {[1, 2, 3].map(item => <View key={item} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: item <= step ? theme.accent : theme.border }} />)}
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>STEP {step} OF 3 · {(["CHILD'S DETAILS", "GUARDIAN DETAILS", "REVIEW"] as const)[step - 1]}</Text>
      </View>
      <BudgetCard theme={theme}>
        {previewMode && <BudgetCopy theme={theme}>Developer preview · synthetic details only · no data is submitted.</BudgetCopy>}
        <Text accessibilityRole="header" style={{ color: theme.textPrimary, fontSize: 19, fontWeight: "700", marginBottom: 6 }}>
          {step === 1 ? "About your child" : step === 2 ? "Your relationship" : "Review details"}
        </Text>
        <BudgetCopy theme={theme}>
          {step === 1 ? "Enter your child's name and date of birth." : step === 2 ? previewMode ? "Explore the guardian details form. Do not enter real identity information in this preview." : "Tell us your relationship and provide the required NIN." : previewMode ? "Review the preview details. No profile will be created." : "Check the profile details before creating the account."}
        </BudgetCopy>
        {step === 3 ? renderReview() : <YounginsForm draft={draft} errors={errors} onChange={change}
          onBlur={field => setErrors(current => ({ ...current, [field]: validateDraft(draft, undefined, !previewMode)[field] }))}
          disabled={submitting || gate.current.completed} theme={theme} themeMode={themeMode}
          step={step === 1 ? "child" : "guardian"} />}
      </BudgetCard>
      {step === 2 && <BudgetCopy theme={theme}>{previewMode ? "Use synthetic details only. NIN is optional in this local preview, is never sent, and is cleared when you leave the screen or background the app." : "The NIN field is masked. It will not appear on the review page and is cleared when you leave this screen or the app goes into the background."}</BudgetCopy>}
      {error && <BudgetCopy theme={theme} error>{error}</BudgetCopy>}
      {submitting && <View accessibilityLiveRegion="polite"><ActivityIndicator color={theme.accent} /><BudgetCopy theme={theme}>Creating your Youngins profile…</BudgetCopy></View>}
      <View style={{ gap: 10 }}>
        <BudgetButton title={step === 3 ? previewMode ? "Finish preview (no account created)" : "Create Account" : "Continue"} theme={younginsBrand(theme)} disabled={submitting || gate.current.completed} onPress={continueStep} />
        <BudgetButton title={step === 1 ? "Back to privacy notice" : "Back"} theme={theme} secondary disabled={submitting} onPress={goBack} />
      </View>
    </>}
  </BudgetFrame>;
}
