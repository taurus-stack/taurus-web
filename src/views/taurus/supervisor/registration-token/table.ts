import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { auth } from '/@/utils/authFunction';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

export const getRegistrationTokenConfig = function (): any {
	return {
		container: {
			is: 'fs-layout-card',
		},
		actionbar: actionbar(auth('RegistrationToken:Create'), false, false),
		rowHandle: rowHandle(true, false, auth('RegistrationToken:Edit'), auth('RegistrationToken:Delete'), 'right', 160),
		columns: {
			search: {
				title: t('message.pages.registrationToken.table.columns.keyword'),
				column: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.registrationToken.form.keywordPlaceholder'),
					},
				},
				form: {
					show: false,
				},
			},
			id: {
				title: t('message.pages.registrationToken.table.columns.id'),
				type: 'input',
				column: {
					show: false,
				},
				form: {
					disabled: true,
					show: false,
				},
			},
			name: {
				title: t('message.pages.registrationToken.table.columns.name'),
				type: 'input',
				column: {
					show: true,
					minWidth: 150,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.registrationToken.form.nameRequired') }],
					component: {
						placeholder: t('message.pages.registrationToken.form.namePlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.registrationToken.form.namePlaceholder'),
					},
				},
			},
			token_prefix: {
				title: t('message.pages.registrationToken.table.columns.tokenPrefix'),
				type: 'text',
				column: {
					show: true,
					minWidth: 130,
				},
				form: {
					show: false,
				},
			},
			expires_at: {
				title: t('message.pages.registrationToken.table.columns.expiresAt'),
				type: 'datetime',
				column: {
					show: true,
					minWidth: 180,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.registrationToken.form.expiresAtRequired') }],
					component: {
						placeholder: t('message.pages.registrationToken.form.expiresAtPlaceholder'),
					},
				},
			},
			max_uses: {
				title: t('message.pages.registrationToken.table.columns.maxUses'),
				type: 'number',
				column: {
					show: true,
					minWidth: 120,
				},
				form: {
					show: true,
					value: 1,
					component: {
						placeholder: t('message.pages.registrationToken.form.maxUsesPlaceholder'),
					},
				},
			},
			used_count: {
				title: t('message.pages.registrationToken.table.columns.usedCount'),
				type: 'number',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: false,
				},
			},
			allowed_ips: {
				title: t('message.pages.registrationToken.table.columns.allowedIps'),
				type: 'textarea',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						type: 'textarea',
						rows: 3,
						placeholder: t('message.pages.registrationToken.form.allowedIpsPlaceholder'),
					},
					valueBuilder: ({ value }: any) => {
						if (Array.isArray(value)) {
							return value.join('\n');
						}
						return value || '';
					},
					valueResolve: ({ value }: any) => {
						if (typeof value === 'string') {
							return value.split('\n').filter((ip: string) => ip.trim());
						}
						return value;
					},
				},
			},
			auto_approve: {
				title: t('message.pages.registrationToken.table.columns.autoApprove'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.registrationToken.bool.yes'), value: true },
						{ label: t('message.pages.registrationToken.bool.no'), value: false },
					],
				}),
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					value: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.registrationToken.form.autoApprovePlaceholder'),
					},
				},
			},
			is_active: {
				title: t('message.pages.registrationToken.table.columns.isActive'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.registrationToken.enabled.enabled'), value: true },
						{ label: t('message.pages.registrationToken.enabled.disabled'), value: false },
					],
				}),
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					value: true,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.registrationToken.form.isActivePlaceholder'),
					},
				},
			},
			...commonCrudConfig({
				create_datetime: {
					table: true,
				},
				description: {
					form: true,
					search: true,
				},
			}),
		},
	};
};
