import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Wallet } from "../src/budget/ledger";
import {
  buildPeopleDirectory,
  normalizeTag,
  publicPerson,
  safePhoto,
  searchPeople,
  type Person,
} from "../src/budget/people";
import { tallyTag } from "../src/budget/planning";
import type { ThemePalette } from "../src/theme";
import { BudgetCopy, ui } from "./BudgetUI";

export function usePlanningPeople(store: {
  budgetWallet: Wallet | null;
  profileTallyTag: string;
  profileFullName: string;
  profileImage: string | null;
}) {
  const [local, setLocal] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem("ts_registered_users")
      .then((raw) => {
        const data: unknown = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(data)) throw new Error("Invalid saved profiles");
        if (active) setLocal(data.map(publicPerson).filter(Boolean));
      })
      .catch(() => {
        if (active)
          setError(
            "Saved profiles are unavailable. You can still add an exact TallyTag.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const people = useMemo(
    () =>
      buildPeopleDirectory(store.budgetWallet, local, {
        tag: store.profileTallyTag,
        displayName: store.profileFullName,
        avatarUri: store.profileImage || undefined,
      }),
    [
      store.budgetWallet,
      store.profileTallyTag,
      store.profileFullName,
      store.profileImage,
      local,
    ],
  );
  const resolve = (tag: string): Person =>
    people.find((person) => person.tag === normalizeTag(tag)) || {
      tag: normalizeTag(tag),
    };
  return { people, resolve, loading, error };
}
export type PeopleDirectory = ReturnType<typeof usePlanningPeople>;

export function PersonAvatar({
  person,
  theme,
  size = 42,
}: {
  person: Person;
  theme: ThemePalette;
  size?: number;
}) {
  const [failed, setFailed] = useState<string>();
  const uri = safePhoto(person.avatarUri);
  const initials = (person.displayName || person.tag)
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <View
      accessibilityLabel={`${person.displayName || "@" + person.tag} profile picture`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.accentSoft,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Text
        style={{
          color: theme.accent,
          fontSize: size * 0.32,
          fontWeight: "800",
        }}
      >
        {initials || "?"}
      </Text>
      {uri && failed !== uri && (
        <Image
          source={{ uri }}
          onError={() => setFailed(uri)}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      )}
    </View>
  );
}
export function PersonRow({
  person,
  theme,
  detail,
  trailing,
}: {
  person: Person;
  theme: ThemePalette;
  detail?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={[ui.row, { gap: 11, minHeight: 52 }]}>
      <PersonAvatar person={person} theme={theme} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "700" }}
        >
          {person.displayName || `@${person.tag}`}
        </Text>
        <Text
          numberOfLines={2}
          style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 17 }}
        >
          {person.displayName
            ? `@${person.tag}${detail ? ` · ${detail}` : ""}`
            : detail || "Profile not connected"}
        </Text>
      </View>
      {trailing}
    </View>
  );
}
export function PeopleStrip({
  tags,
  directory,
  theme,
}: {
  tags: string[];
  directory: PeopleDirectory;
  theme: ThemePalette;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 14, paddingVertical: 3 }}
    >
      {tags.map((tag) => (
        <View key={tag} style={{ alignItems: "center", gap: 6 }}>
          <PersonAvatar
            person={directory.resolve(tag)}
            theme={theme}
            size={36}
          />
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
            @{tag}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
export function ParticipantsInput({
  tags,
  onChange,
  owner,
  theme,
  minimum = 1,
  directory,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  owner: string;
  theme: ThemePalette;
  minimum?: number;
  directory: PeopleDirectory;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const ownTag = normalizeTag(owner);
  const add = (value: string) => {
    try {
      const tag = tallyTag(value);
      if (tag === ownTag) throw new Error("You are already included.");
      if (tags.includes(tag))
        throw new Error("This person is already included.");
      if (tags.length >= 9) throw new Error("You can add up to 9 people.");
      onChange([...tags, tag]);
      setQuery("");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the TallyTag.");
    }
  };
  const results = searchPeople(directory.people, query).filter(
    (person) => person.tag !== ownTag && !tags.includes(person.tag),
  );
  const exact = normalizeTag(query);
  const manual =
    /^[a-z0-9][a-z0-9_.-]{2,29}$/.test(exact) &&
    exact !== ownTag &&
    !tags.includes(exact) &&
    !directory.people.some((person) => person.tag === exact);
  return (
    <View style={{ gap: 12 }}>
      <Text style={[ui.heading, { fontSize: 16, color: theme.textPrimary }]}>
        People
      </Text>
      <PersonRow
        theme={theme}
        person={directory.resolve(ownTag)}
        detail="You"
      />
      {tags.map((tag, index) => (
        <PersonRow
          key={tag}
          theme={theme}
          person={directory.resolve(tag)}
          detail={minimum > 1 ? `Payout turn ${index + 2}` : "Selected"}
          trailing={
            <View style={{ flexDirection: "row" }}>
              {minimum > 1 && index > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${tag} earlier`}
                  onPress={() => {
                    const next = [...tags];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    onChange(next);
                  }}
                  style={ui.back}
                >
                  <Ionicons name="arrow-up" size={17} color={theme.accent} />
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${tag}`}
                onPress={() => onChange(tags.filter((value) => value !== tag))}
                style={ui.back}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={21}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          }
        />
      ))}
      <View
        style={[
          ui.input,
          ui.row,
          {
            borderColor: theme.border,
            backgroundColor: theme.surfaceSoft,
            gap: 9,
            paddingVertical: 0,
          },
        ]}
      >
        <Ionicons name="search-outline" size={19} color={theme.textSecondary} />
        <TextInput
          accessibilityLabel="Search name or TallyTag"
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setError("");
          }}
          onSubmitEditing={() => {
            if (manual) add(query);
            else if (results.length === 1) add(results[0].tag);
          }}
          placeholder="Search name or @TallyTag"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            minHeight: 52,
            color: theme.textPrimary,
            fontSize: 14,
          }}
        />
        {query.length > 0 && (
          <Pressable
            accessibilityLabel="Clear search"
            onPress={() => setQuery("")}
            style={{ padding: 8 }}
          >
            <Ionicons name="close" color={theme.textSecondary} size={18} />
          </Pressable>
        )}
      </View>
      {directory.loading && <ActivityIndicator color={theme.accent} />}
      {query.trim() || (!tags.length && results.length > 0) ? (
        <View style={{ gap: 12 }}>
          <Text style={[ui.label, { color: theme.textSecondary }]}>
            {query ? "MATCHING SAVED PROFILES" : "SAVED PROFILES"}
          </Text>
          {results.slice(0, 6).map((person) => (
            <Pressable
              key={person.tag}
              accessibilityRole="button"
              accessibilityLabel={`Add ${person.displayName || person.tag}, @${person.tag}`}
              onPress={() => add(person.tag)}
            >
              <PersonRow
                theme={theme}
                person={person}
                trailing={
                  <Ionicons
                    name="add-circle-outline"
                    color={theme.accent}
                    size={25}
                  />
                }
              />
            </Pressable>
          ))}
          {manual && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add exact TallyTag ${exact}`}
              onPress={() => add(exact)}
            >
              <PersonRow
                person={{ tag: exact }}
                theme={theme}
                detail="Add by tag · profile unavailable"
                trailing={
                  <Ionicons
                    name="add-circle-outline"
                    size={25}
                    color={theme.accent}
                  />
                }
              />
            </Pressable>
          )}
          {!results.length && !manual && (
            <BudgetCopy theme={theme}>
              {exact === ownTag || tags.includes(exact)
                ? "Already included above."
                : "No saved profile matches. Enter the full TallyTag to add someone."}
            </BudgetCopy>
          )}
        </View>
      ) : null}
      {error || directory.error ? (
        <BudgetCopy theme={theme} error>
          {error || directory.error}
        </BudgetCopy>
      ) : null}
      <BudgetCopy theme={theme}>
        {tags.length < minimum
          ? `Choose at least ${minimum} ${minimum === 1 ? "person" : "people"}. `
          : ""}
        Local profiles only until user search is connected.
      </BudgetCopy>
    </View>
  );
}
