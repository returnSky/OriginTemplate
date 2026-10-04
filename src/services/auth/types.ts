export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  /** Unix timestamp in milliseconds. */
  expiresAt?: number;
}

export interface AuthResult {
  user: AuthUser;
  session: AuthSession;
}

export interface AuthAdapter {
  signIn: (payload: SignInPayload) => Promise<AuthResult>;
  restoreSession: (
    session: AuthSession,
    cachedUser: AuthUser | null,
  ) => Promise<AuthUser | null>;
  signOut?: (session: AuthSession | null) => Promise<void>;
}
