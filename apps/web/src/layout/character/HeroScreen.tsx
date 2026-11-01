import { useId, useRef, useState } from 'react';
import { v2 } from '@taskbar-hero/game-rules';
import { ConfirmModal, Tabs, ToastHost, type ScreenTab, type ToastMessage } from '../../ui';
import { CharacterPanel, type CharacterPanelProps } from './CharacterPanel';

export interface HeroScreenProps extends Omit<CharacterPanelProps, 'compact' | 'onChangeClass'> {
  /** Resolves true only when the existing game loop adopted the requested class. */
  onChooseClass: (classId: v2.ClassId) => Promise<boolean>;
  additionalTabs?: readonly ScreenTab[];
}
export function HeroScreen({ state, onSelectSlot, onChooseClass, classBusy = false, additionalTabs = [] }: HeroScreenProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<v2.ClassId>(state.cat.classId ?? v2.CLASSES[0]!.id);
  const [pending, setPending] = useState(false);
  const flight = useRef(false);
  const generation = useRef(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [error, setError] = useState('');
  const dismiss = (toastId: string) => setToasts(items => items.filter(item => item.id !== toastId));
  const close = () => { generation.current++; setOpen(false); };
  const confirm = async () => {
    if (flight.current || classBusy || selected === state.cat.classId) return;
    flight.current = true;
    const request = generation.current;
    setPending(true); setError('');
    let success = false;
    try { success = await onChooseClass(selected); } catch { success = false; }
    flight.current = false; setPending(false);
    const message = success ? `Class changed to ${v2.CLASSES.find(cls => cls.id === selected)!.name}.` : 'Class change did not go through. Try again.';
    setToasts(items => [...items.filter(item => item.id !== 'class-result'), { id: 'class-result', tone: success ? 'success' : 'error', message }]);
    if (request === generation.current) {
      if (success) setOpen(false); else setError(message);
    }
  };
  return <>
    <Tabs label="Hero sections" tabs={[{ id: 'character', label: 'Character', content: <CharacterPanel state={state} onSelectSlot={onSelectSlot}
      classBusy={classBusy || pending} onChangeClass={() => { generation.current++; setSelected(state.cat.classId ?? v2.CLASSES[0]!.id); setError(''); setOpen(true); }} /> }, ...additionalTabs]} />
    <ConfirmModal open={open} title="Change class" description="You can switch back any time outside boss fights."
      onClose={close} confirmLabel={pending ? 'Choosing...' : 'Confirm class'} confirmDisabled={classBusy || selected === state.cat.classId} busy={pending} onConfirm={() => { void confirm(); }}>
      <label htmlFor={`${id}-class`}>Cat class</label>
      <select id={`${id}-class`} value={selected} disabled={pending || classBusy} onChange={event => setSelected(event.target.value as v2.ClassId)}>
        {v2.CLASSES.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
      </select>
      {error && <p role="alert">{error}</p>}
    </ConfirmModal>
    <ToastHost toasts={toasts} onDismiss={dismiss} />
  </>;
}
