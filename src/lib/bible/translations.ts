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
];

export function getTranslation(id?: string | null): TranslationOption {
  const requested = id ?? APP_CONFIG.DEFAULT_TRANSLATION;
  return (
    TRANSLATIONS.find((translation) => translation.id === requested) ??
    TRANSLATIONS[0]
  );
}
