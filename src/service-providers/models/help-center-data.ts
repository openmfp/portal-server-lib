import { URL } from '../service-provider.interfaces';
import { StackSearch } from './stack-search';

export interface HelpCenterData {
  stackSearch?: StackSearch;
  issueTracker?: URL;
  feedbackTracker?: URL;
}
