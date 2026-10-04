import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import AppList, {type AppListProps} from '@/components/AppList';
import StateView from '@/components/StateView';
import {ThemeProvider} from '@/contexts/ThemeContext';
import '@/services/i18n';

type Item = {id: string; title: string};
const items: Item[] = [{id: '1', title: 'Cached item'}];
const renderItem: AppListProps<Item>['renderItem'] = ({item}) => (
  <Text>{item.title}</Text>
);

let renderer: ReactTestRenderer.ReactTestRenderer;

const renderList = async (props: Partial<AppListProps<Item>> = {}) => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <AppList<Item>
          data={[]}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          {...props}
        />
      </ThemeProvider>,
    );
  });

  return renderer.root.findByProps({onEndReachedThreshold: 0.3});
};

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
});

test('shows an initial error with a retry action', async () => {
  const onRetry = jest.fn();
  await renderList({isError: true, errorMessage: 'Unavailable', onRetry});

  const state = renderer.root.findByType(StateView);
  expect(state.props.variant).toBe('error');
  expect(state.props.description).toBe('Unavailable');
  state.props.onAction();
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('keeps cached rows visible when a refresh fails', async () => {
  const onRefresh = jest.fn();
  const list = await renderList({
    data: items,
    isError: true,
    refreshing: true,
    onRefresh,
  });

  expect(renderer.root.findAllByType(StateView)).toHaveLength(0);
  expect(
    renderer.root.findAll(text => {
      return text.props.children === 'Cached item';
    }).length,
  ).toBeGreaterThan(0);
  expect(list.props.refreshing).toBe(true);
  list.props.onRefresh();
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

test.each([
  {isLoading: true},
  {isError: true},
  {refreshing: true},
  {isFetchingNextPage: true},
  {hasNextPage: false},
])('prevents page requests while blocked by %j', async state => {
  const onEndReached = jest.fn();
  const list = await renderList({data: items, onEndReached, ...state});

  expect(list.props.onEndReached).toBeUndefined();
});

test('forwards pagination for populated lists with another page', async () => {
  const onEndReached = jest.fn();
  const list = await renderList({data: items, onEndReached, hasNextPage: true});

  list.props.onEndReached({distanceFromEnd: 10});
  expect(onEndReached).toHaveBeenCalledWith({distanceFromEnd: 10});
});
