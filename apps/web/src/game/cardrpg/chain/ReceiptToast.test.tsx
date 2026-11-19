import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {ReceiptToast} from './ReceiptToast';
import type {ReceiptProof} from './receipt-proof';

// Synthetic presentation fixture only; this is not transaction evidence.
const proof:ReceiptProof={hash:`0x${'a'.repeat(64)}`,wallet:`0x${'1'.repeat(40)}`,payer:`0x${'2'.repeat(40)}`,
 action:'mint',feeAvax:'0.000021',confirmationMs:750,confirmedAt:1000,block:'3',gasSource:'cafe',local:true};
afterEach(cleanup);
const publish=(value:ReceiptProof)=>act(()=>window.dispatchEvent(new CustomEvent('chain:receipt',{detail:value})));
describe('receipt details',()=>{
 it('only shows received proof, with visible full hash, actual payer and fee',()=>{
  render(<ReceiptToast/>);expect(screen.queryByRole('status')).toBeNull();publish(proof);
  expect(screen.getByText(proof.hash)).toBeTruthy();expect(screen.getByText(proof.payer)).toBeTruthy();
  expect(screen.getByText('0.000021 AVAX')).toBeTruthy();expect(screen.getByText('Gas funding: Café')).toBeTruthy();
  expect(screen.getByText('Local test receipt')).toBeTruthy();expect(screen.queryByRole('link')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Dismiss receipt'}));expect(screen.queryByRole('status')).toBeNull();
 });
 it('links a public Fuji receipt to its own hash and keeps unavailable timing explicit',()=>{
  render(<ReceiptToast/>);publish({...proof,local:false,confirmationMs:null,gasSource:'wallet'});
  expect(screen.getByRole('link',{name:'View on Fuji explorer · Snowtrace'}).getAttribute('href')).toBe(`https://testnet.snowtrace.io/tx/${proof.hash}`);
  expect(screen.getByText('Timing unavailable')).toBeTruthy();expect(screen.getByText('Gas funding: wallet')).toBeTruthy();
 });
 it('labels a fixture visibly, provides no explorer link and never stores it as a receipt',()=>{
  localStorage.clear();render(<ReceiptToast fixture/>);
  expect(screen.getByRole('status',{name:'Fixture receipt — no transaction'})).toBeTruthy();
  expect(screen.getByText('Avalanche Fuji · fixture, not submitted')).toBeTruthy();
  expect(screen.queryByRole('link')).toBeNull();expect(localStorage.length).toBe(0);
 });
});
