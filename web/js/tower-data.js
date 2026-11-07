import { BY_ID, ELEMENTS } from './data.js';
import { enemyTeam } from './combat-team.js';
import { enemyIntent } from './enemy-tactics.js';

export const TOWER_MAX_FLOOR = 30;
export const TOWER_UNLOCK = 2;
export const TOWER_ENTRY = { food: 10 };

export const TOWER_CHAPTERS = [
  { id:'verdant', name:'Rễ Thức Tỉnh', range:'1 — 10', start:1, end:10, color:'#78b78e', pale:'#e8f4e6', element:'leaf', icon:'leaf', creatures:['mossfox','ferncat','mushroom','sproutpanda'], guardian:'maplehog', boss:'forestking', story:'Những bậc đá mọc lên từ rễ cổ. Mỗi bước chân đánh thức một thử thách mới.' },
  { id:'tide', name:'Thủy Kính Lơ Lửng', range:'11 — 20', start:11, end:20, color:'#72b4c4', pale:'#e5f3f5', element:'water', icon:'waves', creatures:['axolotl','coralseal','pebbleturtle','lotusseal'], guardian:'lotusseal', boss:'oceandragon', story:'Nước chảy ngược lên trời, mang theo những linh thú canh giữ ký ức của đảo.' },
  { id:'ember', name:'Lò Sao Ngủ Quên', range:'21 — 30', start:21, end:30, color:'#dd956f', pale:'#fff0e4', element:'fire', icon:'flame', creatures:['flamefox','emberbird','lavadragon','mistfox'], guardian:'mistfox', boss:'phoenix', story:'Tầng cao nhất nằm trong một lò sao. Chỉ đội hình biết phối hợp mới giữ được ngọn lửa.' }
];

export const TOWER_PATHS = {
  battle: { name:'Lối giao chiến', subtitle:'Trận thường · nhận bụi tháp', description:'Một trận chiến vừa sức. Thắng để nhận thưởng và chọn phước lành.', icon:'swords', color:'#9bc59c', power:1, reward:'Tài nguyên + phước lành' },
  elite: { name:'Bóng tinh anh', subtitle:'Địch +28% · bụi +70%', description:'Nhận thêm một lời nguyền: địch gây thêm 8% sát thương mỗi bậc, tối đa 3. Bụi nhiều hơn và thưởng thêm ngọc.', icon:'flame', color:'#e8a36f', power:1.28, reward:'Nhiều bụi + 12 ngọc' },
  blessing: { name:'Điện phước lành', subtitle:'Không giao chiến', description:'Chọn một phước lành tức thì rồi đi tiếp. Có thể đổi cách xây đội giữa các lượt.', icon:'sparkle', color:'#cdb1ed', power:1, reward:'Phước lành miễn phí' },
  rest: { name:'Suối hồi sinh', subtitle:'Hồi 28% sinh lực', description:'Nghỉ chân để hồi sức và nhận một ít năng lượng cho trận kế tiếp.', icon:'drop', color:'#8fd0ca', power:1, reward:'Hồi máu + năng lượng' },
  treasure: { name:'Kho báu lơ lửng', subtitle:'Rương + nguy cơ', description:'Mở rương nhận bụi, vàng và 8 ngọc. Bẫy lấy tối đa 8 sinh lực, luôn để cả đội còn sức đi tiếp.', icon:'chest', color:'#e6c37d', power:1.08, reward:'Bụi + vàng + 8 ngọc' },
  boss: { name:'Cổng thủ vệ', subtitle:'Boss mỗi 5 tầng', description:'Thủ vệ đổi ý định theo nhịp. Đỡ đúng lúc, phá khiên và để cả đội cùng tung kỹ năng.', icon:'trophy', color:'#e9ad83', power:1.48, reward:'Mốc lớn + vật phẩm hiếm' }
};

