import { toRaw } from 'vue';
import { DictionaryStore } from '/@/stores/dictionary';
import { i18n } from '/@/i18n';

const t = i18n.global.t;

/**
 * Translate a dictionary label via i18n.
 *
 * Conventions:
 * - Dictionary items whose label matches `dict.xxx` pattern (i18n key form)
 *   will be translated using t() -> falls back to the original string when
 *   no translation is defined.
 * - Raw plain-text labels are returned as-is (so non-i18n custom dictionaries
 *   defined by users continue to work).
 */
export function translateDictLabel(label: any): string {
	if (label === null || label === undefined) return '';
	const key = String(label);
	// Only keys following the dictionary namespace are translated.
	// This avoids accidentally passing arbitrary user-entered labels through t().
	if (key.startsWith('dict.')) {
		const translated = t(key);
		// vue-i18n returns the key itself when missing (silentTranslationWarn=true).
		// Strip the prefix as a best-effort fallback for unknown keys.
		if (translated && translated !== key) return translated;
		return key.slice('dict.'.length);
	}
	return key;
}

/**
 * Return a translated deep-copy of a dictionary item list.
 * Each item's `label` is resolved with the current i18n locale.
 *
 * A computed version (using vue `computed()`) is preferred at call sites so
 * language-switch updates propagate reactively, but here a plain copy is
 * returned because dictionary() is often called inside static crud options.
 * Consumers that need reactivity can wrap the result themselves, or rely on
 * the fact that we translate eagerly at access time.
 */
function translateDictItems(items: any[] | undefined | null): any[] {
	if (!items) return [];
	return items.map((item) => ({
		...item,
		label: translateDictLabel(item.label),
	}));
}

/**
 * @method Get dictionary by name
 *
 * If `key` is provided, returns the translated label of the matching item;
 * otherwise returns the whole list of items with labels translated via i18n.
 */
export const dictionary = (name: string, key?: string | number | undefined) => {
	const dict = DictionaryStore();
	const storage = toRaw(dict.data);
	if (key != undefined) {
		const arr: any[] = storage[name];
		if (!arr) return '';
		const obj = arr.find((item: any) => item.value === key);
		return obj ? translateDictLabel(obj.label) : '';
	} else {
		return translateDictItems(storage[name]);
	}
};
