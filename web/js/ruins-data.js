import { enemyIntent } from './enemy-tactics.js';
import { BY_ID } from './data.js';
import { ruinsRouteNode, ROUTE_ELITES } from './ruins-route.js';

export const RUINS_FLOORS = 50;
export const RUINS_UNLOCK = 2;
export const RUINS_ENTRY = { food: 12 };
export const RUINS_CHAPTERS = [
  { id:'roots', name:'Sảnh Rễ Xưa', range:'01 — 10', start:1, color:'#809b75', pale:'#edf2e4', element:'leaf', icon:'leaf', style:'ward', creatures:['mushroom','ferncat','mossfox'], guardian:'pebbleturtle', boss:'forestking', keeper:'Rùa Rêu Canh Cổng', ruler:'Cổ Thụ Ngàn Năm', story:'Rễ cây ôm lấy những bậc thềm. Ai đó đã thắp đèn để chờ bạn từ rất lâu.', title:'Người đánh thức khu rừng' },
  { id:'tides', name:'Hành Lang Thủy Kính', range:'11 — 20', start:11, color:'#709da5', pale:'#e7f0ef', element:'water', icon:'waves', style:'mend', creatures:['axolotl','coralseal','pebbleturtle'], guardian:'lotusseal', boss:'oceandragon', keeper:'Người Giữ Hồ Gương', ruler:'Long Vương Thủy Kính', story:'Dưới mặt nước là bầu trời của một thời đã mất. Những tiếng chuông vẫn ngân qua từng con sóng.', title:'Người lắng nghe thủy triều' },
  { id:'embers', name:'Lò Sao Ngủ Quên', range:'21 — 30', start:21, color:'#b58d70', pale:'#f5ecdf', element:'fire', icon:'flame', style:'fury', creatures:['flamefox','emberbird','lavadragon'], guardian:'mistfox', boss:'phoenix', keeper:'Cáo Canh Lò Sao', ruler:'Phượng Hoàng Tro Ấm', story:'Một tia lửa nhỏ vẫn giữ ấm trái tim phế tích. Hãy tìm người đã hứa sẽ trở về.', title:'Người gìn giữ tia lửa' },
  { id:'dreams', name:'Thư Viện Giấc Mơ', range:'31 — 40', start:31, color:'#9785ae', pale:'#efebf5', element:'shadow', icon:'moon', style:'drain', creatures:['nightcat','duskbun','moonjelly'], guardian:'nebularabbit', boss:'eclipsecat', keeper:'Thỏ Chép Giấc Mơ', ruler:'Miêu Canh Trăng Cũ', story:'Mỗi trang sách là một giấc mơ chưa thành. Có một trang trống đang đợi câu chuyện của bạn.', title:'Người bước qua giấc mơ' },
  { id:'dawn', name:'Trái Tim Bình Minh', range:'41 — 50', start:41, color:'#b59c62', pale:'#f6f0df', element:'light', icon:'sun', style:'fury', creatures:['stardeer','glowmush','sunseal'], guardian:'skywhale', boss:'sunfox', keeper:'Cá Voi Chở Bình Minh', ruler:'Cửu Vĩ Giữ Mạch Đảo', story:'Năm ngọn đèn cùng sáng. Trái tim của những hòn đảo đang chờ một người biết đi cùng bạn bè.', title:'Người giữ trái tim đảo' }
];

export const RUINS_PATHS = {
  trail: { name:'Lối rêu phủ', subtitle:'Giao chiến vừa sức', description:'Một trận chiến thường. Chọn một phép bổ trợ khi vượt qua.', icon:'leaf', power:1, dust:1 },
  elite: { name:'Dấu chân khổng lồ', subtitle:'Đối thủ mạnh hơn 30%', description:'Đổi lấy thêm 75% bụi cổ. Có thể chọn lại phép bổ trợ một lần.', icon:'swords', power:1.3, dust:1.75 },
  spring: { name:'Suối ánh sao', subtitle:'Nghỉ chân giữa hành trình', description:'Hồi 30% sinh lực, thêm 1 năng lượng. Qua tầng này sẽ không nhận phép bổ trợ.', icon:'drop', power:1, dust:0 },
  vault: { name:'Kho tàng lãng quên', subtitle:'Đối thủ có lá chắn', description:'Đối thủ mạnh hơn 12% và có 25 khiên. Thưởng thêm vàng và 40% bụi cổ.', icon:'chest', power:1.12, dust:1.4 },
  event: { name:'Dấu hỏi bên đường', subtitle:'Một cuộc gặp chưa biết', description:'Cứu bạn nhỏ, khám phá rương phong ấn hoặc đổi sinh lực lấy phước lành. Xem rõ đánh đổi trước khi chọn.', icon:'sparkle', power:1, dust:0 },
  boss: { name:'Cánh cửa thủ vệ', subtitle:'Thử thách sau mỗi 5 tầng', description:'Quan sát ý định của thủ vệ, phòng thủ trước đòn mạnh. Thắng được hồi 15% sinh lực.', icon:'trophy', power:1.12, dust:1.5 }
};

