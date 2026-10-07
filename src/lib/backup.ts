import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { parseBackup } from './store';
import type { AppData } from './types';

function fileName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `last-time-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export async function exportBackup(data: AppData) {
  const json = JSON.stringify(data, null, 2);
  const name = fileName();
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    return;
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your Last Time backup',
  });
}

/** Returns parsed data, or null if the user cancelled. Throws on invalid files. */
export async function pickBackup(): Promise<AppData | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  let text: string;
  if (Platform.OS === 'web') {
    text = asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text();
  } else {
    text = await new File(asset.uri).text();
  }
  return parseBackup(text);
}
