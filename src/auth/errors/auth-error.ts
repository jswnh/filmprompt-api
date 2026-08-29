export type AuthError =
  | { code: 'EMAIL_IN_USE' }
  | { code: 'INVALID_CREDENTIALS' }
  | { code: 'USER_NOT_FOUND' }
  | { code: 'EMAIL_NOT_VERIFIED' }
  | { code: 'INVALID_OR_EXPIRED_TOKEN' }
  | { code: 'EMAIL_ALREADY_VERIFIED' };
