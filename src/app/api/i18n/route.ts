import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { logSecurityEvent } from '@/lib/server/security-audit';
import { Roles, RoleType } from '@/constants/roles';
import {
  translations, 
  defaultLanguage, 
  supportedLanguages, 
  getTranslation, 
  isLanguageSupported,
  getLanguageFromLocale,
  Language,
  TranslationKeys
} from '@/lib/i18n/translations';

/**
 * Internationalization (i18n) API
 * Handles language switching and translation requests
 * Provides multi-language support for the CRM system
 */

export async function GET(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        const { searchParams } = new URL(request.url);
        
        const language = searchParams.get('lang') as Language;
        const namespace = searchParams.get('namespace') || 'common';
        const keys = searchParams.get('keys')?.split(',') || [];
        
        // Get user's preferred language from database or use default
        let targetLanguage = defaultLanguage;
        
        if (language && isLanguageSupported(language)) {
          targetLanguage = language;
        } else {
          // Try to get user's language preference
          const userRecord = await withTimeout(
            prisma.user.findUnique({
              where: { id: user.id },
              select: { language: true, locale: true }
            }),
            5000
          );
          
          if (userRecord?.language && isLanguageSupported(userRecord.language)) {
            targetLanguage = userRecord.language;
          } else if (userRecord?.locale) {
            targetLanguage = getLanguageFromLocale(userRecord.locale);
          }
        }
        
        // Get translations
        const translationData = getTranslation(targetLanguage);
        
        // Return specific keys if requested
        if (keys.length > 0) {
          const specificTranslations: any = {};
          keys.forEach(key => {
            const keysParts = key.split('.');
            let value: any = translationData;
            
            for (const part of keysParts) {
              value = value?.[part];
            }
            
            if (value !== undefined) {
              specificTranslations[key] = value;
            }
          });
          
          return createCompressedResponse({
            success: true,
            data: {
              language: targetLanguage,
              translations: specificTranslations,
              namespace,
              requestedKeys: keys
            }
          });
        }
        
        // Return full namespace or all translations
        let responseData: any;
        
        if (namespace === 'all') {
          responseData = translationData;
        } else if (translationData[namespace as keyof TranslationKeys]) {
          responseData = { [namespace]: translationData[namespace as keyof TranslationKeys] };
        } else {
          responseData = { common: translationData.common };
        }
        
        return createCompressedResponse({
          success: true,
          data: {
            language: targetLanguage,
            translations: responseData,
            namespace,
            supportedLanguages,
            defaultLanguage,
            isRTL: isLanguageRTL(targetLanguage)
          }
        });
        
      } catch (error) {
        console.error('i18n error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get translations'
        }, 500);
      }
    }), { endpoint: 'i18n' }
  )(request);
}

export async function POST(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        const body = await request.json();
        
        const { action, language, preferences } = body;
        
        switch (action) {
          case 'set_language':
            if (!language || !isLanguageSupported(language)) {
              return createCompressedResponse({
                success: false,
                error: 'Invalid or unsupported language'
              }, 400);
            }
            
            // Update user's language preference
            await withTimeout(
              prisma.user.update({
                where: { id: user.id },
                data: { language }
              }),
              5000
            );
            
            await withTimeout(
              logSecurityEvent(request, {
                userId: user.id,
                email: user.email,
                action: 'LANGUAGE_CHANGED',
                meta: {
                  oldLanguage: (user as { language?: string | null }).language ?? defaultLanguage,
                  newLanguage: language
                }
              }),
              5000
            );
            
            return createCompressedResponse({
              success: true,
              data: {
                language,
                message: 'Language preference updated successfully'
              }
            });
            
          case 'set_preferences':
            // Update user's i18n preferences
            const updateData: any = {};
            
            if (preferences.language && isLanguageSupported(preferences.language)) {
              updateData.language = preferences.language;
            }
            
            if (preferences.locale) {
              updateData.locale = preferences.locale;
            }
            
            if (preferences.timezone) {
              updateData.timezone = preferences.timezone;
            }
            
            if (preferences.dateFormat) {
              updateData.dateFormat = preferences.dateFormat;
            }
            
            if (preferences.timeFormat) {
              updateData.timeFormat = preferences.timeFormat;
            }
            
            if (preferences.currency) {
              updateData.currency = preferences.currency;
            }
            
            if (Object.keys(updateData).length > 0) {
              await withTimeout(
                (prisma as any).user.update({
                  where: { id: user.id },
                  data: updateData
                }),
                5000
              );
            }
            
            return createCompressedResponse({
              success: true,
              data: {
                preferences: updateData,
                message: 'Preferences updated successfully'
              }
            });
            
          case 'detect_language':
            const text = body.text;
            if (!text) {
              return createCompressedResponse({
                success: false,
                error: 'Text is required for language detection'
              }, 400);
            }
            
            // Simple language detection based on common words
            const detectedLanguage = detectLanguageFromText(text);
            
            return createCompressedResponse({
              success: true,
              data: {
                detectedLanguage,
                confidence: 0.8, // Simplified confidence
                supported: isLanguageSupported(detectedLanguage)
              }
            });
            
          case 'translate':
            const sourceText = body.text;
            const sourceLang = body.fromLanguage || defaultLanguage;
            const targetLang = body.toLanguage || defaultLanguage;
            
            if (!sourceText) {
              return createCompressedResponse({
                success: false,
                error: 'Text is required for translation'
              }, 400);
            }
            
            if (!isLanguageSupported(sourceLang) || !isLanguageSupported(targetLang)) {
              return createCompressedResponse({
                success: false,
                error: 'Unsupported language'
              }, 400);
            }
            
            // For now, return the original text with a note
            // In production, integrate with a translation service
            const translatedText = sourceLang === targetLang ? sourceText : 
              `[${sourceLang} → ${targetLang}] ${sourceText}`;
            
            return createCompressedResponse({
              success: true,
              data: {
                originalText: sourceText,
                translatedText,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                confidence: 0.9
              }
            });
            
          default:
            return createCompressedResponse({
              success: false,
              error: 'Invalid action'
            }, 400);
        }
        
      } catch (error) {
        console.error('i18n action error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to perform i18n action'
        }, 500);
      }
    }), { endpoint: 'i18n-actions' }
  )(request);
}

