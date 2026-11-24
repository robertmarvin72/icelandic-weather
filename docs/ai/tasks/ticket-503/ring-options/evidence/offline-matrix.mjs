import fs from "node:fs";
import handler from "../../../../../../api/winter-route-geometry.js";
import {loadGeometryDataset} from "../../../../../../api/_lib/winterRoute/geometryDataset.js";
const dataset=loadGeometryDataset(),byId=new Map(dataset.lines.map(l=>[l.sourceId,l]));
const rows=[];
for(const destination of ["selfoss","hella"])for(const option of ["south","north"])for(const[from,to]of[["reykjavik-raudavatn",destination],[destination,"reykjavik-raudavatn"]]){
let p,status;await handler({method:"GET",query:{from,to,option}},{setHeader(){},status(n){status=n;return this},json(v){p=v;return this}});
if(status!==200||p.status!=="geometry_only")throw Error("geometry failed");
const vertices=[];let d=0,prev=null;
for(const slice of p.slices){const l=byId.get(slice.sourceId);if(!l)continue;const step=slice.toIndex>=slice.fromIndex?1:-1;for(let i=slice.fromIndex;;i+=step){const v=l.vertices[i];if(prev)d+=Math.hypot(v.x-prev.x,v.y-prev.y);vertices.push({sourceId:l.sourceId,vertexIndex:i,idButur:l.idbutur,name:l.name,x:v.x,y:v.y,z:v.z,chainageKm:d/1000});prev=v;if(i===slice.toIndex)break;}}
const chosen=[vertices[0],vertices.at(-1)];const names=option==="south"?["Hellisheiði"]:["Holtavörðuheiði","Öxnadalsheiði","Mývatnsöræfi","Fagridalur"];
for(const name of names){const candidates=vertices.filter(v=>v.name.includes(name));if(!candidates.length)throw Error("missing named point "+name);const heightCandidates=candidates.filter(v=>Number.isFinite(v.z));const peak=heightCandidates.length?heightCandidates.reduce((a,b)=>a.z>=b.z?a:b):null;const midpoint=(candidates[0].chainageKm+candidates.at(-1).chainageKm)/2;chosen.push(peak&&peak.z>0?peak:candidates.reduce((a,b)=>Math.abs(a.chainageKm-midpoint)<=Math.abs(b.chainageKm-midpoint)?a:b));}
for(let target=100;target<d/1000;target+=100){const v=vertices.reduce((a,b)=>Math.abs(a.chainageKm-target)<=Math.abs(b.chainageKm-target)?a:b);if(chosen.every(q=>Math.abs(q.chainageKm-v.chainageKm)>=15&&Math.hypot(q.x-v.x,q.y-v.y)>=15000))chosen.push(v);}
const points=[...new Map(chosen.map(v=>[`${v.x}|${v.y}`,v])).values()].sort((a,b)=>a.chainageKm-b.chainageKm);
rows.push({from,to,option,status,geometryId:p.geometryId,datasetVersion:p.datasetVersion,policyVersion:p.policyVersion,lengthM:p.lengthM,estimatedConnectorLengthM:p.estimatedConnectorLengthM,idButurIds:[...new Set(p.slices.filter(s=>s.idbutur!=null).map(s=>s.idbutur))],pointCount:points.length,points});
}
fs.writeFileSync(new URL("./offline-matrix.json",import.meta.url),JSON.stringify({kind:"offline draft selection; no upstream requests",rule:"endpoints + named z-max if positive, otherwise nearest named-span midpoint; nearest100km vertices skipwithin15km; frozenpervariant",rows},null,2));
console.log(rows.map(r=>({from:r.from,to:r.to,option:r.option,km:Math.round(r.lengthM/1000),ids:r.idButurIds.length,points:r.pointCount})));
