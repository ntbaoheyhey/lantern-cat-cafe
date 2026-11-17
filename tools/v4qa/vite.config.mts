// Inherit the shipping configuration; no dotenv files or product-source edits.
import production from '/Users/bao/taskbar-hero-qa-clone/apps/web/vite.config';
export default { ...production, envDir: false };
