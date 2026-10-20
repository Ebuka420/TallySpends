import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image } from "react-native";
import { bankLogo, type BankIdentity } from "../src/data/banks";

export default function BankLogo({ bank, size, color, fallbackSize = size }: { bank: BankIdentity; size: number; color: string; fallbackSize?: number }) {
  const source = bankLogo(bank);
  const [failedSource, setFailedSource] = useState<typeof source>();
  if (!source || source === failedSource) return <Ionicons name="business-outline" size={fallbackSize} color={color} />;
  return <Image source={source} resizeMode="contain" accessible={false}
    onError={() => setFailedSource(source)}
    style={{ width: size, height: size, backgroundColor: "#FFFFFF" }} />;
}
