import { pay } from './engine.js';
import { combatLocked } from './forge-state.js';
import { TRAINING_RANKS, newTraining, skillPaths } from './skill-paths.js';

export function trainingBlocked(state,pet,upgrade=false){
  if(!pet)return 'Bạn chưa có linh thú này.';
  if(combatLocked(state))return 'Kết thúc chuyến đi trước khi đổi hoặc nâng nhánh kỹ năng nhé.';
  const rank=pet.training?.rank||0;
  if(!upgrade&&rank>0)return '';
  const next=TRAINING_RANKS[rank];if(!next)return 'Kỹ năng đã đạt bậc 3.';
  if(pet.level<next.level)return `Cần cấp thú ${next.level}.`;
  if(Object.entries(next.cost).some(([k,n])=>state.resources[k]<n))return `Cần ${next.cost.gold} vàng và ${next.cost.essence} tinh hoa.`;
  return '';
}
export function chooseSkillBranch(state,id,branch){
  const pet=state.pets.find(p=>p.id===id);
  if(branch!==null&&!skillPaths(id).some(p=>p.id===branch))return {error:'Nhánh kỹ năng không hợp lệ.'};
  const error=trainingBlocked(state,pet);if(error)return {error};
  const current=pet.training||newTraining();
  if(current.branch===branch)return {error:'Bạn đang dùng kỹ năng này.'};
  const cost=current.rank===0?TRAINING_RANKS[0].cost:{};
  if(!pay(state,cost))return {error:'Chưa đủ tài nguyên luyện kỹ năng.'};
  pet.training={rank:Math.max(1,current.rank),branch};return {pet,cost};
}
export function upgradeSkillRank(state,id){
  const pet=state.pets.find(p=>p.id===id);
  const error=trainingBlocked(state,pet,true);if(error)return {error};
  if(!pet.training?.rank)return {error:'Chọn một nhánh để mở bậc 1 trước nhé.'};
  const cost=TRAINING_RANKS[pet.training.rank].cost;
  if(!pay(state,cost))return {error:'Chưa đủ tài nguyên luyện kỹ năng.'};
  pet.training.rank++;return {pet,cost};
}
