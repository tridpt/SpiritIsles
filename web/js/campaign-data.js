import {BIOMES,BY_ID} from './data.js';

export const CAMPAIGN_CHAPTERS=[
  {id:'forest',number:1,name:'Rừng Cổ Thụ',subtitle:'Đánh thức trái tim xanh',element:'leaf',icon:'tree',color:'#295e44',accent:'#d9ec8b',decoration:'hearttree',decorationName:'Cây Trái Tim',speaker:'Cáo Rêu',portrait:'mossfox',intro:'Ngọn hải đăng trên đảo bỗng tắt. Cáo Rêu tìm thấy một chiếc lá phát sáng: trái tim của Cổ Thụ đang bị những chiếc gai đen giữ lại.',outro:'Gai đen tan ra thành đom đóm. Cổ Thụ trao một hạt giống biết phát sáng và chỉ về phía biển: mảnh ánh sáng thứ hai đang ngủ dưới sóng.',boss:'Cổ Thụ Gai Đen',leader:'forestking',helpers:['ferncat','mushroom'],bossGuide:'Rễ trồi mỗi 3 lượt: né để giảm 85% sát thương. Khi còn nửa sinh lực, Cổ Thụ thức giấc và gọi hai mầm gai.'},
  {id:'reef',number:2,name:'Vịnh Ngọc Lam',subtitle:'Tìm lại khúc hát của biển',element:'water',icon:'waves',color:'#125e77',accent:'#99efe8',decoration:'tideshell',decorationName:'Vỏ Sò Ngân Nga',speaker:'Kỳ Giông Suối',portrait:'axolotl',intro:'Hạt giống xanh soi đường tới một vịnh biển im tiếng. Những vỏ sò không còn hát; người giữ ngọc đã khóa cả dòng triều trong chiếc mai của mình.',outro:'Viên ngọc mở ra, trả tiếng hát cho vịnh. Một tia sáng đỏ bay về ngọn núi xa. Cả đội mang theo vỏ sò ngân nga để tìm ngọn lửa cuối cùng.',boss:'Vua Cua Khóa Triều',leader:'pebbleturtle',helpers:['moonjelly','axolotl'],bossGuide:'Sóng triều mỗi 3 lượt: né để mở điểm yếu cho đòn sau. Sang pha hai, Vua Cua gọi Sứa Tích Điện và Sò Ngọc hỗ trợ.'},
  {id:'volcano',number:3,name:'Núi Lửa',subtitle:'Giữ ngọn lửa của tình bạn',element:'fire',icon:'flame',color:'#783e36',accent:'#ffd18e',decoration:'dawnbeacon',decorationName:'Hải Đăng Bình Minh',speaker:'Chim Than Hồng',portrait:'emberbird',intro:'Dưới lớp tro, một rồng đá đang ôm mảnh sáng cuối. Nó tưởng mọi người đến cướp lửa. Chim Than Hồng tin rằng chỉ cần tới đủ gần, rồng sẽ nghe thấy lời chào.',outro:'Rồng mở đôi cánh đá. Ba mảnh sáng hòa lại thành bình minh, thắp sáng hải đăng trên đảo. Những người bạn đã tìm được đường về — và một thế giới còn rộng mở.',boss:'Rồng Đá Giữ Bình Minh',leader:'lavadragon',helpers:['flamefox','emberbird'],bossGuide:'Phá 45 giáp đá rồi phản công trong 2 đòn hở điểm yếu. Né dậm đất, hơi lửa và dung nham. Nửa sinh lực: rồng gọi đồng đội và tăng sức ép.'}
];
const stories=[
  [
    ['Chiếc lá dẫn đường','Dấu chân nhỏ dẫn tới bìa rừng. Chiếc lá trong tay sáng lên mỗi khi cả đội bước cùng nhau.','Cứ đi theo ánh lá nhé. Có ai đó đang cần chúng ta!','speed',8],
    ['Bầy nấm mất ngủ','Những cây nấm cãi nhau vì một tiếng động trong bụi. Hãy dùng kỹ năng riêng để giải vây.','Mỗi người bạn đều có một tài năng. Thử gọi tên chiêu của bạn ấy xem!','skills',2],
    ['Cầu rễ đong đưa','Cầu rễ nghiêng qua suối. Những kẻ giữ đường chỉ chịu lùi khi thấy cả đội biết che chở nhau.','Chậm một nhịp để dựng khiên cũng là tiến về phía trước.','guards',1],
    ['Đom đóm dẫn lối','Đom đóm nối thành một dải sáng. Hai hệ cộng hưởng có thể xua màn sương đang phủ lối.','Nối chiêu của hai bạn khác hệ — ánh sáng sẽ mạnh hơn.','combos',1],
    ['Suối ký ức','Dòng suối phản chiếu một khu rừng xưa. Cả đội cần giữ sức để mang ký ức ấy về.','Đừng để ai phải cố quá sức. Một chiêu hồi phục sẽ có ích đấy.','health',65],
    ['Tiếng gọi trong gai','Những dây gai bắt đầu khép lại. Chỉ còn một lối hẹp trước khi mặt trời khuất sau tán cây.','Cùng dồn sức mở đường trước khi gai kịp mọc lại!','speed',9],
    ['Cánh cửa xanh','Ba tảng đá chặn cửa Cổ Thụ. Mỗi kỹ năng riêng làm một ký hiệu trên cửa sáng lên.','Bạn đã đi xa đến đây rồi. Hãy tin vào từng người trong đội.','skills',3],
    ['Trái tim Cổ Thụ','Ở giữa những chiếc gai đen là một trái tim vẫn đập. Cổ Thụ không muốn chiến đấu; nó đang sợ hãi.','Đọc chuyển động của rễ. Né đòn rồi chúng ta sẽ tìm cách giúp ông ấy.','evades',1]
  ],
  [
    ['Bờ cát im lặng','Không còn tiếng sóng trong những vỏ sò. Dấu ngọc lam dẫn cả đội xuống bãi triều.','Biển vẫn đang ở đây. Mình sẽ tìm lại bài hát cho biển.','speed',9],
    ['Đội tuần tra vỏ cứng','Những chiếc càng khép lại trên cầu gỗ. Dùng kỹ năng để xuyên qua hàng phòng thủ.','Đừng chỉ đánh vào chiếc mai. Mỗi chiêu sẽ mở một cơ hội khác nhau.','skills',2],
    ['Tia điện dưới nước','Ánh tím nhấp nháy giữa đám sứa. Cả đội dựng thế phòng thủ trước luồng điện.','Thấy sứa gom điện thì hãy che cho các bạn nhé!','guards',1],
    ['Rạn san hô gãy','San hô lạc màu cần một nhịp cộng hưởng. Hãy nối kỹ năng để đánh thức những chồi ngọc.','Hai nguyên tố gặp nhau, cả rạn sẽ cùng sáng.','combos',1],
    ['Vườn sò ngọc','Sò Ngọc chia những giọt nước lành. Đưa cả đội qua khu vườn với sinh lực dồi dào.','Một đội mạnh là đội biết chăm sóc nhau.','health',65],
    ['Dòng chảy ngược','Dòng triều đang đổi hướng. Đánh nhanh qua những đội canh trước khi cầu cát chìm.','Đường biển sắp khép lại. Cùng tiến lên nào!','speed',10],
    ['Cổng cung điện triều','Ba dấu ngọc khóa cửa cung điện. Chỉ những chiêu riêng mới làm chúng ngân tiếng.','Mình nghe thấy tiếng hát rồi. Nó ở ngay phía sau cánh cổng.','skills',3],
    ['Khúc hát bị khóa','Vua Cua ôm viên ngọc trong chiếc mai khổng lồ. Mỗi cơn sóng là một nhịp của bài hát bị lãng quên.','Đợi sóng tới rồi né. Chiếc mai sẽ hé mở!','evades',1]
  ],
  [
    ['Con đường tro ấm','Tro vẫn còn ấm dưới chân. Một đốm lửa nhỏ nhảy múa, dẫn cả đội vào sườn núi.','Ngọn lửa này không muốn làm đau ai. Nó đang chỉ đường cho chúng ta.','speed',10],
    ['Đội gác đá đen','Những hộ vệ nham thạch canh lối. Kỹ năng riêng sẽ giúp cả đội phá vòng vây.','Có khiên đá thì dùng chiêu phá thế. Đừng quên người hồi máu nhé.','skills',2],
    ['Cầu trên dòng nham','Tảng đá dưới cầu bắt đầu rung. Cả đội cần một nhịp phòng thủ để đứng vững.','Mình sẽ đứng phía trước. Các bạn cứ theo sau!','guards',1],
    ['Ngọn lửa hai màu','Một đám lửa xanh cháy giữa tro đỏ. Cộng hưởng nguyên tố có thể mở cửa lò cổ.','Nối chiêu, rồi xem ngọn lửa sẽ đổi màu thế nào.','combos',1],
    ['Suối ấm cuối đường','Hơi nước kéo thành những dải mây mỏng. Giữ sinh lực trước chặng đường khó nhất.','Nghỉ một chút nhé. Mình muốn cả đội cùng nhìn thấy bình minh.','health',65],
    ['Trước giờ núi thức','Những vết nứt lan dọc sườn núi. Cả đội phải vượt qua đội canh cuối trước khi dung nham dâng.','Nhanh lên nào, nhưng nhớ giữ nhịp cùng nhau!','speed',11],
    ['Lời chào qua vách đá','Tiếng rồng vọng lên từ lòng núi. Ba kỹ năng riêng thắp những ngọn đèn dọc cửa hang.','Chúng mình đến để kết bạn. Hy vọng rồng nghe được lời này.','skills',3],
    ['Bình minh trở lại','Mảnh sáng nằm trong đôi cánh đá. Rồng mở mắt, gọi những người bạn lửa và chuẩn bị bảo vệ điều nó quý nhất.','Đừng sợ. Né qua ngọn lửa, rồi cùng đưa ánh sáng về đảo!','evades',2]
  ]
];
const powers=[[34,40,46,52,58,64,70,80],[90,100,112,124,136,148,160,178],[190,206,222,238,254,270,290,320]];
export const CAMPAIGN_STAGES=CAMPAIGN_CHAPTERS.flatMap((ch,c)=>stories[c].map(([name,story,dialogue,kind,target],i)=>({id:`${ch.id}-${i+1}`,chapter:ch.id,chapterNumber:c+1,number:i+1,label:`${c+1}-${i+1}`,name,story,dialogue,goal:{kind,target},power:powers[c][i],waves:i===7?3:2,boss:i===7,cost:{food:10+c*4+(i===7?2:0)},reward:{gold:45+c*30+i*8,wood:4+c*3,essence:1+c},firstReward:{gold:100+c*100+i*15,crystals:15+c*10,tickets:i===7?3:1,essence:3+c*2}})));
export const CAMPAIGN_BY_ID=Object.fromEntries(CAMPAIGN_STAGES.map(s=>[s.id,s]));
export const campaignStage=id=>Object.hasOwn(CAMPAIGN_BY_ID,id)?CAMPAIGN_BY_ID[id]:null;
export const chapterOf=id=>CAMPAIGN_CHAPTERS.find(c=>c.id===(typeof id==='object'?id.chapter:id));
export function campaignBiome(run){
  const base=BIOMES.find(b=>b.id===run?.biome),s=campaignStage(run?.campaign?.id);if(!s)return base;
  const ch=chapterOf(s);return {...base,name:`${s.label} · ${s.name}`,subtitle:ch.name,stages:s.waves,boss:ch.boss,power:s.power};
}
export function campaignEvent(run){
  const s=campaignStage(run?.campaign?.id);if(!s)return null;
  return {title:run.stage===0?s.name:`Tiến sâu hơn · Đợt ${run.stage+1}`,text:run.stage===0?s.story:s.dialogue,choices:[{text:'Cùng tiến bước',icon:'paw',heal:run.stage?10:0,reward:{},threat:1,detail:run.stage?'Hồi 10 sinh lực trước trận':'Tiến tới đội canh tiếp theo'}]};
}
export function campaignEnemies(run){
  const s=campaignStage(run?.campaign?.id);if(!s||!run.battle)return null;
  const ch=chapterOf(s),boss=run.battle.boss;
  const pools={forest:[['mossfox','mushroom','ferncat'],['maplehog','sproutpanda','ferncat']],reef:[['pebbleturtle','moonjelly','axolotl'],['coralseal','moonjelly','lotusseal']],volcano:[['pebbleturtle','flamefox','emberbird'],['flamefox','emberbird','lavadragon']]};
  const species=boss?(run.battle.campaignPhase===2?[ch.leader,...ch.helpers]:[ch.leader]):pools[ch.id][(s.number+run.stage)%2];
  return species.map((id,i)=>({id:`enemy-${i}`,species:id,element:BY_ID[id].element,name:boss&&i===0?ch.boss:BY_ID[id].name}));
}
export function campaignGoalText(s){const {kind,target}=s.goal;return kind==='speed'?`Hoàn thành trong ${target} lượt`:kind==='skills'?`Dùng ${target} kỹ năng riêng`:kind==='combos'?`Tạo ${target} combo nguyên tố`:kind==='guards'?`Phòng thủ ${target} lượt`:kind==='evades'?`Né cảnh báo ${target} lần`:`Còn ít nhất ${target}% sinh lực khi thắng`;}
export const campaignChestReward=(ch,n)=>({tickets:n===24?5:n===16?3:2,crystals:n*5,essence:ch.number*(n===24?8:4)});
