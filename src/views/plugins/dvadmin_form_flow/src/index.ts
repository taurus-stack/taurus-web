// Import dependencies
import DVAFormDesigner from './components/DVAFormDesigner.vue'

// Form flow component registration
const components = [
    DVAFormDesigner
]

// Define install method
const install = function (Vue) {

    if (install.installed) return
    install.installed = true
    // Register component globally
    components.map(component => {
        Vue.component(component.name, component) // Use the component name from the .vue file
    })
}

if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue)
}

export default {
    // The plugin must provide an install method
    install,
    // Export components
    ...components
}
