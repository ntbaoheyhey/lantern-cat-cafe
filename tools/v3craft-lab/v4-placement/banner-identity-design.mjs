/** Private DOM authoring only. Keep source skill text and its computed glyph size. */
export async function decoratePrivateBanner({mode, baseline}) {
  const title = document.querySelector('.b3-focus-name');
  title.style.cssText = baseline.inlineStyle;
  title.replaceChildren();
  const owner = document.createElement('span');
  owner.dataset.bannerOwner = baseline.actor;
  owner.textContent = baseline.actorName;
  const skill = document.createElement('span');
  skill.dataset.bannerSkill = 'true';
  skill.textContent = baseline.text;
  let portraitDecoded = null;
  if (mode === 'named') {
    title.style.display = 'block';
    title.append(owner, document.createTextNode(' \u00b7 '), skill);
  } else {
    Object.assign(title.style, {width:'260px',display:'grid',gridTemplateColumns:'36px minmax(0,1fr)',
      columnGap:'10px',textAlign:'left',alignItems:'center'});
    const portrait = document.createElement('img');
    portrait.src = baseline.portraitSrc;
    portrait.alt = '';
    Object.assign(portrait.style, {width:'36px',height:'36px',boxSizing:'border-box',objectFit:'contain',
      borderRadius:'8px',border:'1px solid var(--element)',background:'#1b1824'});
    const copy = document.createElement('span');
    Object.assign(copy.style, {display:'flex',flexDirection:'column',gap:'2px',minWidth:'0'});
    copy.append(owner,skill);
    title.append(portrait,copy);
    try { await portrait.decode(); portraitDecoded = portrait.naturalWidth > 0; }
    catch { portraitDecoded = false; }
  }
  const r = title.getBoundingClientRect();
  return {x:r.x,y:r.y,width:r.width,height:r.height,portraitDecoded,
    skillFontSize:getComputedStyle(skill).fontSize,ownerFontSize:getComputedStyle(owner).fontSize,
    skillText:skill.textContent,ownerText:owner.textContent,
    horizontalOverflow:title.scrollWidth>title.clientWidth};
}
