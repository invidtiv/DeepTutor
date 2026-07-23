import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { CODE_BLOCK_THEME_OPTIONS } from "../components/common/code-block-themes";

const appearancePagePath = path.join(
  process.cwd(),
  "app",
  "(utility)",
  "settings",
  "appearance",
  "page.tsx",
);

function readAppearancePage() {
  return fs.readFileSync(appearancePagePath, "utf8");
}

test("appearance settings page: adds the code blocks section after the theme section", () => {
  const source = readAppearancePage();

  const themeIndex = source.indexOf('title={t("Theme")}');
  const codeBlocksIndex = source.indexOf('title={t("Code blocks")}');

  assert.notEqual(themeIndex, -1, "Theme section should exist");
  assert.notEqual(codeBlocksIndex, -1, "Code blocks section should exist");
  assert.ok(
    codeBlocksIndex > themeIndex,
    "Code blocks section should come after Theme",
  );
});

test("appearance settings page: wires syntax theme select and toggle controls to settings context", () => {
  const source = readAppearancePage();

  assert.match(source, /codeBlockTheme/);
  assert.match(source, /updateCodeBlockTheme/);
  assert.match(source, /codeBlockShowLineNumbers/);
  assert.match(source, /updateCodeBlockShowLineNumbers/);
  assert.match(source, /codeBlockWrapLongLines/);
  assert.match(source, /updateCodeBlockWrapLongLines/);
  assert.match(source, /CODE_BLOCK_THEME_OPTIONS/);
  assert.match(source, /<Toggle/);
});

test("appearance settings page: renders code-block switch checked state from app-shell storage", () => {
  const source = readAppearancePage();

  assert.match(
    source,
    /readStoredCodeBlockShowLineNumbers/,
    "Code-block switches must hydrate from app-shell storage so reloaded localStorage true values render checked.",
  );
  assert.match(
    source,
    /checked=\{showLineNumbersChecked\}/,
    "Show line numbers switch should render from page-local storage-hydrated state, not the SettingsContext default false initializer.",
  );
  assert.match(
    source,
    /checked=\{wrapLongLinesChecked\}/,
    "Wrap long lines switch should render from page-local storage-hydrated state, not the SettingsContext default false initializer.",
  );
});

test("appearance settings page: exposes every registered code block theme option in the select", () => {
  const source = readAppearancePage();

  assert.ok(CODE_BLOCK_THEME_OPTIONS.length > 0);
  assert.match(source, /CODE_BLOCK_THEME_OPTIONS\.map/);
});

test("appearance settings page: preview includes a line long enough to demonstrate wrapping", () => {
  const source = readAppearancePage();
  const previewSource =
    source.match(/const CODE_BLOCK_PREVIEW_SNIPPET = `([\s\S]*?)`;/)?.[1] ?? "";

  assert.ok(previewSource, "The fixed Python preview snippet should exist");
  assert.ok(
    previewSource.split("\n").some((line) => line.length >= 120),
    "The preview needs a 120+ character line so Wrap long lines has a visible effect",
  );
});
