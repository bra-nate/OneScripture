import { APP_CONFIG } from "@/config/app";

export type TranslationOption = {
  id: string;
  label: string;
  languageCode: string;
  note?: string;
};

export const TRANSLATIONS: TranslationOption[] = [
  {
    id: "ENGESV",
    label: "English Standard Version",
    languageCode: "eng",
  },
  {
    id: "ENGKJV",
    label: "King James Version",
    languageCode: "eng",
  },
  {
    id: "ENGNIV",
    label: "New International Version",
    languageCode: "eng",
    note: "Availability depends on Bible.is licensing.",
  },
];

export function getTranslation(id?: string | null): TranslationOption {
  const requested = id ?? APP_CONFIG.DEFAULT_TRANSLATION;
  return (
    TRANSLATIONS.find((translation) => translation.id === requested) ??
    TRANSLATIONS[0]
  );
}

export function translationSelectOptions() {
  return TRANSLATIONS.map((translation) => ({
    value: translation.id,
    label: translation.id.replace(/^ENG/, ""),
  }));
}
