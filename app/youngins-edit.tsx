import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert } from "react-native";
import { BudgetButton, BudgetCard, BudgetCopy, BudgetFrame } from "../components/BudgetUI";
import YounginsForm, { younginsBrand } from "../components/YounginsForm";
import { createSubmissionGate, younginsApi } from "../src/youngins/api";
import { useYounginsResource } from "../src/youngins/hooks";
import { validateDraft, type FieldErrors, type YounginsDraft } from "../src/youngins/model";
export default function YounginsEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const client = useYounginsResource(request => {
    if (typeof id !== "string" || !id.trim()) throw new Error("Select a Youngins profile to continue.");
    return younginsApi.get(id, request);
  }, id);
  const [draft, setDraft] = useState<YounginsDraft>({ firstName: "", lastName: "", dateOfBirth: "", guardianRelationship: "", nin: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const gate = useRef(createSubmissionGate());
  const active = useRef(true);
  const key = useRef(`youngins-edit-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  useFocusEffect(useCallback(() => { active.current = true; return () => { active.current = false; }; }, []));
  useEffect(() => {
    if (client.data) {
      const p = client.data;
      setDraft({ firstName: p.firstName, lastName: p.lastName, dateOfBirth: p.dateOfBirth, guardianRelationship: p.guardianRelationship, nin: "" });
    }
  }, [client.data]);
  const change = (field: keyof YounginsDraft, value: string) => {
    if (gate.current.busy || gate.current.completed) return;
    if (draft[field] === value) return;
    key.current = `youngins-edit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setError(null);
  };
  const save = async () => {
    if (gate.current.busy || gate.current.completed || !client.data) return;
    const nextErrors = validateDraft(draft, undefined, false);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setError(null);
    try {
      const profile = await gate.current.run(() => client.run(request => younginsApi.update(client.data!.id, draft, key.current, request)), setSaving);
      if (!profile) return;
      if (active.current) Alert.alert("Saved", "Youngins profile updated.", [{ text: "Continue", onPress: () => {
        if (active.current) router.replace({ pathname: "/youngins-overview", params: { id: profile.id } });
      } }], { cancelable: false });
    } catch (failure) {
      if (active.current) setError(failure instanceof Error ? failure.message : "Couldn't update this profile. Please try again.");
    }
  };
  const { theme, themeMode } = client;
  return <BudgetFrame title="Edit Youngins Profile" theme={theme} backTo="/youngins" backLabel="Youngins">
    {client.loading ? <ActivityIndicator color={theme.accent} />
      : client.error ? <BudgetCard theme={theme}><BudgetCopy theme={theme} error>{client.error}</BudgetCopy><BudgetButton theme={theme} title="Try again" onPress={client.retry} /></BudgetCard>
      : client.data ? <>
        <BudgetCard theme={theme}><YounginsForm draft={draft} errors={errors} onChange={change}
          onBlur={field => setErrors(current => ({ ...current, [field]: validateDraft(draft, undefined, false)[field] }))}
          disabled={saving || gate.current.completed} theme={theme} themeMode={themeMode} includeNin={false} /></BudgetCard>
        <BudgetCopy theme={theme}>Profile editing is not supported by the backend yet. No changes can be saved.</BudgetCopy>
        {error && <BudgetCopy theme={theme} error>{error}</BudgetCopy>}
        {saving && <ActivityIndicator color={theme.accent} />}
        <BudgetButton title="Save Changes" theme={younginsBrand(theme)} disabled onPress={save} />
      </> : null}
  </BudgetFrame>;
}
