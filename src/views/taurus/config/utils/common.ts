import { ActionbarProps, RefableType, RowHandleProps } from '@fast-crud/fast-crud';
import { router } from '/@/router/index';
import { i18n } from '/@/i18n';
const t = i18n.global.t;

export const actionbar = (
	add: boolean = false,
	edit: boolean = false,
	remove: boolean = false
): ActionbarProps | RefableType<ActionbarProps | any, undefined> => ({
	buttons: {
		edit: {
			show: edit,
		},
		add: {
			show: add,
		},
		remove: {
			show: remove,
		},
	},
});

export const rowHandle = (
	view: boolean = false,
	copy: boolean = false,
	edit: boolean = false,
	remove: boolean = false,
	fixed: 'left' | 'right' | 'center' = 'right',
	width: number = 200,
	size: 'small' | 'default' | 'large' = 'default',
	loadMetrics: boolean = false
): RowHandleProps | RefableType<RowHandleProps | any, undefined> => {
	return {
		minWidth: width,
		fixed,
		buttons: {
			view: {
				show: view,
				type: 'default',
				buttonProps: {
					text: true,
					type: 'default',
					size: size,
				},
			},
			copy: {
				show: copy,
				buttonProps: {
					text: true,
					type: 'success',
					size: size,
				},
			},
			edit: {
				show: edit,
				type: 'primary',
				buttonProps: {
					text: true,
					type: 'primary',
					size: size,
				},
			},
			remove: {
				show: remove,
				type: 'danger',
				buttonProps: {
					type: 'danger',
					size: size,
					text: true,
				},
			},
			loadMetrics: {
				show: loadMetrics,
				text: t('message.hostLoad'),
				type: 'info',
				buttonProps: {
					text: true,
					type: 'primary',
					size: size,
				},
				click: ({ row }: any) => {
					// Will be overridden in crud.tsx
				},
			},
		},
	};
};