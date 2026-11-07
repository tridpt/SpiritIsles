import { validateMemberAwakening } from './awakening-state.js';
import { BY_ID, ELEMENTS } from './data.js';
import { newTactics, validateTactics } from './tactics.js';
import { validateMemberGear, GEAR_BY_ID } from './forge-state.js';
import { validateTraining } from './skill-paths.js';
import { validateRhythm } from './combat-rhythm.js';
import { validateStrategy } from './combat-orders.js';
import {validateSquad} from './squad-state.js';
import {guardianEnemy} from './combat-team.js';

export const BOSS={id:'treant',name:'Cổ Mộc Gai',element:'leaf',unlock:2,cost:12,tiers:['Mầm thức giấc','Rễ vươn sâu','Tán rừng cổ','Ngàn vòng tuổi','Trái tim đại ngàn'],tag:'Rễ hồi sinh',intro:'Phá vỏ cây, chặt rễ hồi sinh và đương đầu lõi rừng cuồng nộ.',guides:[['Vỏ cây thức giấc','Phá khiên bằng Hợp lực. Sau lượt tụ sức là Đại chấn rễ.'],['Rễ hồi sinh · 60% HP','Đánh thường chặt 1 rễ. Hỏa, combo hoặc Hợp lực chặt hết. Vào sàn để nhắm cả hai rễ.'],['Lõi lộ sáng · 30% HP','Cả đội gây thêm 20%; Cổ Mộc đánh mạnh hơn 30%. Giữ chiêu hồi phục cho cuối trận.']]};
export const BOSSES={
  treant:BOSS,
  frost:{id:'frost',name:'Rồng Băng',element:'water',unlock:3,cost:12,gate:'treant',tiers:['Hơi thở sương','Vảy băng xanh','Cánh trời tuyết','Bão trắng','Trái tim vĩnh đông'],tag:'Đóng băng năng lượng',intro:'Một long vương giữa bão tuyết. Đọc nhịp hơi thở để giữ nguồn năng lượng của đội.',guides:[['Đọc nhịp bão tuyết','Quét cánh → Tụ sương → Bão tuyết → Nanh băng. Tụ sương là lượt lấy đà an toàn.'],['Bão tuyết · Khóa tích năng lượng','Nếu trúng bão, đội không tích được năng lượng trong 2 lượt. Hỏa hoặc Hợp lực ngắt bão và làm tan băng; đỡ hoàn hảo cũng chống đóng băng.'],['Vảy băng · 60% HP','Boss nhận khiên khi sang giai đoạn 2. Dưới 30% HP: cả hai phía tăng sát thương.']]},
  phoenix:{id:'phoenix',name:'Phượng Hoàng',element:'fire',unlock:4,cost:12,gate:'frost',tiers:['Tàn lửa thức giấc','Cánh hồng than','Lửa trời','Vũ khúc tái sinh','Bình minh bất diệt'],tag:'Lõi lửa & Tái sinh',intro:'Đôi cánh từ tro tàn. Hạ thân hay phá lõi trước: lựa chọn của bạn quyết định lần tái sinh.',guides:[['Lõi lửa · Lộ ra ở 60% HP','Vào sàn để nhắm Lõi lửa. Gây đủ sát thương vào lõi sẽ tắt khả năng tái sinh; thân nhận kèm 25% sát thương.'],['Một lần tái sinh','Nếu thân gục khi lõi còn sống, hồi 45% HP và bỏ lượt phản công. Mỗi trận chỉ tái sinh 1 lần.'],['Khúc hát tro tàn','Khi lõi còn sống, boss hồi 10% HP mỗi lượt thứ tư. Phá lõi hoặc Phá thế để ngắt hồi phục. Sau tụ lửa là đòn mạnh.']]},
};
export const bossId=run=>run?.bossId||'treant';
export const bossDefinition=id=>BOSSES[id||'treant'];
const progress=()=>({best:0,wins:0,clears:[0,0,0,0,0]});
export function newBoss(){return {version:1,...progress(),rivals:{frost:progress(),phoenix:progress()},run:null,lastResult:null};}
export function bossProgress(state,id='treant'){return id==='treant'?state.boss:state.boss.rivals[id];}
export function bossRequiredLevel(id,tier=1){return BOSSES[id].unlock+tier-1;}
export function bossUnlocked(state,id){const d=BOSSES[id];return !!d&&state.level>=d.unlock&&(!d.gate||bossProgress(state,d.gate).best>=1);}
export function bossEnemy(tier,id='treant'){
  return {maxHp:(id==='frost'?350:id==='phoenix'?380:320)+(tier-1)*90,power:Math.round((id==='frost'?82:id==='phoenix'?92:72)*Math.pow(1.38,tier-1))};
}
export function bossTeamPower(members,id='treant'){
  const elements=members.map(m=>BY_ID[m.id].element),diverse=new Set(elements).size;
  const synergy=elements.length===3&&diverse===1?1.2:diverse===3?1.12:1.05;
  return Math.round(members.reduce((n,m)=>n+m.power*(ELEMENTS[BY_ID[m.id].element].strong===BOSSES[id].element?1.3:1),0)*synergy);
}
export function bossIntent(run){
  const index=run.turn%4,id=bossId(run);
  if(id==='frost'){
    if(index===1)return {id:'charge',name:'Tụ sương trên đôi cánh',text:'Không tấn công lượt này. Tiếp theo là Bão tuyết: chuẩn bị chiêu Hỏa, Hợp lực hoặc đỡ hoàn hảo.',icon:'wind',danger:false};
    if(index===2)return {id:'blizzard',name:'Bão tuyết khóa năng lượng',text:'Sát thương ×1,7 và khóa tích năng lượng 2 lượt. Hỏa hoặc Hợp lực ngắt bão; đỡ hoàn hảo hay Phá thế cũng chống đóng băng.',icon:'waves',danger:true};
    return {id:index===3?'heavy':'strike',name:index===3?'Nanh băng xuyên mây':'Quét cánh băng',text:index===3?'Đòn mạnh ×2. Đỡ hoặc Phá thế để giảm nguy hiểm.':'Một đòn quét cánh. Giữ đủ năng lượng cho chiêu Hỏa hoặc Hợp lực khi bão tới.',icon:index===3?'swords':'wind',danger:index===3};
  }
  if(id==='phoenix'){
    if(index===1)return {id:'charge',name:'Tụ lửa trong tro',text:'Không tấn công. Lượt tới là Thiên hỏa ×2,1. Tranh thủ nhắm lõi, lấy đà hoặc hồi phục.',icon:'flame',danger:false};
    if(index===2)return {id:'heavy',name:'Thiên hỏa giáng thế',text:'Đòn mạnh ×2,1. Đỡ đúng nhịp để mở phản kích hoặc Phá thế để ngắt.',icon:'flame',danger:true};
    if(index===3&&run.mechanics?.coreHp>0)return {id:'mend',name:'Khúc hát tro tàn',text:'Hồi 10% sinh lực thay vì tấn công. Phá lõi lửa hoặc Phá thế để chặn hồi phục.',icon:'heart',danger:false};
    return {id:'strike',name:'Lông vũ rực cháy',text:'Một đòn tấn công thường. Khi còn dưới 60% HP, lõi lửa trở thành mục tiêu trong sàn đấu.',icon:'flame',danger:false};
  }
  if(index===2)return {id:'charge',name:'Tụ sức dưới lòng đất',text:'Lượt này không đánh. Lượt kế tiếp là Đại chấn rễ: hãy giữ năng lượng hoặc chuẩn bị phòng thủ.',icon:'bolt',danger:false};
  if(index===3)return {id:'heavy',name:'Đại chấn rễ',text:'Đòn mạnh gấp 2,3 lần. Phòng thủ giảm 75% sát thương.',icon:'swords',danger:true};
  if(index===1&&run.phase<3)return {id:'ward',name:'Vỏ cây khép lại',text:'Dựng khiên và gây một đòn nhẹ. Chiêu phá khiên hoặc combo Hơi nước giúp xuyên qua.',icon:'shield',danger:false};
  return {id:'strike',name:run.phase===3?'Lõi rừng cuồng nộ':'Rễ quét ngang',text:run.phase===3?'Lõi đã lộ: cả hai phía gây nhiều sát thương hơn.':'Một đòn quét rễ. Tấn công để tích năng lượng hoặc chặt rễ hồi sinh.',icon:'leaf',danger:false};
}
export function validateBoss(state,now=Date.now()){
  const b=state.boss,object=v=>v&&typeof v==='object'&&!Array.isArray(v),int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  const fail=()=>{throw new Error('Tiến trình Săn Thủ Vệ không hợp lệ.');};
  const validProgress=p=>object(p)&&int(p.best,0,5)&&int(p.wins,0,99999999)&&Array.isArray(p.clears)&&p.clears.length===5&&p.clears.every(n=>int(n,0,99999999))&&p.wins===Math.min(99999999,p.clears.reduce((a,n)=>a+n,0))&&!p.clears.some((n,i)=>(i<p.best)!==(n>0));
  if(!object(b)||b.version!==1||!validProgress(b))fail();
  if(!Object.hasOwn(b,'rivals'))b.rivals={frost:progress(),phoenix:progress()};
  if(!object(b.rivals)||Object.keys(b.rivals).some(id=>!['frost','phoenix'].includes(id)))fail();
  for(const id of ['frost','phoenix']){
    if(!Object.hasOwn(b.rivals,id))b.rivals[id]=progress();
    if(!validProgress(b.rivals[id])||b.rivals[id].best>0&&bossProgress(state,BOSSES[id].gate).best<1)fail();
  }
  if(b.run!==null){
    const r=b.run;if(!object(r)||Object.hasOwn(r,'bossId')&&!Object.hasOwn(BOSSES,r.bossId))fail();
    const id=bossId(r),d=BOSSES[id],p=bossProgress(state,id),e=bossEnemy(r.tier,id);
    if(state.expedition||state.ruins?.run||!bossUnlocked(state,id)||!int(r.tier,1,Math.min(5,p.best+1,state.level-d.unlock+1))||!int(r.seed,1,0xffffffff)||!int(r.rng,1,0xffffffff)||!int(r.started,0,now+86400000)||!Array.isArray(r.members)||r.members.length!==state.team.length||!r.members.every((m,i)=>object(m)&&m.id===state.team[i]&&int(m.power,1,2000)))fail();
    for(const m of r.members){validateMemberGear(m);validateTraining(m,{optional:true});validateMemberAwakening(m);}
    if(r.maxHp!==150||!int(r.hp,1,150)||!int(r.enemyHp,1,e.maxHp)||!int(r.shield,0,200)||!int(r.turn,0,59)||!int(r.phase,1,3)||!int(r.roots,0,2)||(id!=='treant'||r.phase!==2)&&r.roots!==0||!int(r.focus,0,3)||!Array.isArray(r.log)||r.log.length>6||!r.log.every(s=>typeof s==='string'&&s.length<300))fail();
    if(id!=='treant'){
      const m=r.mechanics;
      if(!object(m)||Object.keys(m).length!==3||!int(m.frozen,0,id==='frost'?2:0)||!int(m.coreHp,0,id==='phoenix'?70+r.tier*15:0)||!int(m.revives,0,id==='phoenix'?1:0)||id==='phoenix'&&r.phase===1&&(m.coreHp!==70+r.tier*15||m.revives))fail();
    }
    validateTactics(r.tactics,r.members,r.maxHp);validateRhythm(r);validateStrategy(r);
    validateSquad(r,{maxHp:r.maxHp,enemyMax:e.maxHp,enemies:guardianEnemy(r),active:true});
    if(r.phase===1&&r.enemyHp<=e.maxHp*.6||r.phase===2&&r.enemyHp<=e.maxHp*.3)fail();
  }
  if(b.lastResult!==null){
    const r=b.lastResult,loot=v=>object(v)&&Object.entries(v).every(([k,n])=>['gold','essence','tickets','crystals'].includes(k)&&int(n,0,99999999)),mats=v=>object(v)&&Object.entries(v).every(([k,n])=>['sap','ore','heart'].includes(k)&&int(n,0,99999999));
    if(!object(r)||Object.hasOwn(r,'bossId')&&!Object.hasOwn(BOSSES,r.bossId)||!['victory','defeat','retreat'].includes(r.status)||!int(r.tier,1,5)||!int(r.turns,0,60)||!int(r.time,0,now+86400000)||typeof r.first!=='boolean'||typeof r.converted!=='boolean'||!loot(r.reward)||!mats(r.materials)||(r.drop!==null&&(!object(r.drop)||!Object.hasOwn(GEAR_BY_ID,r.drop.recipe))))fail();
    if(Object.hasOwn(r,'shinyFragments')&&(!int(r.shinyFragments,0,7)||r.shinyFragments>(r.status==='victory'?2+r.tier:0)))fail();
    if(Object.hasOwn(r,'awakeningMaterials')&&(!object(r.awakeningMaterials)||Object.keys(r.awakeningMaterials).length!==(r.status==='victory'?1:0)||r.status==='victory'&&r.awakeningMaterials.sigil!==1+r.tier))fail();
    if(r.status==='victory'&&bossProgress(state,bossId(r)).clears[r.tier-1]===0)fail();
  }
}

