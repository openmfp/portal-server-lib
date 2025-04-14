import openMfpConfig from '@openmfp/config-prettier';

export default {
  ...openMfpConfig,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
};
