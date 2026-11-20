import production from '../../../apps/web/vite.config';

// The shipping configuration, with all VITE values supplied explicitly by start.mjs.
export default { ...production, envDir: false };
