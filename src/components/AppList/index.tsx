import React, {type Ref} from 'react';
import {FlatList, type FlatListProps, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Spinner, YStack} from 'tamagui';

import StateView from '@/components/StateView';

export interface AppListProps<ItemT> extends Omit<
  FlatListProps<ItemT>,
  'data'
> {
  data: readonly ItemT[];
  ref?: Ref<FlatList<ItemT>>;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

/** Virtualized list with standard request states and guarded pagination. */
const AppList = <ItemT,>({
  data,
  ref,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyDescription,
  hasNextPage = true,
  isFetchingNextPage = false,
  refreshing = false,
  onEndReached,
  onEndReachedThreshold = 0.3,
  contentContainerStyle,
  ListEmptyComponent,
  ListFooterComponent,
  ...props
}: AppListProps<ItemT>) => {
  const {t} = useTranslation();

  const emptyContent = isLoading ? (
    <StateView variant="loading" />
  ) : isError ? (
    <StateView
      variant="error"
      description={errorMessage}
      actionLabel={onRetry ? t('errorBoundary.retry') : undefined}
      onAction={onRetry}
    />
  ) : (
    (ListEmptyComponent ?? (
      <StateView
        variant="empty"
        title={emptyTitle}
        description={emptyDescription}
      />
    ))
  );

  const footer = React.isValidElement(ListFooterComponent)
    ? ListFooterComponent
    : ListFooterComponent
      ? React.createElement(ListFooterComponent as React.ComponentType)
      : null;

  const canLoadMore =
    data.length > 0 &&
    hasNextPage &&
    !isLoading &&
    !isError &&
    !refreshing &&
    !isFetchingNextPage;

  return (
    <FlatList<ItemT>
      {...props}
      ref={ref}
      data={data}
      refreshing={refreshing}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      ListEmptyComponent={emptyContent}
      ListFooterComponent={
        isFetchingNextPage ? (
          <>
            {footer}
            <YStack paddingVertical={16} alignItems="center">
              <Spinner color="$primary" />
            </YStack>
          </>
        ) : (
          ListFooterComponent
        )
      }
      onEndReached={canLoadMore ? onEndReached : undefined}
      onEndReachedThreshold={onEndReachedThreshold}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
});

export default AppList;
