// Resolve both libraries through the same Vite module graph so quarks registers
// its custom shader chunks on the renderer's actual Three instance.
export * as T from 'three';
export {BatchedRenderer,ParticleSystem,ConstantValue,ConstantColor,SphereEmitter,RenderMode} from 'three.quarks';
import {registerShaderChunks} from 'three.quarks';
registerShaderChunks();
