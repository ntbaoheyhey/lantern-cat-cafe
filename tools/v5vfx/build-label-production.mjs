import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildProductionComparison,root} from './build-hud-production.mjs';
import {labelSearchSources} from './label-search-prototype.mjs';
export function buildLabelArtifacts(out){
 const {original,pruned,sourcePath,baselineRef,originalSha256,prunedSha256}=labelSearchSources();
 return buildProductionComparison(out,{modulePath:sourcePath,currentSource:original,variants:{baseline:original,pruned},metadata:{experiment:'label-search',modulePath:sourcePath,baselineRef,baselineModuleSha256:originalSha256,candidateModuleSha256:prunedSha256}});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await buildLabelArtifacts(process.env.CXV_PRODUCTION_OUT??resolve(root,'work/v5/CXV/films/V7-F-label-production'));
