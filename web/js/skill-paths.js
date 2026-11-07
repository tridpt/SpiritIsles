import { PET_SKILLS } from './tactics-data.js';

export const TRAINING_RANKS=[
  {level:5,cost:{gold:150,essence:2}},
  {level:10,cost:{gold:350,essence:5}},
  {level:15,cost:{gold:700,essence:9}},
];
export const newTraining=()=>({branch:null,rank:0});
const PATHS={
  fire:[{id:'burn',name:'Hỏa tâm',icon:'flame',text:'Thiêu đốt mạnh hơn, giảm nhẹ sát thương trực tiếp.'},{id:'shatter',name:'Phá giáp',icon:'swords',text:'Đổi thiêu đốt lấy xuyên khiên và làm suy yếu địch.'}],
  attack:[{id:'burst',name:'Bùng lực',icon:'swords',text:'Dồn sức vào sát thương trực tiếp.'},{id:'drain',name:'Hút sinh lực',icon:'heart',text:'Bớt sát thương để hồi sinh lực ngay khi ra chiêu.'}],
  heal:[{id:'renew',name:'Mạch sống',icon:'heart',text:'Hồi nhiều hơn và tiếp tục hồi phục trong 3 lượt.'},{id:'shelter',name:'Bảo hộ',icon:'shield',text:'Chiêu hỗ trợ thuần túy: tạo khiên lớn và hồi nhẹ.'}],
  guard:[{id:'bastion',name:'Thành lũy',icon:'shield',text:'Bỏ sát thương và phản đòn để dựng khiên dày hơn.'},{id:'thorns',name:'Gai phản đòn',icon:'sprout',text:'Khiên mỏng hơn, phản sát thương trong 3 lượt.'}],
  support:[{id:'relay',name:'Tiếp sức',icon:'bolt',text:'Chiêu hỗ trợ thuần túy: hoàn năng lượng và tăng lực đội.'},{id:'control',name:'Khống chế',icon:'moon',text:'Gây sát thương và giảm đòn địch trong 3 lượt.'}],
};
export function skillPaths(id){const s=Object.hasOwn(PET_SKILLS,id)?PET_SKILLS[id]:null;return s?PATHS[s.role==='attack'&&s.burn?'fire':s.role]:[];}
export function trainingOf(source,id){
  if(Array.isArray(source))return source.find(m=>m.id===id)?.training||newTraining();
  return source?.training||newTraining();
}
export function selectedPath(id,source){return skillPaths(id).find(p=>p.id===trainingOf(source,id).branch)||null;}
export function resolveSkill(id,source){
  const base=Object.hasOwn(PET_SKILLS,id)?PET_SKILLS[id]:null;if(!base)return undefined;
  const {branch,rank}=trainingOf(source,id);if(!branch||!rank)return base;
  const s={...base},step=rank-1;
  switch(branch){
    case 'burn':s.power*=.9;s.burn+=.08+.04*step;break;
    case 'shatter':s.power*=1.05+.06*step;s.burn=0;s.burnTurns=0;s.pierce=true;s.weaken=.15+.05*step;s.weakenTurns=2;if(rank===3)s.breakShield=true;break;
    case 'burst':s.power*=1.1+.07*step;break;
    case 'drain':s.power*=.9+.04*step;s.heal=(s.heal||0)+.1+.025*step;break;
    case 'renew':s.heal=(s.heal||0)+.07+.035*step;s.regen=(s.regen||0)+.02+.01*step;s.regenTurns=3;break;
    case 'shelter':s.role='guard';s.power=0;s.heal=(s.heal||0)*.35;s.regen=0;s.regenTurns=0;s.ward=Math.max(s.ward||0,.26+.05*step);break;
    case 'bastion':s.power=0;s.ward+=.07+.03*step;s.counter=0;s.counterTurns=0;break;
    case 'thorns':s.power*=.95;s.ward*=.8;s.counter=(s.counter||0)+.18+.06*step;s.counterTurns=3;break;
    case 'relay':s.power=0;s.burn=0;s.burnTurns=0;s.gain=Math.max(s.gain||0,1);s.boost=Math.min(.65,(s.boost||.15)+.06+.03*step);s.boostTurns=3;break;
    case 'control':s.power=Math.max(.8,s.power)*(1+.08*rank);s.weaken=Math.max(s.weaken||0,.25)+.03*rank;s.weakenTurns=3;break;
  }
  return s;
}
export function validateTraining(holder,{level=30,optional=false}={}){
  if(!Object.hasOwn(holder,'training')){if(!optional)holder.training=newTraining();return;}
  const t=holder.training,fail=()=>{throw new Error('Nhánh kỹ năng của linh thú không hợp lệ.');};
  if(!t||typeof t!=='object'||Array.isArray(t)||Object.keys(t).length!==2||!Number.isInteger(t.rank)||t.rank<0||t.rank>3||t.rank>0&&level<TRAINING_RANKS[t.rank-1].level||t.rank===0&&t.branch!==null||t.branch!==null&&!skillPaths(holder.id).some(p=>p.id===t.branch))fail();
}
