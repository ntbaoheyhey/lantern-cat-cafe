import { expect, it } from 'vitest';
import { targetCallout } from './card-callout-layout';
import { intersects, layoutLabels, type Rect } from './label-layout';

it('keeps simultaneous words near their own heads without covering plates or the moment card',()=>{
  for(const width of [864,1096,1256]){
    const obstacles:Rect[]=[{x:12,y:8,width:132,height:100}];
    const targets=[{x:width*.65,y:180},{x:width*.80,y:165},{x:width*.90,y:230}];

    for(const t of [...targets].sort((a,b)=>a.y-b.y)){
      const word=targetCallout(t.x,t.y,width,400,width<900?138:150,obstacles)!;
      expect(word).toBeDefined();
      expect(obstacles.some(r=>intersects(word,r,3))).toBe(false);
      expect(Math.abs(word.x+word.width/2-t.x)).toBeLessThanOrEqual(90);
      expect(word.y+word.height).toBeLessThan(t.y);
      expect(word.x).toBeGreaterThanOrEqual(6);
      expect(word.x+word.width).toBeLessThanOrEqual(width-6);
      obstacles.push(word);
    }
    const plates=layoutLabels(targets.map((t,i)=>({id:String(i),...t,height:56,head:{x:t.x-25,y:t.y,width:50,height:80}})),width,400,138,obstacles);
    expect(plates.size).toBe(3);
    for(const plate of plates.values())expect(obstacles.some(r=>intersects(plate,r,3))).toBe(false);
  }
});
