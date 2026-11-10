import test from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  TRANSLATIONS,
  normalizeLocale,
  getDirection,
  translate,
  translatePhrase,
} from "./translations.js";

function collectLeafKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") {
      keys.push(...collectLeafKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

test("normalizeLocale resolves supported locales and falls back to fr", () => {
  assert.equal(normalizeLocale("fr"), "fr");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("AR-TN"), "ar");
  assert.equal(normalizeLocale("de"), DEFAULT_LOCALE);
  assert.equal(normalizeLocale(null), DEFAULT_LOCALE);
});

test("getDirection returns rtl for Arabic and ltr for French and English", () => {
  assert.equal(getDirection("ar"), "rtl");
  assert.equal(getDirection("fr"), "ltr");
  assert.equal(getDirection("en"), "ltr");
});

test("all supported locales have identical translation key trees", () => {
  const frKeys = collectLeafKeys(TRANSLATIONS.fr);
  for (const locale of SUPPORTED_LOCALES) {
    const localeKeys = collectLeafKeys(TRANSLATIONS[locale]);
    assert.deepEqual(localeKeys, frKeys, `Key mismatch in locale: ${locale}`);
  }
});

test("translate resolves keys in en, fr, ar and interpolates parameters", () => {
  assert.equal(
    translate("fr", "dashboard.welcomeTitle", { name: "Youssef" }),
    "Bonjour, Youssef"
  );
  assert.equal(
    translate("en", "dashboard.welcomeTitle", { name: "Youssef" }),
    "Hello, Youssef"
  );
  assert.equal(
    translate("ar", "dashboard.welcomeTitle", { name: "يوسف" }),
    "مرحباً، يوسف"
  );
});

test("translatePhrase maps common French UI phrases into English and Arabic", () => {
  assert.equal(translatePhrase("fr", "Tableau de bord"), "Tableau de bord");
  assert.equal(translatePhrase("en", "Tableau de bord"), "Dashboard");
  assert.equal(translatePhrase("ar", "Tableau de bord"), "لوحة القيادة");
  assert.equal(translatePhrase("en", "Diagnostic de messagerie (SMTP)"), "Email diagnostics (SMTP)");
  assert.equal(translatePhrase("ar", "Administrateur"), "مسؤول");
  assert.equal(translatePhrase("en", "Tous les rôles"), "All roles");
});
