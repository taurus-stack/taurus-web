import { ref, computed, watch } from 'vue';

export type KvRow = { prefix: string; key: string; value: string };

export function useCustomParams(argsJsonRef: { value: string }) {
  const argsMode = ref<'positional' | 'kv'>('positional');
  const argsPositional = ref('');
  const argsKvRows = ref<KvRow[]>([{ prefix: '--', key: '', value: '' }]);

  const argsPreview = computed(() => {
    try {
      const arr = JSON.parse(argsJsonRef.value || '[]');
      if (!Array.isArray(arr) || arr.length === 0) return '';
      return arr.map((i: any) => {
        if (i.prefix && i.key) return `${i.prefix}${i.key}=${i.value ?? ''}`;
        if (i.key) return `${i.key}=${i.value ?? ''}`;
        return i.value != null ? String(i.value) : '';
      }).join(' ');
    } catch {
      return '';
    }
  });

  const effectiveArgCount = computed(() => {
    if (argsMode.value === 'positional') {
      return argsPositional.value.split(/\s+/).filter((s) => s.trim() !== '').length;
    }
    return argsKvRows.value.filter((r) => r.key && r.key.trim() !== '').length;
  });

  function addKvRow() {
    argsKvRows.value.push({ prefix: '--', key: '', value: '' });
  }

  function removeKvRow(idx: number) {
    if (argsKvRows.value.length <= 1) return;
    argsKvRows.value.splice(idx, 1);
  }

  function syncArgsToForm() {
    if (argsMode.value === 'positional') {
      const parts = argsPositional.value.split(/\s+/).filter((s) => s.trim() !== '');
      if (parts.length === 0) {
        argsJsonRef.value = '[]';
      } else {
        argsJsonRef.value = JSON.stringify(parts.map((v) => ({ value: v })));
      }
    } else {
      const rows = argsKvRows.value.filter((r) => r.key && r.key.trim() !== '');
      argsJsonRef.value = rows.length === 0 ? '[]' : JSON.stringify(rows.map((r) => ({
        prefix: r.prefix,
        key: r.key,
        value: r.value,
      })));
    }
  }

  function resetArgs() {
    argsMode.value = 'positional';
    argsPositional.value = '';
    argsKvRows.value = [{ prefix: '--', key: '', value: '' }];
  }

  function parseArgsFromForm(jsonStr: string) {
    try {
      const arr = JSON.parse(jsonStr || '[]');
      if (!Array.isArray(arr) || arr.length === 0) {
        resetArgs();
        return;
      }
      const hasKeys = arr.some((i: any) => i.key && i.key.trim());
      if (hasKeys) {
        argsMode.value = 'kv';
        argsKvRows.value = arr.map((i: any) => ({
          prefix: i.prefix ?? '--',
          key: i.key ?? '',
          value: i.value ?? '',
        }));
        if (argsKvRows.value.length === 0) argsKvRows.value.push({ prefix: '--', key: '', value: '' });
        argsPositional.value = '';
      } else {
        argsMode.value = 'positional';
        argsPositional.value = arr.map((i: any) => i.value != null ? String(i.value) : '').join(' ');
        argsKvRows.value = [{ prefix: '--', key: '', value: '' }];
      }
    } catch {
      resetArgs();
    }
  }

  watch(() => argsJsonRef.value, (val) => {
    parseArgsFromForm(val);
  }, { immediate: true });

  return {
    argsMode,
    argsPositional,
    argsKvRows,
    argsPreview,
    effectiveArgCount,
    addKvRow,
    removeKvRow,
    syncArgsToForm,
    resetArgs,
    parseArgsFromForm,
  };
}