export const TOWER_BLESSINGS = [
  { id:'thorns', name:'Vòng Gai Sao', icon:'sprout', tag:'Phản kích', max:3, text:'Đỡ hoàn hảo phản lại 8 sát thương mỗi bậc.' },
  { id:'ember', name:'Hỏa Vũ', icon:'flame', tag:'Tuyệt kỹ', element:'fire', max:3, text:'Chiêu riêng và hợp lực gây thêm 22% sát thương mỗi bậc khi có hệ Hỏa.' },
  { id:'tide', name:'Khúc Hát Thủy Triều', icon:'waves', tag:'Hồi phục', element:'water', max:3, text:'Tuyệt kỹ hồi thêm 7 sinh lực mỗi bậc khi có hệ Thủy.' },
  { id:'canopy', name:'Tán Lá Chở Che', icon:'leaf', tag:'Khiên', element:'leaf', max:3, text:'25% lượng hồi từ tuyệt kỹ chuyển thành khiên mỗi bậc khi có hệ Mộc.' },
  { id:'might', name:'Nanh Đáy Rễ', icon:'swords', tag:'Sức mạnh', max:3, text:'Sức mạnh đội tăng 9% mỗi bậc.' },
  { id:'vitality', name:'Tim Tháp', icon:'heart', tag:'Sinh lực', max:3, text:'Sinh lực tối đa tăng 13 và hồi ngay 13 mỗi bậc.' },
  { id:'spark', name:'Hạt Sao Dẫn Lối', icon:'bolt', tag:'Năng lượng', max:2, text:'Bắt đầu mỗi trận với thêm 1 năng lượng mỗi bậc.' },
  { id:'fortune', name:'Bàn Tay Kho Báu', icon:'chest', tag:'Phần thưởng', max:3, text:'Bụi tháp nhận được tăng 18% mỗi bậc.' },
  { id:'harmony', name:'Ba Màu Đồng Hành', icon:'sparkle', tag:'Đội đa hệ', max:2, condition:'harmony', text:'Đội có ba hệ khác nhau: sức mạnh đội tăng 12% mỗi bậc.' },
  { id:'unison', name:'Một Nhịp Tim', icon:'heart', tag:'Đội đồng hệ', max:2, condition:'unison', text:'Đội cùng một hệ: sức mạnh đội tăng 16% mỗi bậc.' },
  { id:'humble', name:'Bạn Nhỏ Vươn Lên', icon:'paw', tag:'N / R', max:3, condition:'humble', text:'Linh thú N/R trong đội tăng 22% sức mạnh mỗi bậc.' }
];
export const TOWER_BLESSING_BY_ID = Object.fromEntries(TOWER_BLESSINGS.map(b=>[b.id,b]));

export const TOWER_MILESTONES = [5,10,15,20,25,30].map((floor,i)=>({
  floor,
  title: floor===30 ? 'Người mở khóa đỉnh tháp' : floor%10===0 ? 'Người giữ ngọn đèn' : `Dấu ấn tầng ${floor}`,
  reward: { tickets: 1+i, crystals: 15+i*10, essence: 2+i*2 }
}));

export const TOWER_OMENS=[
  {id:'storm',name:'Tuần Sấm Dội',icon:'bolt',text:'Địch gây thêm 10% sát thương. Chiến thắng boss hồi 20% sinh lực.',incoming:1.1,heal:1,shield:0},
  {id:'iron',name:'Tuần Thiết Giáp',icon:'shield',text:'Mỗi trận địch có thêm 18 khiên. Hợp lực và chiêu phá khiên rất hữu ích.',incoming:1,heal:1,shield:18},
  {id:'silence',name:'Tuần Sương Lặng',icon:'moon',text:'Hồi phục trong trận giảm 20%. Suối nghỉ và bình sương vẫn hồi đầy hiệu lực.',incoming:1,heal:.8,shield:0}
];
export function towerSeason(now=Date.now()){
  const local=now+7*3600000,day=86400000;
  const monday=Math.floor((Math.floor(local/day)+3)/7)*7-3;
  return new Date(monday*day).toISOString().slice(0,10);
}
export function towerOmen(season){return TOWER_OMENS[Math.abs(Math.floor(Date.parse(season)/604800000))%TOWER_OMENS.length];}
export function towerPaths(run){
  if(run.floor%5===0)return ['boss'];
  let n=(run.seed+run.floor*2654435761)>>>0;
  const pool=['elite','blessing','rest','treasure'],out=['battle'];
  while(out.length<3){n=(Math.imul(n,1664525)+1013904223)>>>0;out.push(pool.splice(n%pool.length,1)[0]);}
  return out;
}

