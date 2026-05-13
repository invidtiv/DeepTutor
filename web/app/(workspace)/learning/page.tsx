"use client";

import { useTranslation } from "react-i18next";
import { Lightbulb } from "lucide-react";

export default function LearningPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Lightbulb className="w-16 h-16 text-[var(--primary)] mb-4" />
      <h1 className="text-2xl font-bold mb-2">Guided Learning</h1>
      <p className="text-[var(--muted-foreground)]">
        Framework v1.8.2 — structured mastery-based learning
      </p>
    </div>
  );
}
