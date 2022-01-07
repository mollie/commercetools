// This is not exhaustive
// If you use another commercetools error response code, add it to this enum
export enum CTEnumErrors {
  General = 'General',
  InvalidInput = 'InvalidInput',
  InvalidOperation = 'InvalidOperation',
  Unauthorized = 'Unauthorized',
  SyntaxError = 'SyntaxError',
  SemanticError = 'SemanticError',
  ObjectNotFound = 'ObjectNotFound',
}

export type CTErrorExtensionExtraInfo = {
  originalStatusCode: number;
  title: string;
  field: string;
  links?: string;
};

export type CTError = {
  code: CTEnumErrors;
  message: string;
  extensionExtraInfo?: CTErrorExtensionExtraInfo;
};
