# Internationalization (i18n) Guide

This guide explains how to add new languages to the FreezeFrame extension and maintain the existing internationalization system.

## Overview

The FreezeFrame extension uses WXT's i18n module with YAML locale files for managing translations. The system supports automatic language detection and provides type-safe translation keys.

## Current Languages

- English (en) - Default
- Spanish (es) 
- German (de)
- French (fr)
- Italian (it)
- Japanese (ja)

## Adding a New Language

### 1. Create Locale File

Create a new YAML file in `/extension/locales/` using the [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes):

```bash
cp locales/en.yml locales/{language-code}.yml
```

Example for Portuguese:
```bash
cp locales/en.yml locales/pt.yml
```

### 2. Translate Content

Edit the new locale file and translate all strings. Keep the keys identical and only change the values:

```yaml
# locales/pt.yml
popup:
  title: "Configurações do FreezeFrame"
  amazonRegion: "Região da Amazon"
  selectRegion: "Selecionar região..."
  # ... continue translating all keys
```

### 3. Build Extension

The WXT i18n module will automatically:
- Generate TypeScript definitions
- Create Chrome extension `_locales/{language}/messages.json` files
- Include the new language in builds

```bash
npm run build
```

### 4. Test the Language

1. Set your browser language to the new language code
2. Load the extension 
3. Verify all text appears in the new language
4. Test fallback to English for any missing translations

## Adding Translations to Server

If you also want to localize server responses:

### 1. Create Server Locale File

```bash
cp ../server/src/locales/en.json ../server/src/locales/{language-code}.json
```

### 2. Translate Server Messages

Edit the JSON file with translated error messages and Amazon search terms:

```json
{
  "errors": {
    "invalidImage": "Imagem inválida fornecida",
    "analysisTimeout": "Análise expirou"
  },
  "amazon": {
    "searchTerms": {
      "similarProducts": "produtos similares",
      "alternatives": "alternativas"
    }
  }
}
```

### 3. Rebuild Server

```bash
cd ../server && npm run build
```

## Translation Guidelines

### Key Principles

1. **Maintain Key Structure**: Never change YAML/JSON keys, only translate values
2. **Preserve Placeholders**: Keep variables like `{{region}}` unchanged
3. **Consider Context**: Translate based on UI context, not literal meaning
4. **Test Length**: Ensure translations fit in UI components
5. **Cultural Adaptation**: Adapt for local conventions when appropriate

### Extension-Specific Guidelines

- **Accessibility**: Maintain descriptive `aria-label` and `alt` text
- **Tooltips**: Keep concise while being informative
- **Error Messages**: Be clear and actionable
- **Settings**: Use familiar terminology for your locale

### Amazon Integration

When translating Amazon-related terms:
- Use terms that Amazon shoppers in that region would search for
- Consider local product naming conventions
- Test with actual Amazon searches in that region

## File Structure

```
extension/
├── locales/
│   ├── en.yml          # English (default)
│   ├── es.yml          # Spanish
│   ├── de.yml          # German
│   ├── fr.yml          # French
│   ├── it.yml          # Italian
│   ├── ja.yml          # Japanese
│   └── {new-lang}.yml  # Your new language
├── wxt.config.ts       # i18n configuration
└── src/
    └── ui/components/  # Components using i18n.t()
```

## Usage in Code

### Reading Translations

```typescript
import { i18n } from '@/utils/i18n';

// Simple translation
const title = i18n.t('popup.title');

// With interpolation
const message = i18n.t('sidebar.analyzing', { product: productName });

// With fallback
const text = i18n.t('optional.key', { fallback: 'Default text' });
```

### TypeScript Support

All translation keys are type-checked. The TypeScript compiler will error if you:
- Use non-existent keys
- Miss required interpolation variables
- Misspell key names

## Testing Translations

### Manual Testing

1. **Browser Language**: Change browser language in settings
2. **Extension Reload**: Reload extension to pick up language change
3. **UI Verification**: Check all visible text is translated
4. **Functionality**: Ensure features work with new language

### Automated Testing

Consider adding tests for:
- All locale files have same key structure
- No missing translations
- Interpolation variables are present
- Text length doesn't break layouts

## Maintenance

### Adding New Keys

When adding new translatable text:

1. Add the key to `en.yml` first
2. Add translation calls in code: `i18n.t('new.key')`
3. Update all other locale files with translations
4. Test the changes

### Updating Existing Translations

1. Modify the English version first
2. Update all other languages
3. Consider if context changes affect other locales
4. Test changes across languages

## Troubleshooting

### Common Issues

- **Missing translations**: Check browser console for missing key warnings
- **Build errors**: Verify YAML syntax is valid
- **TypeScript errors**: Ensure all locale files have matching key structure
- **Fallback not working**: Verify English locale has all required keys

### Debug Tips

- Use browser dev tools to inspect `chrome.i18n.getMessage()` calls
- Check generated `_locales/` folder in build output
- Verify WXT i18n module configuration in `wxt.config.ts`

## Resources

- [WXT i18n Documentation](https://wxt.dev/guide/i18n/)
- [Chrome Extension i18n](https://developer.chrome.com/docs/extensions/reference/i18n/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [YAML Syntax Guide](https://yaml.org/spec/1.2/spec.html)