export async function PUT(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        const body = await request.json();
        
        const { translations: customTranslations, language } = body;
        
        // Only admins can add custom translations
        if (user.role !== Roles.ADMIN) {
          return createCompressedResponse({
            success: false,
            error: 'Access denied - Admin privileges required'
          }, 403);
        }
        
        if (!customTranslations || !language) {
          return createCompressedResponse({
            success: false,
            error: 'Translations and language are required'
          }, 400);
        }
        
        // Store custom translations (in production, use a proper translation management system)
        const customTranslationRecord = (await withTimeout(
          (prisma as any).customTranslation.create({
            data: {
              language,
              translations: customTranslations,
              createdBy: user.id,
              isActive: true
            }
          }),
          5000
        )) as { id: string };
        
        return createCompressedResponse({
          success: true,
          data: {
            id: customTranslationRecord.id,
            language,
            translationsCount: Object.keys(customTranslations).length,
            message: 'Custom translations added successfully'
          }
        }, 201);
        
      } catch (error) {
        console.error('Custom translations error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add custom translations'
        }, 500);
      }
    }), { endpoint: 'custom-translations' }
  )(request);
}

// Helper functions
function isLanguageRTL(language: Language): boolean {
  // Add RTL languages here
  const rtlLanguages: Language[] = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
}

function detectLanguageFromText(text: string): Language {
  // Simple language detection based on common words
  const textLower = text.toLowerCase();
  
  // English indicators
  if (/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/.test(textLower)) {
    return 'en';
  }
  
  // Spanish indicators
  if (/\b(el|la|y|o|pero|en|de|para|con|por)\b/.test(textLower)) {
    return 'es';
  }
  
  // French indicators
  if (/\b(le|la|et|ou|mais|dans|de|pour|avec|par)\b/.test(textLower)) {
    return 'fr';
  }
  
  // Default to English
  return defaultLanguage;
}

// Utility function to format dates based on language
export function formatDateByLanguage(date: Date, language: Language, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat(language, defaultOptions).format(date);
}

// Utility function to format numbers based on language
export function formatNumberByLanguage(number: number, language: Language, options?: Intl.NumberFormatOptions): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };
  
  return new Intl.NumberFormat(language, defaultOptions).format(number);
}

// Utility function to format currency based on language
export function formatCurrencyByLanguage(amount: number, language: Language, currency: string = 'USD'): string {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
  }).format(amount);
}

// Utility function to get time zone information
export function getTimeZoneInfo(language: Language): { timezone: string; offset: string } {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = now.getTimezoneOffset();
  
  return {
    timezone,
    offset: offset >= 0 ? `+${offset / 60}` : `${offset / 60}`
  };
}

// Utility function to get locale-specific date formats
export function getLocaleDateFormats(language: Language): { short: string; medium: string; long: string; full: string } {
  const formats: Record<string, { short: string; medium: string; long: string; full: string }> = {
    en: {
      short: 'MM/dd/yyyy',
      medium: 'MMM d, yyyy',
      long: 'MMMM d, yyyy',
      full: 'EEEE, MMMM d, yyyy'
    },
    es: {
      short: 'dd/MM/yyyy',
      medium: 'd MMM yyyy',
      long: 'd [de] MMMM [de] yyyy',
      full: 'EEEE, d [de] MMMM [de] yyyy'
    },
    fr: {
      short: 'dd/MM/yyyy',
      medium: 'd MMM yyyy',
      long: 'd MMMM yyyy',
      full: 'EEEE d MMMM yyyy'
    }
  };
  
  return formats[language] ?? formats.en;
}

// Utility function to get locale-specific number formats
export function getLocaleNumberFormats(language: Language): { decimal: string; thousands: string; currency: string } {
  const formats: Record<string, { decimal: string; thousands: string; currency: string }> = {
    en: {
      decimal: '.',
      thousands: ',',
      currency: '$'
    },
    es: {
      decimal: ',',
      thousands: '.',
      currency: '€'
    },
    fr: {
      decimal: ',',
      thousands: ' ',
      currency: '€'
    }
  };
  
  return formats[language] ?? formats.en;
}
