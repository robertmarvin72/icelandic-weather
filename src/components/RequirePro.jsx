// src/components/RequirePro.jsx
import React from "react";
import { useEntitlements } from "../hooks/useEntitlements";

export default function RequirePro({ children, fallback = null }) {
  const { isPro } = useEntitlements();
  return isPro ? children : fallback;
}
