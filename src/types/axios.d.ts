/* eslint-disable */
import * as axios from 'axios';

// Extend axios response data type; extend as needed
declare module 'axios' {
	export interface AxiosResponse<T = any> {
		code: number;
		data: T;
		message: string;
		type?: string;
		[key: string]: T;
	}
}
