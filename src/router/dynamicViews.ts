const layouModules: any = import.meta.glob('../layout/routerView/*.{vue,tsx}');
const viewsModules: any = import.meta.glob('../views/**/*.{vue,tsx}');

export const dynamicViewsModules: Record<string, Function> = Object.assign({}, { ...layouModules }, { ...viewsModules });

const viewsKeys = Object.keys(dynamicViewsModules);
const normalizedKeys = viewsKeys.map((key) => key.replace(/..\/views|..\/layout|../, ''));

export function dynamicImport(component: string) {
	const matchKeys = normalizedKeys.filter((k) => k.startsWith(`${component}`) || k.startsWith(`/${component}`));
	if (matchKeys?.length === 1) {
		const originalKey = viewsKeys[normalizedKeys.indexOf(matchKeys[0])];
		return dynamicViewsModules[originalKey];
	}
	if (matchKeys?.length > 1) {
		return false;
	}
}