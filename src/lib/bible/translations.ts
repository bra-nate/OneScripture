import { APP_CONFIG } from "@/config/app";

export type TranslationOption = {
  id: string;
  label: string;
  languageCode: string;
  note?: string;
};

export const TRANSLATIONS: TranslationOption[] = [
  {
    id: "WEB",
    label: "World English Bible",
    languageCode: "eng",
  },
  {
    id: "KJV",
    label: "King James Version",
    languageCode: "eng",
    note: "Public domain outside the United Kingdom",
  },
  {
    id: "ASV",
    label: "American Standard Version",
    languageCode: "eng",
  },
];

export function getTranslation(id?: string | null): TranslationOption {
  const requested = id ?? APP_CONFIG.DEFAULT_TRANSLATION;
  const defaultTranslation =
    TRANSLATIONS.find(
      (translation) => translation.id === APP_CONFIG.DEFAULT_TRANSLATION,
    ) ?? TRANSLATIONS[0];
  return (
    TRANSLATIONS.find((translation) => translation.id === requested) ??
    defaultTranslation
  );
}
