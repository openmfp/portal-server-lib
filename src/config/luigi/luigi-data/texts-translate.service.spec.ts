import { LuigiConfigFragment } from '../../model/content-configuration.js';
import { TextsTranslateService } from './texts-translate.service.js';

describe('TextsTranslateService', () => {
  let service: TextsTranslateService;

  beforeEach(() => {
    service = new TextsTranslateService();
  });

  it('should return early if texts are missing', () => {
    const luigiConfigFragment: LuigiConfigFragment = {
      data: { nodes: [] },
    };
    const language = 'en';

    service.translateTexts(luigiConfigFragment, language);

    // new obejct wasn't created, so the reference didn't change
    expect(luigiConfigFragment.data).toEqual(luigiConfigFragment.data);
  });

  it('should return early if texts array is empty', () => {
    const luigiConfigFragment: LuigiConfigFragment = {
      data: { texts: [], nodes: [] },
    };
    const language = 'en';

    service.translateTexts(luigiConfigFragment, language);

    // new obejct wasn't created, so the reference didn't change
    expect(luigiConfigFragment.data).toEqual(luigiConfigFragment.data);
  });

  it('should handle text translations in en', () => {
    const luigiConfigFragment = {
      data: {
        texts: [
          { locale: 'en', textDictionary: { welcome: 'Welcome' } },
          { locale: 'de', textDictionary: { welcome: 'Willkommen' } },
        ],
        nodes: [
          {
            pathSegment: 'home',
            label: '{{welcome}}',
          },
        ],
      },
    };

    service.translateTexts(luigiConfigFragment, 'en');
    expect(luigiConfigFragment.data.nodes[0].label).toBe('Welcome');
  });

  it('should handle text translations in de', () => {
    const luigiConfigFragment = {
      data: {
        texts: [
          { locale: 'en', textDictionary: { welcome: 'Welcome' } },
          { locale: 'de', textDictionary: { welcome: 'Willkommen' } },
        ],
        nodes: [
          {
            pathSegment: 'home',
            label: '{{welcome}}',
          },
        ],
      },
    };

    service.translateTexts(luigiConfigFragment, 'de');
    expect(luigiConfigFragment.data.nodes[0].label).toBe('Willkommen');
  });

  it('should handle missing translations gracefully', () => {
    const luigiConfigFragment = {
      data: {
        texts: [
          { locale: '', textDictionary: { welcome: 'Welcome' } }, // default
          { locale: 'de', textDictionary: { welcome: 'Willkommen' } },
        ],
        nodes: [{ pathSegment: 'home', label: '{{welcome}}' }],
      },
    };

    service.translateTexts(luigiConfigFragment, 'fr'); // French not available

    expect(luigiConfigFragment.data.nodes[0].label).toBe('Welcome'); // Should fall back to default
  });

  it('should return default dictionary when missing locale', () => {
    const luigiConfigFragment = {
      data: {
        texts: [
          { textDictionary: { welcome: 'Welcome you' } }, // default
          { locale: 'de', textDictionary: { welcome: 'Willkommen' } },
        ],
        nodes: [{ pathSegment: 'home', label: '{{welcome}}' }],
      },
    };

    service.translateTexts(luigiConfigFragment, 'en'); // French not available

    expect(luigiConfigFragment.data.nodes[0].label).toBe('Welcome you'); // Should fall back to default
  });
});
