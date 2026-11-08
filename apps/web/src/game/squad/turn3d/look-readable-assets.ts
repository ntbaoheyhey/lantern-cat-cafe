import manifest from '../../cardrpg/look-assets.json';
const icons = import.meta.glob('../../../../../../assets/cardrpg-look/icons/*-1x.webp', {eager:true,query:'?url',import:'default'}) as Record<string,string>;
const portraits = import.meta.glob('../../../../../../assets/cardrpg-look/portraits/*-1x.webp', {eager:true,query:'?url',import:'default'}) as Record<string,string>;
const source = (path: string, urls: Record<string,string>) => urls[`../../../../../../${path}`];
export const readableSkillIcon = (id: string) => {const skill=manifest.skills[id as keyof typeof manifest.skills];return skill ? source(skill.icon1x,icons) : undefined;};
export const readablePortrait = (id: string) => {const cat=manifest.portraits[id as keyof typeof manifest.portraits];return cat ? source(cat.portrait['1x'],portraits) : undefined;};
export const readableName = (id: string) => id.split('-').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ');
