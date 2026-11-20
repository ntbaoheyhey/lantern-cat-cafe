/** Original painted summons deform around their own anatomy, at a fixed 30 fps.
 * The continuous mesh preserves the painting, including its transparent gaps.
 * All coordinates are fractions of the source image, with y increasing down.
 */
export const summonMotions = {
  biscuit: 'phoenix-wingbeat', brioche: 'owl-wingbeat', cinnamon: 'dragon-coil',
  clover: 'vine-unfurl', inkcap: 'tentacle-curl', mallow: 'lion-pounce',
  marigold: 'crane-wingbeat', mochi: 'lantern-resonance', panko: 'guardian-stomp',
  soot: 'comet-tail', sorrel: 'water-serpent', velvet: 'manta-fins',
  'yarn-giant': 'whale-tail',
};
const smooth = v => { const n = Math.max(0, Math.min(1, v)); return n*n*(3-2*n); };
const region = (x,y,cx,cy,rx,ry) => Math.exp(-2*((x-cx)**2/rx**2+(y-cy)**2/ry**2));

export function summonVertex(id, x, y, frame) {
  const t=frame/30, enter=smooth(frame/12), release=smooth((frame-41)/12);
  const pulse=Math.sin(t*7.5), lag=Math.sin(t*7.5-y*5), lower=smooth((y-.38)/.5);
  let dx=0,dy=0;
  switch (id) {
    case 'biscuit': case 'brioche': case 'marigold': {
      const hinge=id==='marigold'?.60:.42, wings=smooth((Math.abs(x-.5)-.08)/.35)*(1-smooth((y-hinge)/.25));
      const flap=Math.sin(t*7.2+(id==='biscuit'?.6:0));
      dx=(x-.5)*.11*flap*wings;dy=.075*flap*wings;
      dx+=.022*lag*lower;dy+=.018*Math.sin(t*7.2-1.3)*lower;
      break;
    }
    case 'clover': case 'cinnamon': case 'sorrel': {
      const coil=region(x,y,.52,.65,.62,.55), wave=Math.sin(t*6.7-y*5.5);
      dx=.033*wave*coil;dy=.027*Math.sin(t*6.7-x*5)*coil;
      // The head leads the coil; the lower vine/steam/water follows later.
      const head=region(x,y,id==='clover'?.67:.61,.25,.24,.19);
      dx+=head*(.022*pulse+.025*release);dy-=head*.016*pulse;
      break;
    }
    case 'inkcap': {
      const tentacles=1-region(x,y,.47,.30,.30,.24);
      dx=.035*Math.sin(t*5.8+y*7)*tentacles;dy=.03*Math.cos(t*5.8+x*8)*tentacles;
      break;
    }
    case 'mallow': case 'panko': {
      const paws=region(x,y,.27,.68,.23,.30), forward=region(x,y,.70,.80,.25,.29);
      // Opposite paws load, then reach into the release. The face stays planted.
      dx=.022*lag*lower+.027*release*(forward-paws);
      dy=.047*pulse*paws-.041*pulse*forward-.025*release*forward;
      const mane=region(x,y,.53,.34,.57,.4)*(1-region(x,y,.49,.43,.22,.21));
      dx+=.016*Math.sin(t*8-y*6)*mane;dy+=.011*Math.cos(t*8-x*6)*mane;
      break;
    }
    case 'mochi': {
      // Glass and brass remain firm. The hanging lights and outer wisps sway.
      const edges=smooth((Math.abs(x-.5)-.23)/.22), hem=smooth((y-.67)/.27);
      dx=.012*Math.sin(t*7-y*4)*edges+.01*pulse*hem;
      dy=.013*Math.sin(t*7-x*5)*hem;
      break;
    }
    case 'soot': {
      // A rigid leading ember in the lower left, with trailing plasma above it.
      const tail=smooth((x-y+.65)/1.2);
      dx=.037*Math.sin(t*10-y*7)*tail;dy=.045*Math.sin(t*10-x*6+.8)*tail;
      break;
    }
    case 'velvet': {
      const fins=smooth((Math.abs(x-.52)-.04)/.40)*(1-smooth((y-.58)/.23));
      dx=.026*pulse*fins*(x<.52?-1:1);dy=.065*Math.sin(t*6.5-x*2)*fins;
      dx+=.04*Math.sin(t*6.5-y*6)*lower;break;
    }
    case 'yarn-giant': {
      const tail=smooth((x+y-.65)/1.05), flipper=region(x,y,.43,.51,.22,.24);
      dx=.036*Math.sin(t*6-y*4)*tail;dy=.05*Math.sin(t*6-x*5)*tail+.03*pulse*flipper;
      break;
    }
  }
  return {x:x+dx*enter,y:y+dy*enter};
}
