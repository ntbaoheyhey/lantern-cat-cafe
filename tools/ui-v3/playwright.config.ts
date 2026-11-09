import {resolve} from 'node:path';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'specs',timeout:60000,expect:{timeout:15000},workers:1,reporter:[['list'],['json',{outputFile:resolve(__dirname,'../../reports/ui-v3/specs.json')}]],outputDir:resolve(__dirname,'../../reports/ui-v3/test-results'),use:{baseURL:'http://127.0.0.1:5950/tools/ui-v3/index.html',viewport:{width:1280,height:720},headless:true,trace:'retain-on-failure'}});
