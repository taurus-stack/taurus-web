/**
 * 2020.11.29 lyt organized
 * Collection of utility classes, for daily development
 * Added multi-line comments, hover over method name to view
 */

/**
 * Validate percentage (no decimals)
 * @param val Current value string
 * @returns Processed string
 */
export function verifyNumberPercentage(val: string): string {
	// Match spaces
	let v = val.replace(/(^\s*)|(\s*$)/g, '');
	// Only digits allowed, no other characters
	v = v.replace(/[^\d]/g, '');
	// Cannot start with 0
	v = v.replace(/^0/g, '');
	// If number exceeds 100, set to max value 100
	v = v.replace(/^[1-9]\d\d{1,3}$/, '100');
	// Return result
	return v;
}

/**
 * Validate percentage (decimals allowed)
 * @param val Current value string
 * @returns Processed string
 */
export function verifyNumberPercentageFloat(val: string): string {
	let v = verifyNumberIntegerAndFloat(val);
	// If number exceeds 100, set to max value 100
	v = v.replace(/^[1-9]\d\d{1,3}$/, '100');
	// After exceeding 100, no more input is allowed
	v = v.replace(/^100\.$/, '100');
	// Return result
	return v;
}

/**
 * Decimal or integer (no negative numbers)
 * @param val Current value string
 * @returns Processed string
 */
export function verifyNumberIntegerAndFloat(val: string) {
	// Match spaces
	let v = val.replace(/(^\s*)|(\s*$)/g, '');
	// Only digits and decimal point allowed, no other input
	v = v.replace(/[^\d.]/g, '');
	// If starts with 0, only one allowed
	v = v.replace(/^0{2}$/g, '0');
	// Ensure first character is a digit, not a dot
	v = v.replace(/^\./g, '');
	// Only one decimal point allowed
	v = v.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');
	// Keep 2 digits after decimal point
	v = v.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3');
	// Return result
	return v;
}

/**
 * Positive integer validation
 * @param val Current value string
 * @returns Processed string
 */
export function verifiyNumberInteger(val: string) {
	// Match spaces
	let v = val.replace(/(^\s*)|(\s*$)/g, '');
	// Remove '.', to prevent issues when pasting e.g. 0.1.12.12
	v = v.replace(/[\.]*/g, '');
	// Remove numbers after leading 0, to prevent issues when pasting e.g. 00121323
	v = v.replace(/(^0[\d]*)$/g, '0');
	// If first digit is 0, only one occurrence allowed
	v = v.replace(/^0\d$/g, '0');
	// Only match digits
	v = v.replace(/[^\d]/g, '');
	// Return result
	return v;
}

/**
 * Remove Chinese characters and spaces
 * @param val Current value string
 * @returns Processed string
 */
export function verifyCnAndSpace(val: string) {
	// Match Chinese characters and spaces
	let v = val.replace(/[\u4e00-\u9fa5\s]+/g, '');
	// Match spaces
	v = v.replace(/(^\s*)|(\s*$)/g, '');
	// Return result
	return v;
}

/**
 * Remove English characters and spaces
 * @param val Current value string
 * @returns Processed string
 */
export function verifyEnAndSpace(val: string) {
	// Match English characters and spaces
	let v = val.replace(/[a-zA-Z]+/g, '');
	// Match spaces
	v = v.replace(/(^\s*)|(\s*$)/g, '');
	// Return result
	return v;
}

/**
 * Disallow space input
 * @param val Current value string
 * @returns Processed string
 */
export function verifyAndSpace(val: string) {
	// Match spaces
	let v = val.replace(/(^\s*)|(\s*$)/g, '');
	// Return result
	return v;
}

/**
 * Format amount with `,` separators
 * @param val Current value string
 * @returns Processed string
 */
