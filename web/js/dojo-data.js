import { AWAKENING_TRIALS } from './awakening-data.js';
const win={metric:'victory',target:1,text:'Chiến thắng'};
const min=(metric,target,text)=>({metric,target,text});
const max=(metric,target,text)=>({metric,target,text,max:true});
const trio=['mossfox','axolotl','emberbird'];
export const CHALLENGES=[
  {id:'rhythm',name:'Nhịp phản kích',icon:'shield',mode:'explore',enemy:'plain',species:'pebbleturtle',team:trio,power:20,focus:0,
    story:'Hai lần đỡ chuẩn. Một cơ hội phản công.',guide:'Đỡ hoàn hảo khi địch thật sự đánh để mở Phản kích. Lượt Phá thế ngắt địch sẽ không tính là đỡ thành công.',
    goals:[win,min('parries',2,'Đỡ hoàn hảo 2 đòn địch'),min('ripostes',1,'Dùng ít nhất 1 phản kích')]},
  {id:'armor',name:'Khe hở trong lớp giáp',icon:'swords',mode:'explore',enemy:'armored',species:'ferncat',team:trio,power:20,focus:2,paths:{emberbird:'shatter'},
    story:'Mượn nhánh Phá giáp. Tìm nước đi an toàn.',guide:'Chiêu Phá giáp, Hợp lực hoặc chiêu công kích hoàn hảo vô hiệu phản đòn. Đánh thường vào hai lượt thủ giáp sẽ bị phản 9 sát thương.',
    goals:[win,min('armorPierces',1,'Xuyên thế thủ giáp ít nhất 1 lần'),max('armorCounters',0,'Không bị giáp phản đòn')]},
  {id:'spell',name:'Linh chú chưa thành',icon:'sparkle',mode:'explore',enemy:'caster',species:'nightcat',team:trio,power:20,focus:2,
    story:'Ngắt phép trước khi nó kịp bùng nổ.',guide:'Dùng chiêu công kích đúng nhịp hoặc Hợp lực ngay khi địch tụ phép. Đánh thường không ngắt được phép.',
    goals:[win,min('interrupts',1,'Ngắt linh chú ít nhất 1 lần'),max('spellHits',0,'Không nhận đòn linh chú')]},
  {id:'combo',name:'Ba người, một nhịp',icon:'wind',mode:'boss',enemy:'treant',team:['cottonbun','axolotl','emberbird'],power:20,focus:3,
    story:'Nối Hỏa phong, Hơi nước và những bước tiếp sức.',guide:'Đổi thú dùng chiêu để tạo combo. Bước gió hoàn năng lượng; đỡ hoặc đánh thường giữ dấu chiêu trước đó.',
    goals:[win,min('combos',2,'Tạo ít nhất 2 combo'),min('actors',3,'Cả 3 thú đều dùng chiêu riêng')]},
  {id:'underdogs',name:'Những người bạn nhỏ',icon:'paw',mode:'explore',enemy:'berserker',species:'flamefox',team:['cottonbun','pebbleturtle','flamefox'],power:20,focus:2,
    story:'Đội toàn N và R vẫn làm nên chuyện.',guide:'Địch cuồng nộ dưới 40% HP. Giữ Hợp lực hoặc một đòn đã lấy đà để kết liễu; Mai chắn giúp giữ sinh lực.',
    goals:[win,max('turns',6,'Thắng trong tối đa 6 lượt'),min('hpPercent',40,'Kết thúc với ít nhất 40% sinh lực')]},
  {id:'roots',name:'Dưới tán cổ mộc',icon:'leaf',mode:'boss',enemy:'treant',team:trio,power:20,focus:2,
    story:'Chặt rễ hồi sinh, mở lối vào trái tim rừng.',guide:'Rễ xuất hiện ở 60% HP. Nhắm rễ hoặc dùng Hỏa / Hợp lực để chặt hết. Sau lượt tụ sức là Đại chấn rễ.',
    goals:[win,min('rootsCut',2,'Chặt ít nhất 2 rễ hồi sinh'),max('turns',12,'Thắng trong tối đa 12 lượt')]},
  {id:'blizzard',name:'Giữ lửa giữa bão',icon:'waves',mode:'boss',enemy:'frost',team:trio,power:24,focus:2,
    story:'Để bão tuyết không cướp nhịp của cả đội.',guide:'Sau Tụ sương là Bão tuyết. Chiêu Hỏa hoặc Hợp lực ngắt bão; đỡ hoàn hảo cũng ngăn đóng băng.',
    goals:[win,min('interrupts',1,'Ngắt ít nhất 1 Bão tuyết'),max('frozen',0,'Không bị đóng băng năng lượng')]},
  {id:'core',name:'Bình minh không tái sinh',icon:'flame',mode:'boss',enemy:'phoenix',team:trio,power:24,focus:3,
    story:'Phá lõi lửa trước khi đôi cánh trỗi dậy.',guide:'Lõi lộ ở 60% HP. Chọn Phá lõi lửa rồi dồn chiêu; thân chỉ nhận kèm 25% sát thương khi đánh lõi.',
    goals:[win,{metric:'coreBreakTurn',target:6,max:true,positive:true,text:'Phá lõi trước khi hết lượt 6'},max('revives',0,'Không để boss tái sinh')]},
];
export const CHALLENGE_BY_ID=Object.fromEntries(CHALLENGES.map(c=>[c.id,c]));
export const PRACTICE_ENEMIES=[
  {id:'plain',name:'Bia tập phản kích',mode:'explore',species:'pebbleturtle',element:'water',text:'Tập đỡ chuẩn, lấy đà và phản kích.'},
  {id:'armored',name:'Bia giáp phản đòn',mode:'explore',species:'ferncat',element:'leaf',text:'So sánh xuyên giáp, Hợp lực và nhịp hoàn hảo.'},
  {id:'caster',name:'Bia tụ linh chú',mode:'explore',species:'nightcat',element:'shadow',text:'Tìm đúng thời điểm để ngắt phép.'},
  {id:'berserker',name:'Bia cuồng nộ',mode:'explore',species:'flamefox',element:'fire',text:'Giữ chiêu để vượt giai đoạn dưới 40% HP.'},
  {id:'treant',name:'Cổ Mộc Gai',mode:'boss',element:'leaf',text:'Thử đội hình với khiên và rễ hồi sinh.'},
  {id:'frost',name:'Rồng Băng',mode:'boss',element:'water',text:'Luyện ngắt Bão tuyết và làm tan băng.'},
  {id:'phoenix',name:'Phượng Hoàng',mode:'boss',element:'fire',text:'Luyện chọn lõi lửa và chặn tái sinh.'},
];
export const PRACTICE_BY_ID=Object.fromEntries(PRACTICE_ENEMIES.map(e=>[e.id,e]));
export function dojoDefinition(r){const defs=r?.kind==='challenge'?CHALLENGE_BY_ID:r?.kind==='practice'?PRACTICE_BY_ID:r?.kind==='awakening'?AWAKENING_TRIALS:null;return defs&&Object.hasOwn(defs,r.id)?defs[r.id]:null;}
export const DOJO_MILESTONES=[
  {stars:3,name:'Bước chân đầu tiên',reward:{tickets:2,gold:300}},
  {stars:6,name:'Người đọc nhịp',reward:{tickets:2,essence:4},cosmetic:'reader',text:'Danh hiệu hiển thị trên hồ sơ người giữ đảo.'},
  {stars:12,name:'Hào quang ngọc',reward:{tickets:3,essence:6},cosmetic:'aura',text:'Vòng sáng ngọc quanh thú trên đảo và trong bộ sưu tập.'},
  {stars:18,name:'Bia chiến công',reward:{tickets:4,crystals:80},cosmetic:'decoration',text:'Một bia chiến công đặt trên Đảo Bình Yên.'},
  {stars:24,name:'Bậc thầy chiến thuật',reward:{tickets:6,crystals:150},cosmetic:'master',text:'Danh hiệu dành cho người chinh phục đủ 24 sao.'},
];
export const DOJO_TITLES={reader:'Người đọc nhịp',master:'Bậc thầy chiến thuật'};
export const firstClearReward=id=>({tickets:1,gold:200+CHALLENGES.findIndex(c=>c.id===id)*40});
export const starCount=mask=>[1,2,4].filter(b=>mask&b).length;
export const totalStars=state=>Object.values(state.dojo.records).reduce((n,r)=>n+starCount(r.stars),0);
export const challengeUnlocked=(state,id)=>{const i=CHALLENGES.findIndex(c=>c.id===id);return i===0||i>0&&!!(state.dojo.records[CHALLENGES[i-1].id]?.stars&1);};
export function goalState(goal,metrics,status='playing'){
  const value=goal.metric==='victory'?+(status==='victory'):goal.metric==='actors'?Object.keys(metrics.actors).length:goal.metric.startsWith('cast:')?(metrics.actors[goal.metric.slice(5)]?.casts||0):metrics[goal.metric];
  const met=goal.max?value<=goal.target&&(!goal.positive||value>0):value>=goal.target;
  const caption=goal.metric==='victory'?(status==='victory'?'Đã thắng':status==='playing'?'Đang giao đấu':'Chưa thắng'):goal.metric==='hpPercent'?`${value}% / ${goal.target}%`:goal.max?(goal.positive&&!value?`Chưa phá lõi · hạn lượt ${goal.target}`:`${value} / tối đa ${goal.target}`):`${value} / ${goal.target}`;
  return {met,status:status==='victory'&&met,caption,value};
}
