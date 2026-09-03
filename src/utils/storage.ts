import Cookies from 'js-cookie';

/**
 * window.localStorage browser persistent cache
 * @method set Set persistent cache
 * @method get Get persistent cache
 * @method remove Remove persistent cache
 * @method clear Remove all persistent cache
 */
export const Local = {
	// Set persistent cache
	set(key: string, val: any) {
		window.localStorage.setItem(key, JSON.stringify(val));
	},
	// Get persistent cache
	get(key: string) {
		let json = <string>window.localStorage.getItem(key);
		return JSON.parse(json);
	},
	// Remove persistent cache
	remove(key: string) {
		window.localStorage.removeItem(key);
	},
	// Remove all persistent cache
	clear() {
		window.localStorage.clear();
	},
};

/**
 * window.sessionStorage browser temporary cache
 * @method set Set temporary cache
 * @method get Get temporary cache
 * @method remove Remove temporary cache
 * @method clear Remove all temporary cache
 */
export const Session = {
	// Set temporary cache
	set(key: string, val: any) {
		if (key === 'token') return Cookies.set(key, val);
		window.sessionStorage.setItem(key, JSON.stringify(val));
	},
	// Get temporary cache
	get(key: string) {
		if (key === 'token') return Cookies.get(key);
		let json = <string>window.sessionStorage.getItem(key);
		return JSON.parse(json);
	},
	// Remove temporary cache
	remove(key: string) {
		if (key === 'token') return Cookies.remove(key);
		window.sessionStorage.removeItem(key);
	},
	// Remove all temporary cache
	clear() {
		Cookies.remove('token');
		window.sessionStorage.clear();
	},
};
