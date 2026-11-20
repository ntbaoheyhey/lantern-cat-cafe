/** Private banner drills. Preserve measured text size and hold one position per action. */
export function placePrivateBanner(geometry, mode, previous) {
  if (previous) return {...previous, held: true};
  const {title, caster, width, height, hud, faces, labels} = geometry;
  const pad = (r, amount) => ({x:r.x-amount,y:r.y-amount,width:r.width+2*amount,height:r.height+2*amount});
  const area = (a,b) => Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)) * Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  const obstacles = [...hud.map(r=>pad(r,8)),...faces.map(r=>pad(r,12)),
    ...geometry.bodies.map(r=>pad(r,6)),...labels.map(r=>pad(r.rect,8))];
  const fit = p => ({x:Math.max(8,Math.min(width-title.width-8,p.x)),y:Math.max(8,Math.min(height-title.height-8,p.y)),width:title.width,height:title.height});
  if (mode === 'vertical') {
    let box = fit(title);
    for (const obstacle of hud) {
      if (!area(pad(box,8),obstacle)) continue;
      box = fit({...box,y:obstacle.y>height/2?obstacle.y-box.height-8:obstacle.y+obstacle.height+8});
    }
    return {...box,feasible:!obstacles.some(r=>area(box,r)>0),held:false};
  }
  const midY = caster.y + caster.height*.35;
  const candidates = [
    {x:caster.x+caster.width+8,y:midY},
    {x:caster.x-title.width-8,y:midY},
    {x:caster.x+(caster.width-title.width)/2,y:caster.y-title.height-12},
    {x:caster.x+(caster.width-title.width)/2,y:caster.y+caster.height+8},
  ].map(fit);
  const score = box => (box.x+box.width/2-(caster.x+caster.width/2))**2 + (box.y+box.height/2-(caster.y+caster.height/2))**2;
  const clear = box => !obstacles.some(r=>area(box,r)>0);
  let available = candidates.filter(clear);
  if (!available.length) {
    for(let y=8;y<=height-title.height-8;y+=12)
      for(let x=8;x<=width-title.width-8;x+=16) {
        const box={x,y,width:title.width,height:title.height};
        if(clear(box)) available.push(box);
      }
  }
  const selected = available.sort((a,b)=>score(a)-score(b))[0];
  return {...(selected??fit(title)),feasible:!!selected,held:false};
}
