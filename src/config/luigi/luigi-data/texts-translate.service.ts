import { Injectable } from '@nestjs/common';
import { LuigiConfigFragment } from '../../model/content-configuration';

@Injectable()
export class TextsTranslateService {
  translateTexts(
    luigiConfigFragment: LuigiConfigFragment,
    language: string
  ): void {
    if (
      !luigiConfigFragment.data.texts ||
      luigiConfigFragment.data.texts.length === 0
    ) {
      return;
    }

    let configurationString = JSON.stringify(luigiConfigFragment.data);
    const { textDictionary } = this.findMatchedDictionary(
      luigiConfigFragment.data.texts,
      language
    );

    textDictionary &&
      Object.entries(textDictionary).forEach(([key, value]) => {
        const searchRegExp = new RegExp(`{{${key}}}`, 'g');
        configurationString = configurationString.replace(
          searchRegExp,
          value.toString()
        );
      });

    luigiConfigFragment.data = JSON.parse(configurationString);
  }

  private findMatchedDictionary(
    textsObject: any,
    language: string
  ): Record<string, string> {
    const defaultDict = textsObject.find((obj) => obj.locale === '') as Record<
      string,
      string
    >;
    const matchedDict = textsObject.find((obj) => {
      const locale = obj.locale;
      const isNotEmpty = locale !== '' && language !== '';

      if (isNotEmpty && locale === language) {
        return true;
      } else if (isNotEmpty && locale.startsWith(language)) {
        return true;
      }

      return false;
    }) as Record<string, string>;

    return matchedDict || defaultDict;
  }
}
