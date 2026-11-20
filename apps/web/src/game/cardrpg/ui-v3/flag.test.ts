import {describe,expect,it} from 'vitest';
import {uiV3Enabled} from './flag';
describe('UI v3 opt-in',()=>{
 it('keeps product legacy unless explicitly selected',()=>{expect(uiV3Enabled('',false)).toBe(false);expect(uiV3Enabled('?ui=v3',false)).toBe(true);expect(uiV3Enabled('?ui=v2',false)).toBe(false);});
 it('allows demo opt-in and an explicit legacy comparison',()=>{expect(uiV3Enabled('',true)).toBe(true);expect(uiV3Enabled('?ui=legacy',true)).toBe(false);});
});
