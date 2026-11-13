import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, AppState, View } from "react-native";
import { BudgetButton, BudgetCard, BudgetCopy, BudgetFrame } from "../components/BudgetUI";
import YounginsForm, { younginsBrand } from "../components/YounginsForm";
import { createSubmissionGate, younginsApi } from "../src/youngins/api";
import { useYounginsResource } from "../src/youngins/hooks";
import { validateDraft, type FieldErrors, type YounginsDraft } from "../src/youngins/model";

const emptyDraft: YounginsDraft = { firstName: "", lastName: "", dateOfBirth: "", guardianRelationship: "", nin: "" };
const newKey = () => `youngins-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export default function YounginsCreateScreen() {
  const router = useRouter();
  const client = useYounginsResource(younginsApi.notice);
  const { theme, themeMode, data: notice } = client;
  const [consented, setConsented] = useState(false);
  const [draft, setDraft] = useState<YounginsDraft>(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
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
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
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
  return <BudgetFrame title="Create a Youngins Account" theme={theme} backTo="/youngins" backLabel="Youngins">
    <BudgetCopy theme={theme}>A smarter financial start for your little one.</BudgetCopy>
    {createdId ? <BudgetCard theme={theme}>
      <BudgetCopy theme={theme}>Youngins account created successfully!</BudgetCopy>
      {error && <BudgetCopy theme={theme} error>{error}</BudgetCopy>}
      {submitting && <ActivityIndicator color={theme.accent} />}
      <BudgetButton theme={younginsBrand(theme)} title="Refresh and view Youngins profile" disabled={submitting} onPress={() => refreshAndOpen(createdId)} />
    </BudgetCard> : !consented || !notice ? <BudgetCard theme={theme}>
      {client.loading ? <><ActivityIndicator color={theme.accent} /><BudgetCopy theme={theme}>Loading privacy information…</BudgetCopy></>
        : client.error ? <><BudgetCopy theme={theme} error>{client.error}</BudgetCopy><BudgetButton theme={younginsBrand(theme)} title="Try again" onPress={client.retry} /></>
        : notice ? <>
          <BudgetCopy theme={theme}>{notice.notice}</BudgetCopy>
          <BudgetCopy theme={theme}>{notice.guardianDeclaration}</BudgetCopy>
          <BudgetCopy theme={theme}>By continuing, you agree to this notice (version {notice.version}). Your consent will be recorded when the profile is created. No child login or financial account will be created.</BudgetCopy>
          <BudgetButton theme={younginsBrand(theme)} title="Agree and continue" disabled={submitting || gate.current.completed} onPress={() => {
            consentVersion.current = notice.version; setConsented(true); setError(null);
          }} />
          <BudgetButton theme={theme} title="Cancel" secondary onPress={() => router.back()} />
        </> : null}
    </BudgetCard> : <>
      <BudgetCard theme={theme}>
        <YounginsForm draft={draft} errors={errors} onChange={change}
          onBlur={field => setErrors(current => ({ ...current, [field]: validateDraft(draft)[field] }))}
          disabled={submitting || gate.current.completed} theme={theme} themeMode={themeMode} />
      </BudgetCard>
      <BudgetCopy theme={theme}>Your child's NIN is masked here and cleared when you leave this page or the app goes into the background.</BudgetCopy>
      {error && <BudgetCopy theme={theme} error>{error}</BudgetCopy>}
      {submitting && <View accessibilityLiveRegion="polite"><ActivityIndicator color={theme.accent} /><BudgetCopy theme={theme}>Creating your Youngins profile…</BudgetCopy></View>}
      <BudgetButton title="Create Account" theme={younginsBrand(theme)} disabled={submitting || gate.current.completed} onPress={submit} />
    </>}
  </BudgetFrame>;
}
