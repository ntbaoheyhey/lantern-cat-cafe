import {GameIcon} from '../../../ui/GameIcon';

/** Compact visual labels keep the full meaning available to assistive tools. */
export function LevelMarkC2({level}:{level:number}) {
 return <span aria-label={`Level ${level}`} title={`Level ${level}`}><GameIcon name="upgrade" size={14}/> {level}</span>;
}

export function TaskProgressC2({icon,detail,complete}:{icon:string;detail:string;complete:boolean}) {
 const progress=detail.match(/\d+(?:\/\d+)?/)?.[0];
 return <><GameIcon name={icon} size={36}/> {progress??<span title={complete?'Complete':'Pending'}><GameIcon name={complete?'check':'clock'} size={18}/></span>}</>;
}

export function OddsMarkC2() {
 return <span aria-hidden="true"><GameIcon name="season" size={20}/> %</span>;
}
