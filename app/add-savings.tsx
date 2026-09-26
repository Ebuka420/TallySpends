import { Redirect } from "expo-router";
import React from "react";
export default function AddSavingsScreen() {
  return <Redirect href="/savings-lock?mode=personal" />;
}
