// Optional encounter data belongs only to newly started volcanic battles.
// Existing expeditions keep their species, health and original combat rules.
export const VOLCANO_ARMOR=45;
export const VOLCANO_PATROLS=['Đội Gác Miệng Núi','Bầy Săn Than Hồng','Đội Canh Cầu Đá','Đội Giữ Lò Dung Nham'];
export const VOLCANO_ENEMIES=[
  {id:'enemy-0',species:'pebbleturtle',name:'Hộ Vệ Đá',element:'fire'},
  {id:'enemy-1',species:'flamefox',name:'Sói Than Hồng',element:'fire'},
  {id:'enemy-2',species:'emberbird',name:'Chim Tro Lửa',element:'fire'}
];
export const volcanoActive=run=>run?.biome==='volcano'&&!!run.battle?.volcano;
export const volcanoPatrol=run=>volcanoActive(run)&&!!run.squad&&!run.battle.boss&&VOLCANO_PATROLS.includes(run.battle.enemy);
export const volcanoOpening=run=>volcanoActive(run)?run.battle.volcano.opening:0;
export function validateVolcano(run){
  const b=run.battle;if(!b||!Object.hasOwn(b,'volcano'))return;
  const v=b.volcano;
  if(run.biome!=='volcano'||!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==3||v.version!==1||!Number.isInteger(v.armor)||v.armor<0||v.armor>VOLCANO_ARMOR||!Number.isInteger(v.opening)||v.opening<0||v.opening>2||v.armor>0&&v.opening>0||!b.boss&&(v.armor||v.opening))throw new Error('Giáp và điểm yếu vùng núi lửa không hợp lệ.');
}
export function volcanoEvent(run){
  if(run?.biome!=='volcano')return null;
  const sites=[['Dấu chân trên tro nóng','Lối đá đen dẫn tới một suối ấm. Ngoài khe dung nham, quặng sao sáng rực giữa đàn quái.'],['Cầu đá bên miệng núi','Những tiếng đá nứt vọng từ bên dưới. Chọn đường vòng nghỉ sức, hoặc vượt khe tìm quặng.'],['Tiếng hú giữa tàn than','Bầy sói đang tuần tra bãi tro. Cả đội dừng lại chọn lối đi tiếp.'],['Ánh lửa từ lò cổ','Vảy đá của con rồng phủ kín lối cuối. Hãy chuẩn bị trước khi bước vào lãnh địa của nó.']];
  const [title,text]=sites[run.event%sites.length];
  return {title,text,choices:[
    {text:'Suối ấm · An toàn',icon:'heart',heal:14,reward:{gold:35,food:12},threat:1,detail:'Hồi 14 HP · quái thường'},
    {text:'Khe quặng · Mạo hiểm',icon:'gem',reward:{gold:80,crystals:14},threat:1.35,detail:'Quái mạnh hơn 35% · thêm ngọc'}
  ]};
}
export function volcanoWarning(run){
  if(!volcanoActive(run))return null;
  const b=run.battle,phase=b.round%4;
  if(b.boss&&[1,3].includes(phase))return phase===1?
    {id:'stone-slam',name:'Dậm vỡ nền',title:'RỒNG SẮP DẬM ĐẤT',button:'Né sang nền đá',text:'Rồng nhấc chân! Đòn dậm đánh cả đội. Né dùng 1 lượt, giảm 85% sát thương.',icon:'shield',danger:true,multiplier:1.45,evadeFactor:.15}:
    {id:'fire-breath',name:'Hơi thở dung nham',title:'RỒNG SẮP PHUN LỬA',button:'Tránh luồng lửa',text:'Cổ rồng sáng đỏ! Hơi lửa quét cả đội. Né dùng 1 lượt, giảm 85% sát thương.',icon:'flame',danger:true,multiplier:1.65,evadeFactor:.15};
  if((b.round+1)%3===0)return {id:'lava-eruption',name:'Dung nham phun',title:'DUNG NHAM SẮP PHUN',button:'Sang nền đá',text:'Vết nứt phát sáng dưới chân. Né giảm 85% sát thương; phá thế không ngăn được dung nham.',icon:'flame',danger:true,multiplier:1,evadeFactor:.15,environment:true};
  return null;
}
export function volcanoArmorHit(run,damage,move,result){
  if(!volcanoActive(run)||!run.battle.boss||damage<=0)return damage;
  const v=run.battle.volcano;
  if(v.armor){
    const shatter=move==='skill'||result.breakShield;
    const removed=Math.min(v.armor,Math.max(1,Math.round(damage*(shatter?1.6:result.pierce?1.2:.65))));
    v.armor-=removed;result.volcanoArmorDamage=removed;
    if(!v.armor){v.opening=2;result.volcanoArmorBroken=true;}
    return Math.round(damage*(result.pierce?.85:.45));
  }
  if(v.opening){v.opening--;result.volcanoWeakness=true;return Math.round(damage*1.6);}
  return damage;
}
export function volcanoSkin(run,unit){
  if(!volcanoActive(run))return null;
  if(run.battle.boss){if(!run.campaign||unit.id==='enemy-0')return {kind:'dragon',name:run.battle.enemy,boss:true};return {kind:unit.id==='enemy-1'?'wolf':'bird',name:unit.id==='enemy-1'?'Sói Than Hồng':'Chim Tro Lửa',boss:false};}
  if(!volcanoPatrol(run))return null;
  const i=VOLCANO_ENEMIES.findIndex(e=>e.id===unit.id&&e.species===unit.species);
  return i<0?null:{kind:['golem','wolf','bird'][i],name:VOLCANO_ENEMIES[i].name,boss:false};
}
export function volcanoCaption(r){
  return `${r.volcanoArmorDamage?` · Phá ${r.volcanoArmorDamage} giáp đá`:''}${r.volcanoArmorBroken?' · VỠ GIÁP! Hai đòn tới +60% sát thương':''}${r.volcanoWeakness?' · Trúng điểm yếu +60%':''}${r.lavaDamage?` · Dung nham gây ${r.lavaDamage}`:''}`;
}
