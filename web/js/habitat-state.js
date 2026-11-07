import { BY_ID, SPECIES } from './data.js';
import { MOMENT_BY_ID, HABITAT_MOMENTS, HABITAT_MILESTONES, momentApplies, newHabitat } from './habitat-data.js';
export { newHabitat };

export function validateHabitat(state,now) {
  if(!Object.hasOwn(state,'habitat'))state.habitat=newHabitat();
  const h=state.habitat,fail=()=>{throw new Error('Sổ khoảnh khắc trên đảo không hợp lệ.');};
  if(!h||h.version!==1||!h.discovered||typeof h.discovered!=='object'||Array.isArray(h.discovered)||Object.keys(h.discovered).length>SPECIES.length*HABITAT_MOMENTS.length||!Array.isArray(h.claimed)||new Set(h.claimed).size!==h.claimed.length)fail();
  for(const [key,e] of Object.entries(h.discovered)){
    const parts=key.split(':'),pet=state.pets.find(p=>p.id===parts[0]),m=Object.hasOwn(MOMENT_BY_ID,parts[1])?MOMENT_BY_ID[parts[1]]:null;
    if(parts.length!==2||!pet||!momentApplies(BY_ID[pet.species],m)||!e||!Number.isFinite(e.at)||e.at<0||e.at>now+86400000||!m.decor.includes(e.decoration))fail();
    if(m.buddy){const partner=state.pets.find(p=>p.id===e.partner);if(!partner||partner.id===pet.id||BY_ID[partner.species].element===BY_ID[pet.species].element)fail();}
    else if(Object.hasOwn(e,'partner'))fail();
  }
  if(!h.claimed.every(id=>HABITAT_MILESTONES.some(m=>m.id===id&&m.target<=Object.keys(h.discovered).length)))fail();
}
