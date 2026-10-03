type SessionInvalidatedListener = (
  accessToken: string,
  revision?: number,
) => Promise<void>;

const listeners = new Set<SessionInvalidatedListener>();
let sessionRevision = 0;
const revisionListeners = new Set<() => void>();

export const getAuthSessionRevision = () => sessionRevision;

export const advanceAuthSessionRevision = () => {
  sessionRevision += 1;
  revisionListeners.forEach(listener => listener());
  return sessionRevision;
};

export const subscribeToSessionInvalidation = (
  listener: SessionInvalidatedListener,
) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const notifySessionInvalidated = async (
  accessToken: string,
  revision?: number,
) => {
  // Cleanup failures must never replace the original HTTP 401 error.
  await Promise.allSettled(
    Array.from(listeners, listener =>
      Promise.resolve().then(() => listener(accessToken, revision)),
    ),
  );
};

export const subscribeToAuthSessionRevision = (listener: () => void) => {
  revisionListeners.add(listener);
  return () => {
    revisionListeners.delete(listener);
  };
};
