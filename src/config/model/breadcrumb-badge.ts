export type BreadcrumbBadgeColorSchema =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10';

export interface BreadcrumbBadge {
  text: string;
  colorSchema?: BreadcrumbBadgeColorSchema;
  hint?: string;
}
