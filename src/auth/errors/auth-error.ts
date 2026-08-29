export type AuthError =
  | { code: 'EMAIL_IN_USE' }
  | { code: 'INVALID_CREDENTIALS' }
  | { code: 'USER_NOT_FOUND' };
