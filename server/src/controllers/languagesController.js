import { LANGUAGES, SUPPORTED_PAIRS, supportedTargets } from '../utils/languages.js';
export function languages(req,res){res.json({success:true,languages:Object.values(LANGUAGES)});}
export function pairs(req,res){res.json({success:true,pairs:SUPPORTED_PAIRS,targetsBySource:Object.fromEntries(Object.keys(LANGUAGES).map(k=>[k,supportedTargets(k)]))});}
