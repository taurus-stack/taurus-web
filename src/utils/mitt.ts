// https://www.npmjs.com/package/mitt
import mitt, { Emitter } from 'mitt';

// Types
const emitter: Emitter<MittType> = mitt<MittType>();

// Export
export default emitter;
