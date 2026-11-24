import fs from "node:fs";
import handler from "../../../../../../api/winter-route-geometry.js";
import {loadGeometryDataset} from "../../../../../../api/_lib/winterRoute/geometryDataset.js";
import {RING_OPTION_POINTS} from "../../../../../../api/_lib/winterRoute/ringOptionsRoute.js";
const d=loadGeometryDataset(),lines=new Map(d.lines.map(l=>[l.sourceId,l]));
const fresh=[];for(const id of["egilsstadir","seydisfjordur"]){const e=d.endpoints[id],l=lines.get(e.sourceId),i=l.vertices.findIndex(v=>v.x===e.x&&v.y===e.y);fresh.push({id:`${id}-route`,sourceId:l.sourceId,vertexIndex:i,...l.vertices[i]});}
const mountain=d.lines.filter(l=>l.name.includes("Fjarðarheiði")).flatMap(l=>l.vertices.map((v,i)=>({id:"fjardarheidi-route",sourceId:l.sourceId,vertexIndex:i,...v}))).reduce((a,b)=>a.z>=b.z?a:b);fresh.push(mountain);
const pool=[...RING_OPTION_POINTS.map(p=>({...p,x:p.nativeX,y:p.nativeY,z:p.nativeZ})),...fresh];
const places=["reykjavik-raudavatn","selfoss","hella","egilsstadir","seydisfjordur"],rows=[];
for(let a=0;a<places.length;a++)for(let b=a+1;b<places.length;b++){if(a===0&&(b===1||b===2))continue;for(const[from,to]of[[places[a],places[b]],[places[b],places[a]]]){let p,status;await handler({method:"GET",query:{from,to}},{setHeader(){},status(n){status=n;return this},json(v){p=v;return this}});if(status!==200||p.status!=="geometry_only")throw Error("bad geometry");
const cumulative=[0];for(let i=1;i<p.coordinates.length;i++)cumulative.push(cumulative.at(-1)+Math.hypot(p.coordinates[i].x-p.coordinates[i-1].x,p.coordinates[i].y-p.coordinates[i-1].y));
const on=pool.map(q=>({...q,index:p.coordinates.findIndex(v=>v.x===q.x&&v.y===q.y)})).filter(q=>q.index>=0).map(q=>({...q,chainageKm:cumulative[q.index]/1000})).sort((a,b)=>a.chainageKm-b.chainageKm);
const endpointIds=[from==="reykjavik-raudavatn"?"raudavatn-route":`${from}-route`,to==="reykjavik-raudavatn"?"raudavatn-route":`${to}-route`];
const chosen=on.filter(q=>endpointIds.includes(q.id)||["holtavorduheidi-route","oxnadalsheidi-route","myvatnsoraefi-route","fjardarheidi-route"].includes(q.id));
for(const q of on){if(!chosen.some(v=>v.id===q.id)&&chosen.every(v=>Math.abs(v.chainageKm-q.chainageKm)>=15&&Math.hypot(v.x-q.x,v.y-q.y)>=15000))chosen.push(q);}
chosen.sort((a,b)=>a.chainageKm-b.chainageKm);rows.push({from,to,geometryId:p.geometryId,datasetVersion:p.datasetVersion,lengthM:p.lengthM,idButurIds:[...new Set(p.slices.map(v=>v.idbutur).filter(v=>v!=null))],pointIds:chosen.map(q=>q.id),points:chosen,unmappedLengthM:p.slices.filter(v=>v.idbutur==null).reduce((n,v)=>n+v.lengthM,0)});}}
fs.writeFileSync(new URL("./offline-matrix.json",import.meta.url),JSON.stringify({kind:"offline fixed selection; no upstream calls",newPoints:fresh,rows},null,2));console.log(JSON.stringify({newPoints:fresh,rows:rows.map(r=>({from:r.from,to:r.to,km:Math.round(r.lengthM/1000),count:r.points.length,ids:r.idButurIds.length}))},null,2));
