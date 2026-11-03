import { useRef } from 'react';
import { Modal, type ModalProps } from './Modal';
export interface ConfirmModalProps extends Omit<ModalProps, 'initialFocusRef'> {
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  busy?: boolean;
  confirmDisabled?: boolean;
}
/** Starts on Cancel. The owner closes only after its operation succeeds. */
export function ConfirmModal({ confirmLabel, cancelLabel = 'Cancel', onConfirm, busy = false, confirmDisabled = false, children, ...props }: ConfirmModalProps) {
  const cancel = useRef<HTMLButtonElement>(null);
  return <Modal {...props} initialFocusRef={cancel}>
    {children}
    <div className="ui-modal-actions">
      <button ref={cancel} type="button" className="pixel-btn--secondary" onClick={props.onClose}>{cancelLabel}</button>
      <button type="button" className="pixel-btn" disabled={busy || confirmDisabled} aria-busy={busy} onClick={onConfirm}>{confirmLabel}</button>
    </div>
  </Modal>;
}