export const RUINS_BLESSINGS = [
  {id:'wildfire',name:'Tàn Lửa Lan Xa',icon:'flame',tag:'Hỏa triều · Thiêu đốt',element:'fire',max:2,text:'Thiêu đốt mới từ chiêu riêng và combo mạnh thêm 35% mỗi bậc.'},
  {id:'fireheart',name:'Trái Tim Tro Ấm',icon:'heart',tag:'Hỏa triều · Hồi phục',element:'fire',max:2,text:'Mỗi lượt thiêu đốt gây sát thương, hồi 3 sinh lực mỗi bậc.'},
  {id:'mirror',name:'Gương Thành Cổ',icon:'shield',tag:'Gương thành · Phản đòn',max:2,text:'Phản lại 35% sát thương thực sự bị khiên chặn mỗi bậc.'},
  {id:'wardflow',name:'Mạch Sống Trong Khiên',icon:'sprout',tag:'Gương thành · Hồi phục',max:2,text:'Chiêu riêng tạo được khiên hồi thêm 6 sinh lực mỗi bậc.'},
  {id:'relay',name:'Nhịp Sao Liên Hoàn',icon:'sparkle',tag:'Liên tinh · Nối chiêu',max:2,text:'Combo chiêu riêng gây thêm 20% sát thương và tạo 8 khiên mỗi bậc.'},
  {id:'continuum',name:'Dòng Sao Bất Tận',icon:'bolt',tag:'Liên tinh · Năng lượng',max:1,text:'Mỗi combo giữa hai linh thú khác nhau hoàn 1 năng lượng.'},
  {id:'might',name:'Nanh Cỏ Non',icon:'swords',tag:'Sức mạnh',max:3,text:'Sức mạnh cả đội +10% mỗi bậc.'},
  {id:'vitality',name:'Tim Rừng',icon:'heart',tag:'Sinh lực',max:3,text:'Sinh lực tối đa +15 và hồi ngay 15 sinh lực mỗi bậc.'},
  {id:'recovery',name:'Bữa Tiệc Lá',icon:'berry',tag:'Hồi phục',max:3,text:'Hồi 6 sinh lực sau mỗi trận thắng, mỗi bậc.'},
  {id:'bastion',name:'Mai Rùa Cổ',icon:'shield',tag:'Phòng thủ',max:3,text:'Phòng thủ tạo thêm 8 khiên mỗi bậc. Khiên giữ được qua các tầng.'},
  {id:'courage',name:'Đốm Lửa Kiên Cường',icon:'flame',tag:'Phản công',max:3,text:'Khi còn dưới nửa sinh lực, sát thương tăng 20% mỗi bậc.'},
  {id:'leech',name:'Chén Sương',icon:'drop',tag:'Hồi phục',max:3,text:'Tuyệt kỹ hồi thêm 12% sát thương gây ra mỗi bậc, tối đa 30 sinh lực.'},
  {id:'spark',name:'Hạt Sao Thức Giấc',icon:'bolt',tag:'Năng lượng',max:1,text:'Bắt đầu mỗi trận với ít nhất 1 năng lượng.'},
  {id:'charge',name:'Nhịp Thở Vững Vàng',icon:'wind',tag:'Phòng thủ',max:1,text:'Phòng thủ nhận 2 năng lượng thay vì 1.'},
  {id:'thorns',name:'Vòng Gai Dịu Dàng',icon:'sprout',tag:'Phản công',max:3,text:'Mỗi lần phòng thủ, phản lại 8 sát thương mỗi bậc.'},
  {id:'wind',name:'Bước Chân Của Gió',icon:'wind',tag:'Hệ Phong',element:'wind',max:3,text:'Có Phong: đòn đầu mỗi trận gây thêm 35% sát thương mỗi bậc.'},
  {id:'tide',name:'Khúc Hát Thủy Triều',icon:'waves',tag:'Hệ Thủy',element:'water',max:3,text:'Có Thủy: tuyệt kỹ hồi thêm 8 sinh lực mỗi bậc.'},
  {id:'canopy',name:'Tán Lá Chở Che',icon:'leaf',tag:'Hệ Mộc',element:'leaf',max:3,text:'Có Mộc: 25% sinh lực hồi bằng tuyệt kỹ chuyển thành khiên mỗi bậc.'},
  {id:'ember',name:'Hỏa Vũ',icon:'flame',tag:'Hệ Hỏa',element:'fire',max:3,text:'Có Hỏa: sát thương tuyệt kỹ tăng 25% mỗi bậc.'},
  {id:'radiance',name:'Ánh Sáng Dẫn Đường',icon:'sun',tag:'Hệ Quang',element:'light',max:1,text:'Có Quang: tấn công nhận 2 năng lượng thay vì 1.'},
  {id:'echo',name:'Tiếng Vọng Hoàng Hôn',icon:'moon',tag:'Hệ Ám',element:'shadow',max:3,text:'Có Ám: mỗi lượt thứ ba gây thêm 15 sát thương mỗi bậc, xuyên khiên.'},
  {id:'humble',name:'Sức Mạnh Bạn Nhỏ',icon:'paw',tag:'Thú N / R',max:3,text:'Sức mạnh riêng của các linh thú N và R tăng 25% mỗi bậc.',condition:'humble'},
  {id:'harmony',name:'Muôn Sắc Đồng Hành',icon:'sparkle',tag:'Ba hệ khác nhau',max:2,text:'Đội có 3 hệ khác nhau: sức mạnh cả đội +15% mỗi bậc.',condition:'harmony'},
  {id:'unison',name:'Một Nhịp Tim',icon:'heart',tag:'Ba thú cùng hệ',max:2,text:'Đội có 3 thú cùng hệ: sức mạnh cả đội +20% mỗi bậc.',condition:'unison'},
  {id:'treasure',name:'La Bàn Kho Báu',icon:'compass',tag:'Thu thập',max:3,text:'Bụi cổ nhận được tăng 20% mỗi bậc.'},
  {id:'kindness',name:'Đèn Đom Đóm',icon:'star',tag:'Hồi phục',max:3,text:'Hồi 4 sinh lực mỗi bậc khi bước vào một trận chiến.'},
  {id:'dew',name:'Một Ngụm Bình Yên',icon:'drop',tag:'Hồi ngay',max:50,text:'Hồi ngay 30% sinh lực tối đa và nhận 10 khiên.'}
];
export const RUINS_BLESSING_BY_ID = Object.fromEntries(RUINS_BLESSINGS.map(b=>[b.id,b]));
export const RUINS_RELICS = [
  {id:'lantern',name:'Đèn Rễ Cổ',icon:'heart',text:'Mỗi bậc tăng 8 sinh lực tối đa khi khởi hành.',costs:[25,40,65,100,150]},
  {id:'compass',name:'La Bàn Bình Minh',icon:'compass',text:'Mỗi bậc tăng 5% sức mạnh đội trong phế tích.',costs:[25,40,65,100,150]},
  {id:'flask',name:'Bình Sương Nhỏ',icon:'drop',text:'Mỗi bậc thêm 1 bình hồi 35% sinh lực cho mỗi chuyến đi.',costs:[35,70,120]}
];
export const RUINS_MILESTONES = Array.from({length:10},(_,i)=>({floor:(i+1)*5,reward:{tickets:i+2,essence:(i+1)*2,crystals:20+(i+1)*10},title:(i+1)%2===0?RUINS_CHAPTERS[Math.floor(i/2)].title:null}));
export const RUINS_EXCHANGES = [
  {id:'eggs',name:'Túi trứng mầm',icon:'egg',cost:45,reward:{tickets:2}},
  {id:'essence',name:'Tinh hoa cổ',icon:'gem',cost:30,reward:{essence:6}},
  {id:'provisions',name:'Giỏ tiếp sức',icon:'berry',cost:15,reward:{food:80,wood:25}}
];

