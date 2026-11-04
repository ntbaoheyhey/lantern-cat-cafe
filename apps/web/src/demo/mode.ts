/** Only the dedicated offline config enables this. Normal builds keep their existing behaviour. */
export const isOfflineDemo = () => import.meta.env.VITE_OFFLINE_DEMO === '1';
export const DEMO_STACK_SHA = '1eefc3ef6d828b06710c8be18feb08e90b099e3e';
export const DEMO_BAR_HEIGHT = 44;
