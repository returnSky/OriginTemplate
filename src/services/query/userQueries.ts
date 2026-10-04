import {useSyncExternalStore} from 'react';
import {CanceledError} from 'axios';
import {
  QueryClient,
  mutationOptions,
  queryOptions,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  userApi,
  type UpdateUserInfoPayload,
  type UserInfo,
} from '@/services/api';
import {
  getAuthSessionRevision,
  subscribeToAuthSessionRevision,
} from '@/services/auth/sessionEvents';
import {normalizeHttpError, type HttpError} from '@/services/http/errors';

import {queryKeys} from './queryKeys';

type UserQueryKey = ReturnType<typeof queryKeys.user.detail>;

interface UserMutationContext {
  sessionRevision: number;
}

export const userQueryOptions = (userId: string | null | undefined) =>
  queryOptions<UserInfo, HttpError, UserInfo, UserQueryKey>({
    queryKey: queryKeys.user.detail(userId ?? null),
    queryFn: userId
      ? ({signal}) => userApi.getUserInfo(userId, {signal})
      : skipToken,
  });

export const useUserQuery = (userId: string | null | undefined) =>
  useQuery(userQueryOptions(userId));

export const updateUserMutationOptions = (
  client: QueryClient,
  userId: string,
) => {
  const sessionRevision = getAuthSessionRevision();
  const ensureCurrentSession = () => {
    if (sessionRevision !== getAuthSessionRevision()) {
      throw normalizeHttpError(
        new CanceledError(
          'The auth session changed before the update started.',
        ),
      );
    }
  };

  return mutationOptions<
    UserInfo,
    HttpError,
    UpdateUserInfoPayload,
    UserMutationContext
  >({
    mutationKey: queryKeys.user.update(userId),
    mutationFn: payload => {
      // Queued writes must never run with credentials from a new session.
      ensureCurrentSession();
      return userApi.updateUserInfo(userId, payload);
    },
    retry: 0,
    onMutate: async () => {
      ensureCurrentSession();
      await client.cancelQueries({
        queryKey: queryKeys.user.detail(userId),
        exact: true,
      });
      ensureCurrentSession();

      return {sessionRevision};
    },
    onSuccess: async (user, _payload, context) => {
      if (context?.sessionRevision !== getAuthSessionRevision()) {
        return;
      }

      // A refetch can start while the mutation is pending; cancel it as well.
      await client.cancelQueries({
        queryKey: queryKeys.user.detail(userId),
        exact: true,
      });

      // Signing out can occur while cancellation settles.
      if (context.sessionRevision === getAuthSessionRevision()) {
        client.setQueryData(userQueryOptions(userId).queryKey, user);
        // The server remains authoritative when several updates overlap.
        await client.invalidateQueries({
          queryKey: queryKeys.user.detail(userId),
          exact: true,
        });
      }
    },
  });
};

export const useUpdateUserMutation = (userId: string) => {
  const client = useQueryClient();
  useSyncExternalStore(
    subscribeToAuthSessionRevision,
    getAuthSessionRevision,
    getAuthSessionRevision,
  );

  return useMutation(updateUserMutationOptions(client, userId));
};
