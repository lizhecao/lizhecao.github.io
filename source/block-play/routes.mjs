export function parseRoute(hash,ids,lastModel='house'){
 const legacy={'#choose':'models','#learning':'lab','#mission-section':'missions','#install-section':'settings','#lesson':'build/'+lastModel};
 let path=legacy[hash]||hash.replace(/^#\/?/,'')||'models',page,id;
 try{[page,id]=path.split('/').map(decodeURIComponent);}catch{return {page:path.startsWith('lab/')?'lab':'models',notice:'没有找到这个内容，请重新选择。'};}
 if(['models','scenes','settings','lab','missions'].includes(page)&&!id)return {page};
 const list=['build','preview','ideas'].includes(page)?ids.models:page==='lab'?ids.labs:page==='missions'?ids.missions:null;
 if(list?.includes(id))return {page,id};
 return {page:page==='lab'?'lab':page==='missions'?'missions':'models',notice:'没有找到这个内容，请重新选择。'};
}