export function verifyNumberComma(val: string) {
	// Call decimal or integer (no negative) method
	let v: any = verifyNumberIntegerAndFloat(val);
	// Convert string to array
	v = v.toString().split('.');
	// \B matches non-word boundary, both sides are word characters or both are non-word characters
	v[0] = v[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	// Convert array back to string
	v = v.join('.');
	// Return result
	return v;
}

/**
 * Highlight matched text (during search)
 * @param val Current value string
 * @param text String value to process
 * @param color Font highlight color when found
 * @returns Processed string
 */
export function verifyTextColor(val: string, text = '', color = 'red') {
	// Return content, add color
	let v = text.replace(new RegExp(val, 'gi'), `<span style='color: ${color}'>${val}</span>`);
	// Return result
	return v;
}

/**
 * Convert number to Chinese uppercase
 * @param val Current value string
 * @param unit Default: Chinese uppercase amount units
 * @returns Processed string
 */
export function verifyNumberCnUppercase(val: any, unit = '仟佰拾亿仟佰拾万仟佰拾元角分', v = '') {
	// Append 2 zeros to current content string, why??
	val += '00';
	// Returns the position of the first occurrence of a specified string value in a string, returns -1 if not found
	let lookup = val.indexOf('.');
	// substring: does not include end index, substr: includes end index
	if (lookup >= 0) val = val.substring(0, lookup) + val.substr(lookup + 1, 2);
	// According to the length of content val, intercept and return the corresponding uppercase
	unit = unit.substr(unit.length - val.length);
	// Loop to intercept and concatenate uppercase
	for (let i = 0; i < val.length; i++) {
		v += '零壹贰叁肆伍陆柒捌玖'.substr(val.substr(i, 1), 1) + unit.substr(i, 1);
	}
	// Regex processing
	v = v
		.replace(/零角零分$/, '整')
		.replace(/零[仟佰拾]/g, '零')
		.replace(/零{2,}/g, '零')
		.replace(/零([亿|万])/g, '$1')
		.replace(/零+元/, '元')
		.replace(/亿零{0,3}万/, '亿')
		.replace(/^元/, '零元');
	// Return result
	return v;
}

/**
 * Mobile phone number
 * @param val Current value string
 * @returns true: phone number is valid
 */
export function verifyPhone(val: string) {
	// false: phone number is invalid
	if (!/^((\+|00)86)?1((3[\d])|(4[5,6,7,9])|(5[0-3,5-9])|(6[5-7])|(7[0-8])|(8[\d])|(9[1,8,9]))\d{8}$/.test(val)) return false;
	// true: phone number is valid
	else return true;
}

/**
 * Domestic telephone number
 * @param val Current value string
 * @returns true: domestic phone number is valid
 */
export function verifyTelPhone(val: string) {
	// false: domestic phone number is invalid
	if (!/\d{3}-\d{8}|\d{4}-\d{7}/.test(val)) return false;
	// true: domestic phone number is valid
	else return true;
}

/**
 * Login account (starts with letter, 5-16 bytes, letters/digits/underscores allowed)
 * @param val Current value string
 * @returns true: login account is valid
 */
export function verifyAccount(val: string) {
	// false: login account is invalid
	if (!/^[a-zA-Z][a-zA-Z0-9_]{4,15}$/.test(val)) return false;
	// true: login account is valid
	else return true;
}

/**
 * Password (starts with letter, length 6~16, only letters/digits/underscores)
 * @param val Current value string
 * @returns true: password is valid
 */
export function verifyPassword(val: string) {
	// false: password is invalid
	if (!/^[a-zA-Z]\w{5,15}$/.test(val)) return false;
	// true: password is valid
	else return true;
}

/**
 * Strong password (letters + digits + special characters, length 6-16)
 * @param val Current value string
 * @returns true: strong password is valid
 */
export function verifyPasswordPowerful(val: string) {
	// false: strong password is invalid
	if (!/^(?![a-zA-z]+$)(?!\d+$)(?![!@#$%^&\.*]+$)(?![a-zA-z\d]+$)(?![a-zA-z!@#$%^&\.*]+$)(?![\d!@#$%^&\.*]+$)[a-zA-Z\d!@#$%^&\.*]{6,16}$/.test(val))
		return false;
	// true: strong password is valid
	else return true;
}

/**
 * Password strength
 * @param val Current value string
 * @description Weak: pure digits, pure letters, pure special characters
 * @description Medium: letters + digits, letters + special characters, digits + special characters
 * @description Strong: letters + digits + special characters
 * @returns Processed string: weak, medium, strong
 */
export function verifyPasswordStrength(val: string) {
	let v = '';
	// Weak: pure digits, pure letters, pure special characters
	if (/^(?:\d+|[a-zA-Z]+|[!@#$%^&\.*]+){6,16}$/.test(val)) v = '弱';
	// Medium: letters + digits, letters + special characters, digits + special characters
	if (/^(?![a-zA-z]+$)(?!\d+$)(?![!@#$%^&\.*]+$)[a-zA-Z\d!@#$%^&\.*]{6,16}$/.test(val)) v = '中';
	// Strong: letters + digits + special characters
	if (/^(?![a-zA-z]+$)(?!\d+$)(?![!@#$%^&\.*]+$)(?![a-zA-z\d]+$)(?![a-zA-z!@#$%^&\.*]+$)(?![\d!@#$%^&\.*]+$)[a-zA-Z\d!@#$%^&\.*]{6,16}$/.test(val))
		v = '强';
	// Return result
	return v;
}

/**
 * IP address
 * @param val Current value string
 * @returns true: IP address is valid
 */
export function verifyIPAddress(val: string) {
	// false: IP address is invalid
	if (
		!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(
			val
		)
	)
		return false;
	// true: IP address is valid
	else return true;
}

/**
 * Email
 * @param val Current value string
 * @returns true: email is valid
 */
export function verifyEmail(val: string) {
	// false: email is invalid
	if (
		!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
			val
		)
	)
		return false;
	// true: email is valid
	else return true;
}

/**
 * ID card
 * @param val Current value string
 * @returns true: ID card is valid
 */
export function verifyIdCard(val: string) {
	// false: ID card is invalid
	if (!/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(val)) return false;
	// true: ID card is valid
	else return true;
}

/**
 * Full name
 * @param val Current value string
 * @returns true: full name is valid
 */
export function verifyFullName(val: string) {
	// false: full name is invalid
	if (!/^[\u4e00-\u9fa5]{1,6}(·[\u4e00-\u9fa5]{1,6}){0,2}$/.test(val)) return false;
	// true: full name is valid
	else return true;
}

/**
 * Postal code
 * @param val Current value string
 * @returns true: postal code is valid
 */
export function verifyPostalCode(val: string) {
	// false: postal code is invalid
	if (!/^[1-9][0-9]{5}$/.test(val)) return false;
	// true: postal code is valid
	else return true;
}

/**
 * URL handling
 * @param val Current value string
 * @returns true: URL is valid
 */
export function verifyUrl(val: string) {
	// false: URL is invalid
	if (
		!/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
			val
		)
	)
		return false;
	// true: URL is valid
	else return true;
}

/**
 * License plate number
 * @param val Current value string
 * @returns true: license plate number is valid
 */
export function verifyCarNum(val: string) {
	// false: license plate number is invalid
	if (
		!/^(([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z](([0-9]{5}[DF])|([DF]([A-HJ-NP-Z0-9])[0-9]{4})))|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳使领]))$/.test(
			val
		)
	)
		return false;
	// true: license plate number is valid
	else return true;
}