export function towerChapter(floor){
  return TOWER_CHAPTERS.find(c=>floor>=c.start&&floor<=c.end)||TOWER_CHAPTERS.at(-1);
}
export function towerPath(id){return TOWER_PATHS[id]||TOWER_PATHS.battle;}
export function towerBlessingMatches(blessing,run){
  const species=run.members.map(m=>BY_ID[m.id]).filter(Boolean);
  const elements=species.map(s=>s.element);
  if(blessing.element&&!elements.includes(blessing.element))return false;
  if(blessing.condition==='harmony'&&new Set(elements).size!==3)return false;
  if(blessing.condition==='unison'&&(elements.length!==3||new Set(elements).size!==1))return false;
  if(blessing.condition==='humble'&&!species.some(s=>['N','R'].includes(s.rarity)))return false;
  return true;
}
export function towerBlessingAvailable(blessing,run){return (run.blessings[blessing.id]||0)<blessing.max&&towerBlessingMatches(blessing,run);}
export function towerMaxHp(run){return 112+(run.blessings.vitality||0)*13;}
export function towerPower(run,enemyElement=null){
  const elements=run.members.map(m=>BY_ID[m.id]?.element).filter(Boolean),diverse=new Set(elements).size;
  const synergy=diverse===3?1.12:elements.length===3&&diverse===1?1.18:1.05;
  return Math.round(run.members.reduce((sum,m)=>{
    const s=BY_ID[m.id],humble=s&&['N','R'].includes(s.rarity)?1+(run.blessings.humble||0)*.22:1;
    return sum+m.power*humble*(enemyElement&&ELEMENTS[s.element].strong===enemyElement?1.25:1);
  },0)*synergy*(1+(run.blessings.might||0)*.09+(run.blessings.harmony||0)*.12+(run.blessings.unison||0)*.16));
}
export function towerEncounter(run,path=run.path){
  const chapter=towerChapter(run.floor),boss=run.floor%5===0,seed=((run.seed>>>0)+run.floor*31)>>>0;
  const species=boss?(run.floor%10===0?chapter.boss:chapter.guardian):chapter.creatures[seed%chapter.creatures.length];
  const p=towerPath(path),elite=path==='elite';
  return {species,name:boss?(run.floor%10===0?`Thủ vệ ${BY_ID[chapter.boss].name}`:`${BY_ID[chapter.guardian].name} canh cổng`):BY_ID[species]?.name||'Bóng tháp',element:chapter.element,boss,elite,chapter,
    power:Math.round(48*Math.pow(1.105,run.floor-1)*p.power),maxHp:boss?205+run.floor*7:108+run.floor*3,kind:boss||run.floor===1?'plain':['armored','caster','berserker'][seed%3],style:boss?((run.floor/5)%2?'fury':'ward'):(seed%3===0?'caster':'strike')};
}
export function towerIntent(run){
  return enemyIntent(run.battle||{},baseIntent(run),towerEncounter(run).maxHp);
}
function baseIntent(run){
  const e=towerEncounter(run),b=run.battle||{},turn=b.turn||0;
  if((turn+1)%3===0)return {id:'heavy',name:'Đòn tháp giáng xuống',text:'Sát thương tăng mạnh. Đỡ hoàn hảo để giảm thiệt hại và mở phản kích.',icon:'swords',danger:true};
  if(turn%4===1&&e.style==='ward')return {id:'ward',name:'Dựng khiên cổ',text:'Đối thủ dựng khiên rồi đánh nhẹ. Tuyệt kỹ phá khiên ngay lập tức.',icon:'shield'};
  if(turn%4===1&&e.style==='caster')return {id:'channel',name:'Đang tụ linh lực',text:'Hợp lực hoặc chiêu đúng nhịp để ngắt phép trước khi nó bùng nổ.',icon:'sparkle'};
  if(turn%4===1&&e.style==='fury')return {id:'rage',name:'Mồi lửa cuồng nộ',text:'Nếu còn ít máu, thủ vệ sẽ đánh đau hơn. Giữ khiên và dồn sát thương.',icon:'flame',danger:true};
  return {id:'strike',name:'Đòn thăm dò',text:'Một đòn đánh thường. Tích năng lượng để cả đội cùng tung tuyệt kỹ.',icon:'swords'};
}

export function towerEnemies(run,encounter=towerEncounter(run)){
  return enemyTeam({element:encounter.chapter.element,primary:encounter.species,seed:(run.seed||0)+run.floor*29,count:encounter.boss?1:run.squad?3:2,pool:encounter.chapter.creatures});
}
