/**
 * Date and time conversion
 * @param date Current time in new Date() format
 * @param format Target time format string
 * @description format string can be arbitrary, e.g. `YYYY-mm、YYYY-mm-dd`
 * @description format quarter: "YYYY-mm-dd HH:MM:SS QQQQ"
 * @description format weekday: "YYYY-mm-dd HH:MM:SS WWW"
 * @description format week number: "YYYY-mm-dd HH:MM:SS ZZZ"
 * @description format quarter + weekday + week number: "YYYY-mm-dd HH:MM:SS WWW QQQQ ZZZ"
 * @returns Returns the assembled time string
 */
export function formatDate(date: Date, format: string): string {
	let we = date.getDay(); // weekday
	let z = getWeek(date); // week
	let qut = Math.floor((date.getMonth() + 3) / 3).toString(); // quarter
	const opt: { [key: string]: string } = {
		'Y+': date.getFullYear().toString(), // year
		'm+': (date.getMonth() + 1).toString(), // month (months start from 0, need +1)
		'd+': date.getDate().toString(), // day
		'H+': date.getHours().toString(), // hour
		'M+': date.getMinutes().toString(), // minute
		'S+': date.getSeconds().toString(), // second
		'q+': qut, // quarter
	};
	// Chinese numerals (weekday)
	const week: { [key: string]: string } = {
		'0': '日',
		'1': '一',
		'2': '二',
		'3': '三',
		'4': '四',
		'5': '五',
		'6': '六',
	};
	// Chinese numerals (quarter)
	const quarter: { [key: string]: string } = {
		'1': '一',
		'2': '二',
		'3': '三',
		'4': '四',
	};
	if (/(W+)/.test(format))
		format = format.replace(RegExp.$1, RegExp.$1.length > 1 ? (RegExp.$1.length > 2 ? '星期' + week[we] : '周' + week[we]) : week[we]);
	if (/(Q+)/.test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 4 ? '第' + quarter[qut] + '季度' : quarter[qut]);
	if (/(Z+)/.test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 3 ? '第' + z + '周' : z + '');
	for (let k in opt) {
		let r = new RegExp('(' + k + ')').exec(format);
		// If input length is not 1, prepend zeros
		if (r) format = format.replace(r[1], RegExp.$1.length == 1 ? opt[k] : opt[k].padStart(RegExp.$1.length, '0'));
	}
	return format;
}

/**
 * Get which week of the year the current date falls in
 * @param dateTime The input date value
 * @returns Returns the week number as a numeric value
 */
export function getWeek(dateTime: Date): number {
	let temptTime = new Date(dateTime.getTime());
	// day of week
	let weekday = temptTime.getDay() || 7;
	// Monday + 5 days = Saturday
	temptTime.setDate(temptTime.getDate() - weekday + 1 + 5);
	let firstDay = new Date(temptTime.getFullYear(), 0, 1);
	let dayOfWeek = firstDay.getDay();
	let spendDay = 1;
	if (dayOfWeek != 0) spendDay = 7 - dayOfWeek + 1;
	firstDay = new Date(temptTime.getFullYear(), 0, 1 + spendDay);
	let d = Math.ceil((temptTime.valueOf() - firstDay.valueOf()) / 86400000);
	let result = Math.ceil(d / 7);
	return result;
}

/**
 * Convert time to `X seconds ago`, `X minutes ago`, `X hours ago`, `X days ago`
 * @param param Current time in new Date() format or string time format
 * @param format Target time format string
 * @description param 10 seconds:  10 * 1000
 * @description param 1 minute:    60 * 1000
 * @description param 1 hour:      60 * 60 * 1000
 * @description param 24 hours:    60 * 60 * 24 * 1000
 * @description param 3 days:      60 * 60* 24 * 1000 * 3
 * @returns Returns the assembled time string
 */
export function formatPast(param: string | Date, format: string = 'YYYY-mm-dd'): string {
	// Input format handling, store converted value
	let t: any, s: number;
	// Get JS timestamp
	let time: number = new Date().getTime();
	// Whether it is an object
	typeof param === 'string' || 'object' ? (t = new Date(param).getTime()) : (t = param);
	// Current timestamp - input timestamp
	time = Number.parseInt(`${time - t}`);
	if (time < 10000) {
		// Within 10 seconds
		return '刚刚';
	} else if (time < 60000 && time >= 10000) {
		// Over 10 seconds, less than 1 minute
		s = Math.floor(time / 1000);
		return `${s}秒前`;
	} else if (time < 3600000 && time >= 60000) {
		// Over 1 minute, less than 1 hour
		s = Math.floor(time / 60000);
		return `${s}分钟前`;
	} else if (time < 86400000 && time >= 3600000) {
		// Over 1 hour, less than 24 hours
		s = Math.floor(time / 3600000);
		return `${s}小时前`;
	} else if (time < 259200000 && time >= 86400000) {
		// Over 1 day, less than 3 days
		s = Math.floor(time / 86400000);
		return `${s}天前`;
	} else {
		// Over 3 days
		let date = typeof param === 'string' || 'object' ? new Date(param) : param;
		return formatDate(date, format);
	}
}

/**
 * Time greeting
 * @param param Current time in new Date() format
 * @description calling `formatAxis(new Date())` outputs e.g. `Good morning`
 * @returns Returns the assembled greeting string
 */
export function formatAxis(param: Date): string {
	let hour: number = new Date(param).getHours();
	if (hour < 6) return '凌晨好';
	else if (hour < 9) return '早上好';
	else if (hour < 12) return '上午好';
	else if (hour < 14) return '中午好';
	else if (hour < 17) return '下午好';
	else if (hour < 19) return '傍晚好';
	else if (hour < 22) return '晚上好';
	else return '夜里好';
}
