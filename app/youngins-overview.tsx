import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text } from "react-native";
import { BudgetButton, BudgetCard, BudgetCopy, BudgetFrame, ui } from "../components/BudgetUI";
import { younginsApi } from "../src/youngins/api";
import { useYounginsResource } from "../src/youngins/hooks";
import { ageOn } from "../src/youngins/model";
export default function YounginsOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useYounginsResource(request => {
    if (typeof id !== "string" || !id.trim()) throw new Error("Select a Youngins profile to continue.");
    return younginsApi.get(id, request);
  }, id);
  const { theme, data: profile } = client;
  return <BudgetFrame title="Youngins Account" theme={theme} backTo="/youngins" backLabel="Youngins">
    {client.loading ? <ActivityIndicator color={theme.accent} />
      : client.error ? <BudgetCard theme={theme}><BudgetCopy theme={theme} error>{client.error}</BudgetCopy><BudgetButton theme={theme} title="Try again" onPress={client.retry} /></BudgetCard>
      : profile ? <>
        <BudgetCard theme={theme}>
          <Text style={[ui.heading, { color: theme.textPrimary }]}>{profile.firstName} {profile.lastName}</Text>
          <BudgetCopy theme={theme}>Age {ageOn(profile.dateOfBirth)}</BudgetCopy>
          <BudgetCopy theme={theme}>Managed through your signed-in guardian account.</BudgetCopy>
          <BudgetCopy theme={theme}>Declared relationship: {profile.guardianRelationship}</BudgetCopy>
        </BudgetCard>
        <BudgetCopy theme={theme}>This is a guardian-managed profile. No wallet, bank account or account number has been provisioned.</BudgetCopy>
        <BudgetCopy theme={theme}>Profile editing is not available yet.</BudgetCopy>
      </> : null}
  </BudgetFrame>;
}
