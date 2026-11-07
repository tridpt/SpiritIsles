import {BIOMES,EVENTS} from './data.js';
import {campaignBiome,campaignEvent} from './campaign-data.js';
import {petSkill,skillBlocked,comboFor} from './tactics.js';
import {validAutoPlan} from './auto-tactics.js';
import {reefEvent} from './reef-encounter.js';
import {volcanoEvent} from './volcano-encounter.js';

// Read-only decisions. All spending, RNG, cooldowns and rewards stay in the engines.
export function autoRoute(state){
  const r=state.expedition;if(!r||r.battle)return null;
  const biome=campaignBiome(r);if(!biome||r.stage>=biome.stages)return null;
  if(r.campaign)return {choice:0,name:campaignEvent(r).choices[0].text};
  if(r.stage===biome.stages-1)return {choice:0,name:'Gặp người giữ vùng đất'};
  const choices=(volcanoEvent(r)||reefEvent(r)||EVENTS[r.event])?.choices||[],missing=100-r.hp;
  if(['reef','volcano'].includes(r.biome))return {choice:0,name:choices[0].text};
  return choices.map((c,i)=>({choice:i,name:c.text,score:Math.min(missing,c.heal||0)*3+Object.entries(c.reward||{}).reduce((n,[k,v])=>n+v*({crystals:5,essence:8,food:1,wood:1,gold:.3}[k]||1),0),cost:c.cost}))
    .filter(c=>!Object.values(c.cost||{}).some(n=>n>0)).sort((a,b)=>b.score-a.score||a.choice-b.choice)[0]||null;
}
export function autoOrder(s,{priority,foe:lockedFoe,plan}={}){
  if(!s||s.travel)return null;
  const policy=validAutoPlan(plan)?plan:null;priority=priority||policy?.priority||'smart';
  const isBoss=!!s.isBoss||s.mode==='boss'||!!s.bossId;
  const allies=s.squad?.allies.filter(u=>u.hp>0),enemies=s.squad?.enemies.filter(u=>u.hp>0);
  const members=s.members.filter(m=>!allies||allies.some(u=>u.id===m.id));if(!members.length||enemies&&!enemies.length)return null;
  const weak=allies?.slice().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0],ratio=weak?weak.hp/weak.maxHp:s.hp/s.maxHp;
  const target=enemies?.find(u=>u.id===lockedFoe)||enemies?.slice().sort((a,b)=>{
    const score=u=>(priority==='weak'?1-u.hp/u.maxHp:(['heal','support'].includes(u.role)?.7:0)+(1-u.hp/u.maxHp)*.5);
    return score(b)-score(a);
  })[0];
  const stance=policy?policy.profile==='sweep'?'assault':s.intent?.danger&&ratio<.6?'guarded':'balanced':s.strategy?.stance||'balanced';
  const order=(move,ally)=>({move,stance,target:(move==='attack'||/^(pet|awaken):/.test(move)&&petSkill(move.split(':')[1],s.members,move.startsWith('awaken:'))?.power)?s.core?'core':s.roots?'roots':'body':'body',...(target?{foe:target.id}:{}),...(allies&&ally?{ally}:{})});
  if(s.forestWarning||s.reefWarning||s.volcanoWarning)return {...order('evade'),reason:s.volcanoWarning?`Né ${s.volcanoWarning.name} · tới nền đá, giảm 85% sát thương`:s.reefWarning?'Né Sóng triều · giảm 85% sát thương, mở bụng boss':'Né Rễ trồi · giảm 85% sát thương, dùng một lượt'};
  const skills=members.flatMap(m=>[false,true].map(ultimate=>({m,ultimate,skill:petSkill(m.id,s.members,ultimate)}))).filter(x=>x.skill&&(!x.ultimate||!policy||policy.ultimate==='always'||policy.ultimate==='boss'&&isBoss)&&!skillBlocked(s.tactics,x.m.id,s.focus,s.members,x.ultimate,allies));
  const use=x=>order(`${x.ultimate?'awaken':'pet'}:${x.m.id}`,x.ally||weak?.id);
  const healing=skills.filter(x=>x.skill.heal).sort((a,b)=>(b.skill.heal+(b.skill.rescue||0))-(a.skill.heal+(a.skill.rescue||0)));
  if(ratio<(policy?policy.healAt/100:.48)&&healing.length)return {...use(healing[0]),reason:`Cứu bạn đang yếu máu${policy?` · dưới ${policy.healAt}% HP`:''}`};
  if(s.volcanoArmor>0){
    const breaker=skills.filter(x=>x.skill.power>0&&(x.skill.breakShield||x.skill.pierce)).sort((a,b)=>(b.skill.breakShield?3:2)*b.skill.power-(a.skill.breakShield?3:2)*a.skill.power)[0];
    if(breaker)return {...use(breaker),reason:'Phá giáp đá để lộ điểm yếu của Rồng'};
    if(s.focus>=2)return {...order('skill'),reason:'Hợp lực phá giáp đá · mở hai đòn +60%'};
    return {...order('attack'),reason:'Bào giáp đá, giữ chiêu hồi phục cho bạn bị thương'};
  }
  if(s.volcanoOpening&&s.focus>=2)return {...order('skill'),reason:'Bung Hợp lực vào điểm yếu · +60% sát thương'};
  const casting=['channel','spell','blizzard'].includes(s.intent?.id),danger=!!s.intent?.danger;
  const disrupt=skills.find(x=>x.skill.disrupt);
  if(casting&&disrupt&&policy?.interrupt!==false)return {...use(disrupt),reason:'Ngắt chiêu đang tụ của địch'};
  if(casting&&s.focus>=2&&policy?.interrupt!==false)return {...order('skill'),reason:'Hợp lực để ngắt đòn nguy hiểm'};
  const guard=skills.find(x=>x.skill.role==='guard'&&(!allies||allies.some(u=>u.id===x.m.id&&u.row==='front'&&!u.cover)));
  if(guard&&danger&&ratio<(policy?.profile==='sweep'?.5:.85))return {...use({...guard,ally:guard.m.id}),reason:'Hộ vệ hút đòn bảo vệ đội'};
  if(danger&&!casting&&ratio<(policy?.profile==='sweep'?.3:.55))return {...order('guard'),reason:'Đỡ đòn mạnh trước khi phản công'};
  const waiting=allies?.filter(u=>s.tactics.cooldowns[u.id]>=2).sort((a,b)=>s.tactics.cooldowns[b.id]-s.tactics.cooldowns[a.id])[0];
  const support=skills.find(x=>x.skill.role==='support'&&x.m.id!==waiting?.id);
  if(waiting&&support)return {...use({...support,ally:waiting.id}),reason:'Tiếp sức để đồng đội sớm dùng lại chiêu'};
  const offense=skills.filter(x=>x.skill.power>0&&x.skill.role==='attack').sort((a,b)=>{
    const score=x=>x.skill.power+(x.skill.pierce&&s.enemyShield?2:0)+(comboFor(s.tactics.mark,x.m.id)?.damage||0)+((x.skill.burn&&!s.tactics.burn.turns)?1:0);
    return score(b)-score(a);
  });
  if(offense.length)return {...use(offense[0]),reason:s.core?'Phá lõi để chặn tái sinh':s.roots?'Chặt rễ hồi sinh':target&&target.hp<=target.maxHp*.4?'Dồn chiêu kết liễu':'Dùng chiêu công kích, nối hệ'};
  const utility=skills.find(x=>x.skill.role==='support'&&((x.skill.weaken&&s.tactics.weaken.turns<=1)||(x.skill.boost&&s.tactics.boost.turns<=1)||(x.skill.gain&&s.focus<3)||x.skill.breakShield&&s.enemyShield));
  if(utility)return {...use(utility),reason:'Tăng lực và hỗ trợ đội hình'};
  if(s.focus>=2)return {...order('skill'),reason:'Cả đội hợp lực tấn công'};
  if(danger)return {...order('guard'),reason:'Đỡ đòn mạnh, tích năng lượng'};
  if(['channel','charge','recover'].includes(s.intent?.id)&&!s.strategy?.drive&&!s.mechanics?.frozen)return {...order('charge'),reason:'Tích năng lượng khi địch chưa tấn công'};
  return {...order('attack'),reason:'Đánh thường để tích năng lượng'};
}

// Only one pending decision; never catch up elapsed/background time.
export function createAutoRunner({ready,step,setTimer=setTimeout,clearTimer=clearTimeout,delay=900}){
  let enabled=false,suspended=false,timer=null,speed=1;
  const cancel=()=>{if(timer!==null)clearTimer(timer);timer=null;};
  const schedule=()=>{
    if(!enabled||suspended||timer!==null)return;
    timer=setTimer(()=>{timer=null;if(!enabled||suspended)return;if(!ready())return schedule();step();},(typeof delay==='function'?delay():delay)/speed);
  };
  return {schedule,get enabled(){return enabled;},get speed(){return speed;},setEnabled(v){enabled=!!v;cancel();schedule();},setSpeed(v){speed=v===2?2:1;cancel();schedule();},suspend(){suspended=true;cancel();},resume(){suspended=false;schedule();},stop(){enabled=false;cancel();}};
}
