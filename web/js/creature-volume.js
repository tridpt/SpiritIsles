// Object-local lighting gives each limb, ear and feather a rounded surface.
// Gradients and contact shadows remain vector-only, including on offline WebViews.
const blend=(hex,tint,amount)=>{
  const rgb=value=>value.slice(1).match(/../g).map(v=>parseInt(v,16));
  const left=rgb(hex),right=rgb(tint);
  return '#'+left.map((v,i)=>Math.round(v+(right[i]-v)*amount).toString(16).padStart(2,'0')).join('');
};

export function creatureVolume(species,uid) {
  const colors=new Map();let definitions='';
  const pigment=color=>{
    const rgb=color.slice(1).match(/../g).map(v=>parseInt(v,16)),mid=rgb.reduce((a,b)=>a+b)/3;
    if(Math.max(...rgb)-Math.min(...rgb)<18||mid<65)return color;
    return '#'+rgb.map(v=>Math.round(Math.max(0,Math.min(255,mid+(v-mid)*1.18-(mid>160?5:0)))).toString(16).padStart(2,'0')).join('');
  };
  const surface=(color,kind='matte')=>{
    const key=color.toLowerCase()+kind;
    if(colors.has(key))return colors.get(key);
    const id=`${uid}-surface-${colors.size}`;const jewel=kind==='jewel',base=pigment(color);
    definitions+=`<radialGradient id="${id}" cx=".31" cy=".24" r=".83" fx=".28" fy=".19"><stop stop-color="${blend(base,'#fff4d4',jewel?.6:.36)}"/><stop offset=".27" stop-color="${blend(base,'#fff4d4',.14)}"/><stop offset=".5" stop-color="${base}"/><stop offset=".8" stop-color="${blend(base,'#234555',jewel?.4:.33)}"/><stop offset="1" stop-color="${blend(base,'#203c50',jewel?.58:.51)}"/></radialGradient>`;
    const fill=`url(#${id})`;colors.set(key,fill);return fill;
  };
  const coat=surface(species.color);
  const paint=markup=>markup.replace(/fill="(#[\da-f]{6})"/gi,(_,color)=>`fill="${surface(color)}"`);
  const special=`<radialGradient id="${uid}-contact"><stop stop-color="#173f43" stop-opacity=".5"/><stop offset=".48" stop-color="#214b48" stop-opacity=".23"/><stop offset="1" stop-color="#214b48" stop-opacity="0"/></radialGradient><radialGradient id="${uid}-gloss" cx=".35" cy=".25" r=".75"><stop stop-color="#fff6db" stop-opacity=".58"/><stop offset="1" stop-color="#fff6db" stop-opacity="0"/></radialGradient><radialGradient id="${uid}-bounce"><stop stop-color="#a1e0c6" stop-opacity=".23"/><stop offset="1" stop-color="#a1e0c6" stop-opacity="0"/></radialGradient>`;
  const ground=`<g class="pet-ground" aria-hidden="true"><ellipse cx="91" cy="148" rx="55" ry="10" fill="url(#${uid}-contact)"/><ellipse cx="91" cy="146" rx="30" ry="3.8" fill="url(#${uid}-contact)"/></g>`;
  function forehead(head,fx,fy) {
    const x=species.shape==='mushroom'?70:fx-12;
    const y=species.shape==='mushroom'?42:fy-18;
    return {clip:`<clipPath id="${uid}-head-clip">${head}</clipPath>`,shine:`<g class="pet-gloss" clip-path="url(#${uid}-head-clip)"><ellipse cx="${x}" cy="${y}" rx="24" ry="11" transform="rotate(-22 ${x} ${y})" fill="url(#${uid}-gloss)"/><ellipse cx="${fx+27}" cy="${fy+23}" rx="29" ry="14" fill="url(#${uid}-bounce)"/></g>`};
  }
  return {coat,paint,ground,forehead,defs:()=>definitions+special};
}
