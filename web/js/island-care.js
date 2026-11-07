// Affection uses the existing bond stat. Roaming never changes game progress.
export const PAT_LIMIT = 3;
export const PAT_COOLDOWN = 5 * 60 * 1000;
const day = now => { const d=new Date(now);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };

export function careStatus(pet, now=Date.now()) {
  const care=pet.care;
  const used=care?.date===day(now)?care.pats:0;
  return {remaining:PAT_LIMIT-used,wait:care?Math.max(0,care.lastPat+PAT_COOLDOWN-now):0,full:pet.bond>=100};
}

export function patPet(state, id, now=Date.now()) {
  const pet=state.pets.find(p=>p.id===id);
  if(!pet)return {error:'Không tìm thấy linh thú.'};
  if(!Number.isFinite(now)||now<0)return {error:'Thời gian chăm sóc không hợp lệ.'};
  const status=careStatus(pet,now);
  if(status.full||!status.remaining||status.wait)return {pet,gained:0,...status};
  pet.bond=Math.min(100,pet.bond+1);
  pet.care={date:day(now),pats:PAT_LIMIT-status.remaining+1,lastPat:now};
  return {pet,gained:1,...careStatus(pet,now)};
}

export function validateCare(pet,now) {
  if(!Object.hasOwn(pet,'care'))return;
  const c=pet.care;
  if(!c||typeof c!=='object'||Array.isArray(c)||!Number.isInteger(c.pats)||c.pats<1||c.pats>PAT_LIMIT||typeof c.lastPat!=='number'||!Number.isFinite(c.lastPat)||c.lastPat<0||c.lastPat>now+86400000||c.date!==day(c.lastPat))throw new Error('Dữ liệu vuốt ve linh thú không hợp lệ.');
}

export function lifeProfile(species) {
  if(['bird','phoenix','dragon','griffin','owl','bat','moth','jelly','whale','manta','koi'].includes(species.shape))return {gait:'glide',speed:14,trait:'Thích lượn gió',play:'Lượn một vòng'};
  if(['rabbit','hamster','mushroom','hedgehog'].includes(species.shape))return {gait:'hop',speed:20,trait:'Ham chơi',play:'Nhảy chân sáo'};
  if(['turtle','panda','seal','penguin','axolotl'].includes(species.shape))return {gait:'waddle',speed:10,trait:'Thích thong thả',play:'Lắc lư vui vẻ'};
  return {gait:'trot',speed:22,trait:'Thích khám phá',play:'Vờn chiếc lá'};
}
