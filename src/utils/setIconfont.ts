// Icon font URL
const cssCdnUrlList: Array<string> = [
	'//at.alicdn.com/t/font_2298093_y6u00apwst.css',
	'//at.alicdn.com/t/c/font_3882322_9ah7y8m9175.css'
	//'//netdna.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
];
// Third-party JS URL
const jsCdnUrlList: Array<string> = [];

// Dynamically batch-set icon fonts
export function setCssCdn() {
	if (cssCdnUrlList.length <= 0) return false;
	cssCdnUrlList.map((v) => {
		let link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = v;
		link.crossOrigin = 'anonymous';
		document.getElementsByTagName('head')[0].appendChild(link);
	});
}

// Dynamically batch-set third-party JS
export function setJsCdn() {
	if (jsCdnUrlList.length <= 0) return false;
	jsCdnUrlList.map((v) => {
		let link = document.createElement('script');
		link.src = v;
		document.body.appendChild(link);
	});
}

/**
 * Batch-set icon fonts and dynamic JS
 * @method cssCdn Dynamically batch-set icon fonts
 * @method jsCdn Dynamically batch-set third-party JS
 */
const setIntroduction = {
	// Set CSS
	cssCdn: () => {
		setCssCdn();
	},
	// Set JS
	jsCdn: () => {
		setJsCdn();
	},
};

// Export function methods
export default setIntroduction;
