import {defineConfig,mergeConfig} from 'vite';
import base from '../../apps/web/vite.config';
export default mergeConfig(base,defineConfig({server:{fs:{allow:['/Users/bao/taskbar-hero-chain']}}}));
