import fs from "node:fs";
import handler from "../../../../../../api/winter-route-geometry.js";
import { composeGeometryPath } from "../../../../../../api/_lib/winterRoute/geometryComposition.js";
import { loadWestfjordsCombinedRegionDataset } from "../../../../../../api/_lib/winterRoute/westfjordsCombinedRegionDataset.js";
import { WESTFJORDS_BATCH_POINTS } from "../../../../../../api/_lib/winterRoute/westfjordsBatchRoute.js";
import { BUDARDALUR_HOLMAVIK_FORECAST_POINTS } from "../../../../../../api/_lib/winterRoute/budardalurHolmavikRoute.js";
const region=loadWestfjordsCombinedRegionDataset(),lines=[...region.lines,...region.connectors];
const defs=[["isafjordur-route",3834,5],["dynjandisheidi-route",3008,20],["gemlufallsheidi-route",2993,5],["sudavikurhlid-route",3535,0],["vatnsfjardarhals-route",3148,14],["steingrimsfjardarheidi-route",3415,18]];
const added=defs.map(([id,sourceId,vertexIndex])=>({id,sourceId,vertexIndex,...lines.find(l=>l.sourceId===sourceId).vertices[vertexIndex]}));
const points=[...new Map([...WESTFJORDS_BATCH_POINTS,...BUDARDALUR_HOLMAVIK_FORECAST_POINTS].map(p=>[p.id,{id:p.id,x:p.nativeX,y:p.nativeY}])).values(),...added];
const pairs=[["budardalur","isafjordur"],["flokalundur","isafjordur"],["isafjordur","holmavik"],["isafjordur","patreksfjordur"],["isafjordur","talknafjordur"],["flokalundur","holmavik"],["holmavik","patreksfjordur"],["holmavik","talknafjordur"]];
const rows=[],ids=new Set(),used=new Set();
for(const[a,b]of pairs)for(const[from,to]of[[a,b],[b,a]]){
let payload,status;const res={setHeader(){},status(n){status=n;return this},json(v){payload=v;return this}};await handler({method:"GET",query:{from,to}},res);
const combined=composeGeometryPath({crs:region.crs,tier:region.tier,lines,from:{placeId:from,...region.endpoints[from]},to:{placeId:to,...region.endpoints[to]}});
const coords=payload.coordinates;const on=points.map(p=>({...p,index:coords.findIndex(c=>c.x===p.x&&c.y===p.y)})).filter(p=>p.index>=0 && (!p.id.startsWith("throskuldar-") || payload.idButurIds.includes(907000037))).sort((a,b)=>a.index-b.index);
for(const id of payload.idButurIds)ids.add(id);for(const p of on)used.add(p.id);
rows.push({from,to,status,geometryId:payload.geometryId,combinedIdentityMatches:payload.geometryId===combined.geometryId,lengthM:payload.lengthM,idButurIds:payload.idButurIds,points:on.map(p=>p.id),unmappedLengthM:payload.slices.filter(s=>s.idbutur==null).reduce((n,s)=>n+s.lengthM,0)});
}
fs.writeFileSync(new URL("./offline-matrix.json",import.meta.url),JSON.stringify({kind:"offline only; no upstream requests",newPoints:added,unionIdButurCount:ids.size,unionPointCount:used.size,rows},null,2));
