import type {ReceiptProof} from './receipt-proof';
/** Presentation-only fixture. Never publish to receipt storage or a public explorer. */
export const RECEIPT_FIXTURE:ReceiptProof={hash:`0x${'0'.repeat(64)}`,wallet:`0x${'1'.repeat(40)}`,payer:`0x${'1'.repeat(40)}`,
 action:'mint',feeAvax:'0.000021',confirmationMs:750,confirmedAt:0,block:'0',gasSource:'cafe',local:true};