export function ruinsChapter(floor) { return RUINS_CHAPTERS[Math.max(0,Math.min(4,Math.floor((floor-1)/10)))]; }
export function ruinsMaxHp(run) { return 100+run.relics.lantern*8+(run.blessings.vitality||0)*15; }
export function ruinsEncounter(run,path=run.path) {
  const chapter=ruinsChapter(run.floor);const boss=run.floor%5===0;
  const selector=((run.seed>>>0)+run.floor*17)>>>0;
  const species=boss?(run.floor%10===0?chapter.boss:chapter.guardian):chapter.creatures[selector%chapter.creatures.length];
  const node=run.route?ruinsRouteNode(run,run.route.position):null;
  const elite=path==='elite'&&node?.elite?{id:node.elite,...ROUTE_ELITES[node.elite]}:null;
  return {species,name:elite?.name||(boss?(run.floor%10===0?chapter.ruler:chapter.keeper):BY_ID[species].name),element:boss?chapter.element:BY_ID[species].element,boss,chapter,elite,
    power:Math.round(44*(run.route?Math.pow(1.11,run.floor-run.startFloor)*Math.pow(1.7,(run.startFloor-1)/10):Math.pow(1.11,run.floor-1))*(RUINS_PATHS[path]?.power||1)),
    maxHp:boss?175+Math.floor((run.floor-1)/10)*14+(run.floor%10===0?15:0):92+run.floor*2,
    kind:elite?.kind||(boss||run.floor===1?'plain':['armored','caster','berserker'][selector%3]),
    style:boss?chapter.style:(selector%4===0?'ward':'strike')};
}
export function ruinsIntent(run) {
  const e=ruinsEncounter(run);const intent=enemyIntent(run.battle||{},baseRuinsIntent(run),e.maxHp);
  if(e.elite?.id==='sentinel')return {...intent,text:intent.id==='counter'?'Giảm 50% sát thương và phản 14. Hợp lực, xuyên giáp hoặc chiêu công kích hoàn hảo vượt giáp. Đỡ hoàn hảo phá hết khiên.':intent.text+' Đỡ hoàn hảo phá hết khiên.'};
  if(e.elite?.id==='oracle')return {...intent,text:intent.text.replace('2,15','2,4')+' Ngắt phép nhận 1 năng lượng và 12 khiên.'};
  return intent;
}
function baseRuinsIntent(run) {
  const encounter=ruinsEncounter(run);const battle=run.battle;const turn=battle?.turn||0;
  if((turn+1)%3===0||(encounter.style==='fury'&&battle?.hp<encounter.maxHp*.4&&turn%2===1))return {id:'heavy',name:'Đòn dồn sức',text:'Sát thương gấp 1,9 lần. Phòng thủ sẽ giảm 75%.',icon:'swords',danger:true};
  if(turn%4===1&&encounter.style==='ward')return {id:'ward',name:'Dựng lá chắn',text:'Đối thủ nhận 24 khiên và đánh nhẹ. Tuyệt kỹ có thể phá khiên.',icon:'shield'};
  if(turn%4===1&&encounter.style==='drain')return {id:'drain',name:'Hút ánh sao',text:'Đánh thường và hút 1 năng lượng. Dùng tuyệt kỹ trước khi bị hút.',icon:'moon'};
  if(turn%4===1&&encounter.style==='mend')return {id:'mend',name:'Khúc hát phục hồi',text:'Đối thủ hồi 14% sinh lực thay vì tấn công.',icon:'heart'};
  return {id:'strike',name:'Đòn thăm dò',text:'Một đòn tấn công thường. Tích năng lượng để dùng tuyệt kỹ.',icon:'swords'};
}
export function ruinsBlessingMatches(blessing,run) {
  const species=run.members.map(m=>BY_ID[m.id]);const elements=species.map(s=>s.element);
  if(blessing.element&&!elements.includes(blessing.element))return false;
  if(blessing.condition==='humble'&&!species.some(s=>['N','R'].includes(s.rarity)))return false;
  if(blessing.condition==='harmony'&&new Set(elements).size!==3)return false;
  if(blessing.condition==='unison'&&(elements.length!==3||new Set(elements).size!==1))return false;
  return true;
}
export function ruinsBlessingAvailable(blessing,run) {
  return (run.blessings[blessing.id]||0)<blessing.max&&ruinsBlessingMatches(blessing,run);
}
