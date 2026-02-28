'use client';

import { useTranslation as useTranslationOriginal } from 'react-i18next';

/**
 * Re-export useTranslation for convenience and potential future wrapping
 */
export const useTranslation = useTranslationOriginal;

/**
 * Re-export the initialized i18n instance
 */
export { default as i18n } from './i18n';
