import { router } from 'expo-router';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { useToast } from '../components/Toast';
import { useStore } from './store';
import type { Item } from './types';

/** Shared actions used by the home list and the detail screen. */
export function useItemActions() {
  const store = useStore();
  const toast = useToast();

  const logNow = (item: Item) => {
    const logId = store.log(item.id);
    store.haptic('success');
    toast({
      emoji: item.emoji,
      message: `Logged “${item.title}”`,
      action: { label: 'Undo', onPress: () => store.deleteLog(item.id, logId) },
    });
  };

  const logOtherDay = (item: Item) => {
    store.haptic('select');
    router.push({ pathname: '/log', params: { id: item.id } });
  };

  const remove = (item: Item, after?: () => void) => {
    const go = () => {
      const removed = store.deleteItem(item.id);
      store.haptic('warning');
      after?.();
      if (removed) {
        toast({
          emoji: '🗑️',
          message: `Deleted “${item.title}”`,
          action: { label: 'Undo', onPress: () => store.restoreItem(removed) },
          duration: 6000,
        });
      }
    };
    if (Platform.OS === 'web') {
        if (window.confirm(`Delete “${item.title}” and its history?`)) go();
      return;
    }
    Alert.alert(`Delete “${item.title}”?`, 'Its whole history goes with it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: go },
    ]);
  };

  const menu = (item: Item) => {
    store.haptic('select');
    const options = ['Log a different day', 'Edit', 'Delete', 'Cancel'];
    const handle = (i: number) => {
      if (i === 0) logOtherDay(item);
      if (i === 1) router.push({ pathname: '/edit', params: { id: item.id } });
      if (i === 2) remove(item);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3, destructiveButtonIndex: 2, title: `${item.emoji} ${item.title}` },
        handle,
      );
    } else if (Platform.OS === 'android') {
      Alert.alert(`${item.emoji} ${item.title}`, undefined, [
        { text: 'Log a different day', onPress: () => handle(0) },
        { text: 'Edit', onPress: () => handle(1) },
        { text: 'Delete', style: 'destructive', onPress: () => handle(2) },
      ]);
    } else {
      logOtherDay(item);
    }
  };

  return { logNow, logOtherDay, remove, menu };
}
