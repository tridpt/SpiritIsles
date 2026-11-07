export const ENEMY_TACTICS = {
  plain: { name:'Thăm dò', icon:'swords', guide:'Quan sát đòn mạnh, tích năng lượng và nối chiêu.' },
  armored: { name:'Giáp phản kích', icon:'shield', guide:'Hai lượt thủ giáp, một lượt hở sườn. Hợp lực, xuyên giáp hoặc chiêu công kích hoàn hảo phá thế phản đòn.' },
  caster: { name:'Pháp sư tụ phép', icon:'sparkle', guide:'Tụ phép rồi tung chú. Hợp lực hoặc chiêu công kích đúng nhịp ngắt phép; Phá thế cũng ngắt toàn bộ.' },
  berserker: { name:'Thú cuồng nộ', icon:'flame', guide:'Dưới 40% HP, sát thương tăng 60%. Dồn chiêu kết liễu hoặc đỡ đòn mạnh.' },
};
export function newEnemyAI(kind='plain'){return {kind,casting:false};}
export function validateEnemyAI(battle){
  if(!Object.hasOwn(battle,'enemyAI'))battle.enemyAI=newEnemyAI();
  const a=battle.enemyAI;
  if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).length!==2||!Object.hasOwn(ENEMY_TACTICS,a.kind)||typeof a.casting!=='boolean'||a.kind!=='caster'&&a.casting)throw new Error('Chiến thuật đối thủ không hợp lệ.');
}
export function enemyIntent(battle,fallback,maxHp=100){
  const a=battle.enemyAI||newEnemyAI(),turn=battle.turn??battle.round??0;
  if(a.kind==='armored'&&turn%3!==2)return {id:'counter',name:'Thủ giáp · Sẵn sàng phản đòn',text:'Giảm 35% sát thương và phản 9 sát thương khi bị đánh. Hợp lực, xuyên giáp hoặc chiêu công kích hoàn hảo vô hiệu giáp và phản đòn.',icon:'shield',danger:false};
  if(a.kind==='armored')return {id:'opening',name:'Hở sườn sau thủ giáp',text:'Lượt này không có giáp hay phản đòn. Địch vẫn tấn công; đây là lúc bung lực.',icon:'swords',danger:false};
  if(a.kind==='caster'){
    if(turn%3===0)return {id:'channel',name:'Đang tụ phép',text:'Chưa gây sát thương. Hợp lực hoặc chiêu công kích đúng nhịp ngắt phép, khiến lượt sau không tung được chú.',icon:'sparkle',danger:false};
    if(turn%3===1)return a.casting?{id:'spell',name:'Bùng nổ linh chú',text:'Phép mạnh gấp 2,15 lần. Ngắt bằng Hợp lực, chiêu công kích đúng nhịp hoặc Phá thế; có thể đỡ để giảm sát thương.',icon:'bolt',danger:true}:{id:'recover',name:'Linh chú đã bị ngắt',text:'Pháp sư mất lượt để ổn định phép. Tranh thủ hồi phục hoặc lấy đà.',icon:'sparkle',danger:false};
  }
  if(a.kind==='berserker'&&battle.hp<=maxHp*.4)return {...fallback,name:`Cuồng nộ · ${fallback.name}`,text:'Đang dưới 40% HP: sát thương địch tăng 60%. Dồn chiêu kết liễu hoặc phòng thủ.',danger:true};
  return fallback;
}
export function enemyResponse(battle,intent,move,beat,cast,damage,maxHp=100){
  const ai=battle.enemyAI||newEnemyAI();
  const skill=move==='skill'||/^(pet|awaken):/.test(move)&&cast.offensive;
  const interrupt=beat.staggered||move==='skill'||cast.disrupt||skill&&['good','perfect'].includes(beat.grade);
  const interrupted=['channel','spell'].includes(intent.id)&&interrupt;
  const bypass=beat.staggered||move==='skill'||cast.pierce||cast.breakShield||skill&&beat.grade==='perfect';
  const armorBlocked=intent.id==='counter'&&!bypass?Math.round(damage*.35):0;
  const enemyCounter=intent.id==='counter'&&!bypass&&(move==='attack'||skill)?9:0;
  if(ai.kind==='caster'){
    ai.casting=intent.id==='channel'&&!interrupted;
    battle.enemyAI=ai;
  }
  return {damage:damage-armorBlocked,armorBlocked,enemyCounter,interrupted,enemyIdle:beat.staggered||interrupted||['channel','recover'].includes(intent.id),multiplier:intent.id==='spell'?2.15:1};
}
export function enemyCaption(r){return `${r.interrupted?' · Ngắt phép!':''}${r.armorBlocked?` · Giáp chặn ${r.armorBlocked}`:''}${r.enemyCounter?` · Giáp phản ${r.enemyCounter}`:''}${r.enraged?' · Địch cuồng nộ +60%':''}`;}
