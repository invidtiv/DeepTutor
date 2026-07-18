import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { readStoredCodeBlockShowLineNumbers, readStoredCodeBlockWrapLongLines, writeStoredCodeBlockShowLineNumbers, writeStoredCodeBlockWrapLongLines } from "@/context/app-shell-storage";

const settingsContextPath = path.join(
  process.cwd(),
  "components",
  "settings",
  "SettingsContext.tsx",
);

function readSettingsContextSource() {
  return fs.readFileSync(settingsContextPath, "utf8");
}

function mockWindow() {
  global.window = {
    localStorage: {
      getItem: (key: string) => (global.window as any).localStorage._storage[key] ?? null,
      setItem: (key: string, value: string) => {
        (global.window as any).localStorage._storage[key] = value;
      },
      removeItem: (key: string) => {
        delete (global.window as any).localStorage._storage[key];
      },
    },
    dispatchEvent: () => true,
  } as any;
  (global.window as any).localStorage._storage = {};
}

test("readStoredCodeBlockShowLineNumbers returns true when localStorage has string 'true'", () => {
  mockWindow();
  writeStoredCodeBlockShowLineNumbers(true);
  assert.equal(readStoredCodeBlockShowLineNumbers(), true);
});

test("readStoredCodeBlockWrapLongLines returns true when localStorage has string 'true'", () => {
  mockWindow();
  writeStoredCodeBlockWrapLongLines(true);
  assert.equal(readStoredCodeBlockWrapLongLines(), true);
});

test("readStoredCodeBlockShowLineNumbers returns false when localStorage is undefined (SSR)", () => {
  (global.window as any) = undefined as any;
  assert.equal(readStoredCodeBlockShowLineNumbers(), false, "Should return default false when window is undefined");
});

test("readStoredCodeBlockWrapLongLines returns false when localStorage is undefined (SSR)", () => {
  (global.window as any) = undefined as any;
  assert.equal(readStoredCodeBlockWrapLongLines(), false, "Should return default false when window is undefined");
});

test("settings-context: code-block boolean switches hydrate after first render", () => {
  const source = readSettingsContextSource();

  assert.doesNotMatch(
    source,
    /useState<\s*UiSettings\["code_block_show_line_numbers"\]\s*>\(\(\) =>\s*readStoredCodeBlockShowLineNumbers\(\)\s*\)/,
    "Show line numbers must not read localStorage during the first render, or React can keep the server-rendered aria-checked=false DOM after reload.",
  );
  assert.doesNotMatch(
    source,
    /useState<\s*UiSettings\["code_block_wrap_long_lines"\]\s*>\(\(\) =>\s*readStoredCodeBlockWrapLongLines\(\)\s*\)/,
    "Wrap long lines must not read localStorage during the first render, or React can keep the server-rendered aria-checked=false DOM after reload.",
  );
  assert.match(
    source,
    /setCodeBlockShowLineNumbers\(\s*readStoredCodeBlockShowLineNumbers\(\)\s*\)/,
    "Show line numbers should re-read localStorage after mount so persisted true forces a DOM update.",
  );
  assert.match(
    source,
    /setCodeBlockWrapLongLines\(\s*readStoredCodeBlockWrapLongLines\(\)\s*\)/,
    "Wrap long lines should re-read localStorage after mount so persisted true forces a DOM update.",
  );
});
