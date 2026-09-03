/**
 * @description Safely parse a JSON string
 * @param {String} jsonString The JSON string to parse
 * @param {String} defaultValue Default value
 */
import { uiContext } from '@fast-crud/fast-crud';

export function parse(jsonString = '{}', defaultValue = {}) {
	let result = defaultValue;
	try {
		result = JSON.parse(jsonString);
	} catch (error) {
		console.log(error);
	}
	return result;
}

/**
 * @description API request response
 * @param {Any} data Return value
 * @param {String} msg Status message
 * @param {Number} code Status code
 */
export function response(data = {}, msg = '', code = 0) {
	return [200, { code, msg, data }];
}

/**
 * @description API request response — success
 * @param {Any} data Return value
 * @param {String} msg Status message
 */
export function responseSuccess(data = {}, msg = '成功') {
	return response(data, msg);
}

/**
 * @description API request response — error
 * @param {Any} data Return value
 * @param {String} msg Status message
 * @param {Number} code Status code
 */
export function responseError(data = {}, msg = '请求失败', code = 500) {
	return response(data, msg, code);
}

/**
 * @description Log and display error
 * @param {Error} error Error object
 */
export function errorLog(error: any, notification = true) {
	// Print to console
	console.error(error);
	// Show notification
	if (notification) {
		uiContext.get().notification.error({ message: error.message });
	}
}

/**
 * @description Create an error
 * @param {String} msg Error message
 */
export function errorCreate(msg: any, notification = true) {
	const error = new Error(msg);
	errorLog(error, notification);
	// throw error;
}

/**
 * @description Convert base64 to File
 * @param {String} base64 base64 string
 * @param {String} fileName File name
 */
export function base64ToFile(base64: any, fileName: string) {
	// Split base64 by comma to separate the prefix from the content
	let data = base64.split(',');
	// Use regex to extract image type info from prefix (image/png, image/jpeg, image/webp, etc.)
	let type = data[0].match(/:(.*?);/)[1];
	// Extract the specific file format suffix from the image type info (png, jpeg, webp)
	let suffix = type.split('/')[1];
	// Decode base64 data using atob() — result is a file data stream output as string
	const bstr = window.atob(data[1]);
	// Get the length of the decoded string
	let n = bstr.length;
	// Create a Uint8Array of equal length based on decoded string length
	// But all elements are initialized to 0 at creation time
	const u8arr = new Uint8Array(n);
	// Fill each element of the integer array with the UTF-16 code unit of the corresponding character in the decoded string
	while (n--) {
		// charCodeAt(): Get the UTF-16 code unit at the given character index
		u8arr[n] = bstr.charCodeAt(n);
	}
	// Create a File object using the constructor
	// new File(bits, name, options)
	const file = new File([u8arr], `${fileName}.${suffix}`, {
		type: type,
	});
	// Return the File object to the caller
	return file;
}
