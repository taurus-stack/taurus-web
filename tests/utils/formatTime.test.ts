import { describe, it, expect } from 'vitest';
import { formatDate, getWeek, formatPast, formatAxis } from '../../src/utils/formatTime';

describe('formatDate', () => {
	it('formats_full_date_time_with_padding', () => {
		const d = new Date(2024, 0, 5, 9, 3, 7);
		expect(formatDate(d, 'YYYY-mm-dd HH:MM:SS')).toBe('2024-01-05 09:03:07');
	});

	it('formats_single_digit_without_padding', () => {
		const d = new Date(2024, 0, 5, 9, 3, 7);
		expect(formatDate(d, 'Y-m-d H:M:S')).toBe('2024-1-5 9:3:7');
	});

	it('formats_month_and_day', () => {
		const d = new Date(2023, 11, 31);
		expect(formatDate(d, 'YYYY/mm/dd')).toBe('2023/12/31');
	});

	it('formats_quarter_QQQQ', () => {
		const q1 = new Date(2024, 0, 15);
		expect(formatDate(q1, 'YYYY年QQQQ')).toBe('2024年第一季度');
		const q3 = new Date(2024, 7, 1);
		expect(formatDate(q3, 'QQQQ')).toBe('第三季度');
	});

	it('formats_quarter_single_digit', () => {
		const d = new Date(2024, 3, 10);
		expect(formatDate(d, 'q')).toBe('2');
	});

	it('formats_week_WWW', () => {
		const sun = new Date(2024, 0, 7);
		expect(formatDate(sun, 'WWW')).toBe('星期日');
		const mon = new Date(2024, 0, 8);
		expect(formatDate(mon, 'WWW')).toBe('星期一');
		const sat = new Date(2024, 0, 13);
		expect(formatDate(sat, 'WWW')).toBe('星期六');
	});

	it('formats_week_WW', () => {
		const d = new Date(2024, 0, 9);
		expect(formatDate(d, 'WW')).toBe('周二');
	});

	it('formats_week_single_W', () => {
		const d = new Date(2024, 0, 11);
		expect(formatDate(d, 'W')).toBe('四');
	});

	it('formats_week_of_year_ZZZ', () => {
		const d = new Date(2024, 0, 10);
		expect(formatDate(d, 'ZZZ')).toMatch(/^第\d+周$/);
	});

	it('formats_combined_quarter_week_weekofyear', () => {
		const d = new Date(2024, 0, 15);
		const s = formatDate(d, 'YYYY-mm-dd WWW QQQQ ZZZ');
		expect(s).toContain('星期');
		expect(s).toContain('第');
		expect(s).toContain('季度');
	});
});

describe('getWeek', () => {
	it('returns_week_number_for_early_jan', () => {
		const d = new Date(2024, 0, 10);
		const w = getWeek(d);
		expect(Number.isInteger(w)).toBe(true);
		expect(w).toBeGreaterThan(0);
		expect(w).toBeLessThan(54);
	});

	it('returns_same_week_for_monday_and_friday', () => {
		const mon = new Date(2024, 0, 8);
		const fri = new Date(2024, 0, 12);
		expect(getWeek(mon)).toBe(getWeek(fri));
	});
});

describe('formatAxis', () => {
	it('returns_greetings_for_each_time_range', () => {
		expect(formatAxis(new Date(2024, 0, 1, 2, 30))).toBe('凌晨好');
		expect(formatAxis(new Date(2024, 0, 1, 7, 30))).toBe('早上好');
		expect(formatAxis(new Date(2024, 0, 1, 10, 30))).toBe('上午好');
		expect(formatAxis(new Date(2024, 0, 1, 13, 0))).toBe('中午好');
		expect(formatAxis(new Date(2024, 0, 1, 15, 30))).toBe('下午好');
		expect(formatAxis(new Date(2024, 0, 1, 18, 30))).toBe('傍晚好');
		expect(formatAxis(new Date(2024, 0, 1, 21, 0))).toBe('晚上好');
		expect(formatAxis(new Date(2024, 0, 1, 23, 30))).toBe('夜里好');
	});
});

describe('formatPast', () => {
	const now = new Date('2024-06-15T12:00:00');
	const nowMs = now.getTime();

	const fakeFrom = (msAgo: number) => new Date(nowMs - msAgo);

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns_刚刚_for_within_10_seconds', () => {
		expect(formatPast(fakeFrom(5 * 1000))).toBe('刚刚');
	});

	it('returns_N_secondsAgo_for_10s_to_1min', () => {
		expect(formatPast(fakeFrom(30 * 1000))).toBe('30秒前');
		expect(formatPast(fakeFrom(59 * 1000))).toBe('59秒前');
	});

	it('returns_N_minutesAgo_for_1min_to_1hour', () => {
		expect(formatPast(fakeFrom(3 * 60 * 1000))).toBe('3分钟前');
		expect(formatPast(fakeFrom(59 * 60 * 1000))).toBe('59分钟前');
	});

	it('returns_N_hoursAgo_for_1hour_to_24hours', () => {
		expect(formatPast(fakeFrom(2 * 3600 * 1000))).toBe('2小时前');
		expect(formatPast(fakeFrom(23 * 3600 * 1000))).toBe('23小时前');
	});

	it('returns_N_daysAgo_for_1day_to_3days', () => {
		expect(formatPast(fakeFrom(1 * 86400 * 1000))).toBe('1天前');
		expect(formatPast(fakeFrom(2 * 86400 * 1000))).toBe('2天前');
	});

	it('returns_formatted_date_for_beyond_3days', () => {
		const past = new Date(2024, 0, 5, 10, 0, 0);
		expect(formatPast(past, 'YYYY/mm/dd')).toBe('2024/01/05');
	});

	it('accepts_string_input', () => {
		expect(formatPast('2024-06-15T11:59:55')).toBe('刚刚');
	});
});