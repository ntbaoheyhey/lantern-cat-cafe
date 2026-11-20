import {it,expect} from 'vitest';
import {layoutLabels,intersects,type LabelInput} from './label-layout';
it('keeps nine cards separate from every head at desktop size',()=>{
 const input:LabelInput[]=Array.from({length:9},(_,i)=>({id:String(i),x:95+(i%5)*155,y:120+Math.floor(i/5)*80,height:i<3?31:45,head:{x:60+(i%5)*155,y:115+Math.floor(i/5)*80,width:60,height:55}}));
 const placed=layoutLabels(input,870,330);expect(placed.size).toBe(9);
 const boxes=[...placed.values()];for(let i=0;i<boxes.length;i++){for(let j=i+1;j<boxes.length;j++)expect(intersects(boxes[i]!,boxes[j]!)).toBe(false);for(const p of input)expect(intersects(boxes[i]!,p.head,5)).toBe(false)}
});
it('reports an impossible label without hiding a head or overlapping a card',()=>{
 const placed=layoutLabels([{id:'x',x:50,y:30,height:45,head:{x:0,y:0,width:100,height:80}}],100,80);
 expect(placed.size).toBe(0);
});

it('keeps enemy plates clear of companion silhouettes that have no floating label', () => {
 const companion = { x: 45, y: 30, width: 100, height: 180 };
 const input = [{ id: 'enemy', x: 130, y: 85, height: 48, head: { x: 175, y: 100, width: 70, height: 130 } }];
 const boxes = layoutLabels(input, 400, 280, 138, [companion]);
 expect(boxes.size).toBe(1);
 expect(intersects(boxes.get('enemy')!, companion, 5)).toBe(false);
});
