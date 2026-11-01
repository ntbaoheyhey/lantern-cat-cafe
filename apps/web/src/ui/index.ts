/**
 * Shared UI API (CXU4): import components and their typed props from this module.
 * Modal: controlled open/title/onClose/children, optional description and focus refs.
 * Portals to body; traps focus, makes background inert, closes on Escape/backdrop,
 * restores opener on close/unmount. ConfirmModal adds confirmLabel/onConfirm,
 * confirmDisabled/busy; starts on Cancel. Owners handle async results and closing.
 * ToastHost: controlled readonly ToastMessage[] + onDismiss(id). Stable unique IDs.
 * Toast: success/warning dismiss after 8000ms (durationMs override); hover/focus
 * pauses and restarts that interval. Errors persist until explicitly dismissed.
 * Each toast announces via status/polite or alert/assertive; no focus stealing.
 * Banner: tone offline/error/warning + children, optional action {label,onAction};
 * persistent, defaults to status/polite. Existing API/store owns connectivity.
 * EmptyState: title + children + optional illustration/action, no implicit actions.
 * Tabs: label + ScreenTab[] {id,label,content}, optional initialTab. Keeps panels
 * mounted but hidden; arrows/Home/End activate tabs. HeroScreen.additionalTabs
 * accepts Pets; HelpTab.additionalTabs accepts Compendium/Odds/On-chain proof.
 * No timers, game state, network calls or mechanics are introduced by tab hosts.
 */
import './ui.css';
export { Modal, type ModalProps } from './Modal';
export { ConfirmModal, type ConfirmModalProps } from './ConfirmModal';
export { Toast, ToastHost, TOAST_DURATION_MS, type ToastTone, type ToastMessage, type ToastProps, type ToastHostProps } from './Toast';
export { Banner, type BannerProps } from './Banner';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Tabs, type ScreenTab, type TabsProps } from './Tabs';
