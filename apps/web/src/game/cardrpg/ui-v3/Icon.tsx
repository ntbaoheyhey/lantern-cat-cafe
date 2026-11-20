import {GameIcon} from '../../../ui/GameIcon';
export type IconName='cats'|'team'|'bag'|'recruit'|'events'|'fight'|'menu'|'close'|'relic'|'chest'|'forge'|'market'|'season'|'guide'|'settings'|'wallet'|'arrow'|'check'|'plus'|'clock';
export function Icon({name}:{name:IconName}){return <GameIcon name={name==='recruit'?'invitations':name} size={32}/>;}
