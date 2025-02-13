import { Injectable } from '@nestjs/common';
import {
  Dictionary,
  LuigiConfigFragment,
} from '../../model/content-configuration';

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
    textsObject: Dictionary[],
    language: string
  ): Dictionary {
    const defaultDict = textsObject.find((obj) => !obj.locale);

    const matchedDict = textsObject.find((obj) => {
      const locale = obj.locale || '';
      const isNotEmpty = locale !== '' && language !== '';

      return isNotEmpty && (locale === language || locale.startsWith(language));
    });

    return matchedDict || defaultDict;
  }
}
