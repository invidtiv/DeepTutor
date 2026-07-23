"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

import type { CodeBlockThemeId } from "@/components/common/code-block-themes";
import { CODE_BLOCK_THEME_OPTIONS } from "@/components/common/code-block-themes";
import { Toggle } from "@/components/settings/Toggle";
import { useSettings } from "@/components/settings/SettingsContext";
import { ThemePreviewCard } from "@/components/settings/ThemePreviewCard";
import {
  CODE_BLOCK_SETTINGS_EVENT,
  CODE_BLOCK_SHOW_LINE_NUMBERS_STORAGE_KEY,
  CODE_BLOCK_WRAP_LONG_LINES_STORAGE_KEY,
  readStoredCodeBlockShowLineNumbers,
  readStoredCodeBlockWrapLongLines,
} from "@/context/app-shell-storage";
import {
  SettingRow,
  SettingSection,
  SettingsPageHeader,
  selectClass,
  selectOptionClass,
} from "@/components/settings/shared";

const CODE_BLOCK_PREVIEW_SNIPPET = `def fibonacci(n):
    """Generate the first n Fibonacci numbers."""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result


# Build a deliberately long summary so the wrapping preference is easy to see
summary = f"First twenty Fibonacci values rendered with the selected syntax theme, line-number setting, and wrapping preference: {', '.join(str(value) for value in fibonacci(20))}"
print(summary)
`;

const RichCodeBlockPreview = dynamic(
  () => import("@/components/common/RichCodeBlock"),
  { ssr: false },
);

export default function AppearanceSettingsPage() {
  const { t } = useTranslation();
  const {
    theme,
    language,
    codeBlockTheme,
    updateTheme,
    updateLanguage,
    updateCodeBlockTheme,
    updateCodeBlockShowLineNumbers,
    updateCodeBlockWrapLongLines,
  } = useSettings();
  const [showLineNumbersChecked, setShowLineNumbersChecked] = useState(false);
  const [wrapLongLinesChecked, setWrapLongLinesChecked] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => {
      setShowLineNumbersChecked(readStoredCodeBlockShowLineNumbers());
      setWrapLongLinesChecked(readStoredCodeBlockWrapLongLines());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === CODE_BLOCK_SHOW_LINE_NUMBERS_STORAGE_KEY) {
        setShowLineNumbersChecked(readStoredCodeBlockShowLineNumbers());
      }
      if (event.key === CODE_BLOCK_WRAP_LONG_LINES_STORAGE_KEY) {
        setWrapLongLinesChecked(readStoredCodeBlockWrapLongLines());
      }
    };

    const onCodeBlockSettings = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          codeBlockShowLineNumbers?: boolean;
          codeBlockWrapLongLines?: boolean;
        }>
      ).detail;
      if (detail?.codeBlockShowLineNumbers !== undefined) {
        setShowLineNumbersChecked(Boolean(detail.codeBlockShowLineNumbers));
      }
      if (detail?.codeBlockWrapLongLines !== undefined) {
        setWrapLongLinesChecked(Boolean(detail.codeBlockWrapLongLines));
      }
    };

    syncFromStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener(CODE_BLOCK_SETTINGS_EVENT, onCodeBlockSettings);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        CODE_BLOCK_SETTINGS_EVENT,
        onCodeBlockSettings,
      );
    };
  }, []);

  const handleShowLineNumbersChange = (next: boolean) => {
    setShowLineNumbersChecked(next);
    void updateCodeBlockShowLineNumbers(next);
  };

  const handleWrapLongLinesChange = (next: boolean) => {
    setWrapLongLinesChecked(next);
    void updateCodeBlockWrapLongLines(next);
  };

  return (
    <div data-tour="tour-appearance">
      <SettingsPageHeader
        title={t("Appearance")}
        description={t(
          "Tune the visual theme and interface language. Changes apply immediately and are stored in your account.",
        )}
      />

      <SettingSection
        title={t("Language")}
        description={t("Choose the interface language.")}
      >
        <SettingRow
          title={t("Interface language")}
          description={t(
            "Affects the UI only. Model output language is controlled by your prompt.",
          )}
          control={
            <div className="flex gap-0.5 rounded-lg bg-[var(--muted)] p-0.5">
              {(["en", "zh"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => updateLanguage(v)}
                  className={`rounded-md px-2.5 py-1 text-[12px] transition-all ${
                    language === v
                      ? "bg-[var(--card)] font-medium text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {v === "en" ? t("language.english") : t("language.chinese")}
                </button>
              ))}
            </div>
          }
        />
      </SettingSection>

      <SettingSection
        title={t("Theme")}
        description={t(
          "Pick the colour palette and interface style. Each tile previews the theme it applies.",
        )}
      >
        <div className="py-4">
          {/* Order is intentional: Default (pure-white neutral, the default
              selection; theme id "snow" kept for stored preferences) →
              warm-light Cream → warm-dark Dark → cool-dark Glass. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { id: "snow", label: t("Default") },
                { id: "light", label: t("Cream") },
                { id: "dark", label: t("Dark") },
                { id: "glass", label: t("Glass") },
              ] as const
            ).map(({ id, label }) => (
              <ThemePreviewCard
                key={id}
                theme={id}
                label={label}
                selected={theme === id}
                onSelect={updateTheme}
              />
            ))}
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--muted-foreground)]/80">
            {t(
              "Default is a clean pure-white theme with a blue accent. Cream is warm and paper-like with a terracotta accent. Dark keeps Cream's warmth on near-black. Glass adds translucent purple panels on a deep gradient.",
            )}
          </p>
        </div>
      </SettingSection>

      <SettingSection
        title={t("Code blocks")}
        description={t(
          "Choose how code snippets look across the app. Changes apply immediately to saved and streamed responses.",
        )}
      >
        <div className="border-t border-[var(--border)]/50 px-1 py-4 first:border-t-0">
          <div className="text-[13.5px] font-medium text-[var(--foreground)]">
            {t("Preview")}
          </div>
          <p className="mb-3 mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            {t("Updates live as you change the settings below.")}
          </p>
          <RichCodeBlockPreview
            raw={CODE_BLOCK_PREVIEW_SNIPPET}
            lang="python"
          />
        </div>

        <SettingRow
          title={t("Syntax theme")}
          description={t(
            "Select the Prism theme used for highlighted code blocks.",
          )}
          control={
            <select
              value={codeBlockTheme}
              onChange={(event) =>
                void updateCodeBlockTheme(
                  event.target.value as CodeBlockThemeId,
                )
              }
              className={`${selectClass} min-w-[220px] pr-8`}
            >
              {CODE_BLOCK_THEME_OPTIONS.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  className={selectOptionClass}
                >
                  {option.label}
                </option>
              ))}
            </select>
          }
        />

        <SettingRow
          title={t("Show line numbers")}
          description={t(
            "Display a gutter with line numbers beside each code block.",
          )}
          control={
            <Toggle
              checked={showLineNumbersChecked}
              onChange={handleShowLineNumbersChange}
            />
          }
        />

        <SettingRow
          title={t("Wrap long lines")}
          description={t(
            "Wrap long code lines instead of forcing horizontal scrolling.",
          )}
          control={
            <Toggle
              checked={wrapLongLinesChecked}
              onChange={handleWrapLongLinesChange}
            />
          }
        />
      </SettingSection>
    </div>
  );
}
