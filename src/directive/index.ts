import type { App } from 'vue';
import { authDirective } from '/@/directive/authDirective';
import { wavesDirective, dragDirective } from '/@/directive/customDirective';
import {resizeObDirective} from '/@/directive/sizeDirective'
import { featureDirective } from '/@/directive/featureDirective';
/**
 * Export directive methods: v-xxx
 * @methods authDirective User permission directive, usage: v-auth
 * @methods wavesDirective Button wave directive, usage: v-waves
 * @methods dragDirective Custom drag directive, usage: v-drag
 * @methods featureDirective Edition Gate directive, usage: v-feature="'SCRIPT_APPROVAL_FLOW'"
 */
export function directive(app: App) {
	// User permission directive
	authDirective(app);
	// Edition Gate feature directive (M1)
	featureDirective(app);
	// Button wave directive
	wavesDirective(app);
	// Custom drag directive
	dragDirective(app);
	// Listen for window size changes
	resizeObDirective(app)
}
