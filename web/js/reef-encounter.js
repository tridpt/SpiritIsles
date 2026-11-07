// Region rules derive from the saved encounter. Old patrols retain their teams.
export const REEF_PATROLS=['Đội Gác Bãi Ngọc','Đội Canh Cầu Sóng','Đội Giữ Rạn Sâu','Đội Tuần Tra Ngọc Trai'];
export const reefPatrol=run=>run?.biome==='reef'&&!!run.squad&&!run.battle?.boss&&REEF_PATROLS.includes(run.battle?.enemy);
export const REEF_ENEMIES=[
  {id:'enemy-0',species:'pebbleturtle',name:'Cua Đá',element:'water'},
  {id:'enemy-1',species:'moonjelly',name:'Sứa Tích Điện',element:'shadow'},
  {id:'enemy-2',species:'axolotl',name:'Sò Ngọc Chữa Lành',element:'water'}
];
export function reefEvent(run){
  if(run?.biome!=='reef')return null;
  const sites=[['Bãi ngọc lúc triều xuống','Bờ cát êm vòng qua vũng nước. Ngoài cầu gỗ, rạn sâu lấp lánh nhưng quái mạnh hơn.'],['Cây cầu qua rạn san hô','Cả đội dừng bên chiếc cầu cũ. Đi sát bờ để nghỉ chân, hoặc vượt cầu tìm rương chìm.'],['Tiếng hát dưới vỏ sò','Tiếng hát vọng lên từ rạn sâu. Một lối cát yên bình vẫn đang chờ bên bờ.'],['Dấu chân bên hải đăng','Ánh đèn chỉ về rạn ngọc. Cả đội có thể lấy sức trên bờ trước khi tiếp tục.']];
  const [title,text]=sites[run.event%sites.length];
  return {title,text,choices:[
    {text:'Bờ cát · An toàn',icon:'heart',heal:12,reward:{gold:28,food:10},threat:1,detail:'Hồi 12 HP · quái thường'},
    {text:'Rạn sâu · Mạo hiểm',icon:'gem',reward:{gold:65,crystals:10},threat:1.3,detail:'Quái mạnh hơn 30% · nhiều ngọc hơn'}
  ]};
}
export function reefWarning(run){
  if(run?.biome!=='reef'||!run.battle?.boss||(run.battle.round+1)%3!==0)return null;
  return {id:'tidal-wave',name:'Sóng triều',title:'SÓNG TRIỀU ĐANG TỚI',button:'Né sóng ngay',text:'Cua đang gọi sóng! Né giảm 85% sát thương và mở bụng boss: đòn kế tiếp +20%.',icon:'waves',danger:true,multiplier:1.5,evadeFactor:.15};
}
export const reefOpening=run=>run?.biome==='reef'&&!!run.battle?.boss&&!!run.battle.rhythm?.exposed;
export function reefSkin(run,unit){
  if(run?.biome!=='reef')return null;
  if(run.battle?.boss){if(!run.campaign||unit.id==='enemy-0')return {kind:'crab',name:run.battle.enemy,boss:true};return {kind:unit.id==='enemy-1'?'jelly':'clam',name:unit.id==='enemy-1'?'Sứa Tích Điện':'Sò Ngọc Chữa Lành',boss:false};}
  if(!reefPatrol(run))return null;
  const index=REEF_ENEMIES.findIndex(e=>e.id===unit.id&&e.species===unit.species);
  return index<0?null:{kind:['crab','jelly','clam'][index],name:REEF_ENEMIES[index].name,boss:false};
}
