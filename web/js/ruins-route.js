// The map is derived from the departure seed, so looking ahead never consumes RNG.
export const ROUTE_ROOMS=10;
export const ROUTE_ELITES={
  sentinel:{name:'Vệ Binh Gương Rêu',icon:'shield',kind:'armored',text:'Hai lượt thủ giáp chặn 50% sát thương và phản 14. Hợp lực, xuyên giáp hoặc chiêu công kích hoàn hảo vượt giáp. Đỡ hoàn hảo phá hết khiên.'},
  oracle:{name:'Tư Tế Sao Lạc',icon:'bolt',kind:'caster',text:'Tụ phép rồi tung chú mạnh ×2,4. Ngắt phép bằng Hợp lực, chiêu công kích đúng nhịp hoặc Phá thế để nhận 1 năng lượng và 12 khiên.'}
};
export const ROUTE_EVENTS={
  rescue:{name:'Tiếng gọi dưới rễ cây',icon:'paw',text:'Một linh thú nhỏ mắc kẹt dưới gốc cây đổ. Nó nhìn giỏ hành trang, rồi nhìn những người bạn của bạn.',choices:[
    {id:'feed',name:'Dỗ bạn nhỏ bằng quả mọng',text:'Dùng 16 quả mọng; nhận một phước lành hồi phục.',food:16,blessing:'care'},
    {id:'lift',name:'Cùng nhau nâng rễ cây',text:'Mất 12% sinh lực tối đa; nhận 10 bụi cổ và 60 vàng.',hp:.12,dust:10,gold:60},
    {id:'guide',name:'Tìm một khe hở an toàn',text:'Không tốn tài nguyên. Bạn nhỏ tặng 4 bụi cổ trước khi trở về rừng.',dust:4}
  ]},
  chest:{name:'Rương trăng khuyết',icon:'chest',text:'Một sợi xích đen quấn quanh chiếc rương. Món quà càng sáng, cái bóng đi theo bạn càng dài.',choices:[
    {id:'unseal',name:'Phá phong ấn',text:'Nhận 24 bụi cổ, 120 vàng và một phước lành. Thêm 1 lời nguyền: địch gây thêm 15% sát thương đến hết chuyến.',curse:1,dust:24,gold:120,blessing:'build'},
    {id:'outer',name:'Mở ngăn nhỏ bên ngoài',text:'Nhận 6 bụi cổ và 35 vàng, không mang lời nguyền.',dust:6,gold:35},
    {id:'leave',name:'Để chiếc rương ngủ yên',text:'Bước tiếp với những gì cả đội đang có.'}
  ]},
  altar:{name:'Bệ đá cộng sinh',icon:'heart',text:'Những nét khắc trên bệ đá sáng lên theo nhịp tim. Một chút sức sống có thể đánh thức một phép màu.',choices:[
    {id:'offer',name:'Chia sẻ sức sống',text:'Mất 20% sinh lực tối đa; nhận một phước lành dành cho bộ chiến thuật.',hp:.2,blessing:'build'},
    {id:'dew',name:'Hứng sương trên bệ đá',text:'Hồi 25% sinh lực tối đa.',heal:.25},
    {id:'listen',name:'Lắng nghe nhịp đá',text:'Nhận 1 năng lượng cho trận kế tiếp.',focus:1}
  ]},
  trader:{name:'Lều của người lữ hành',icon:'berry',text:'Một ngọn đèn nhỏ bên đường. Người lữ hành dành sẵn bình sương và một ấm trà cho những ai đi xa.',choices:[
    {id:'flask',name:'Mua một bình sương',text:'Trả 90 vàng; thêm 1 bình sương, trong giới hạn túi.',costGold:90,potion:1},
    {id:'tea',name:'Uống trà rễ ấm',text:'Trả 60 vàng; hồi 40% sinh lực tối đa.',costGold:60,heal:.4},
    {id:'talk',name:'Ngồi nghe một câu chuyện',text:'Nhận 1 năng lượng, không tốn vàng.',focus:1}
  ]},
  rest:{name:'Trạm nghỉ ánh sao',icon:'drop',text:'Nước suối trong veo và một chiếc bình sương chưa mở. Cả đội chỉ đủ thời gian chọn một cách tiếp sức.',choices:[
    {id:'rest',name:'Nghỉ bên suối',text:'Hồi 45% sinh lực tối đa và nhận 1 năng lượng.',heal:.45,focus:1},
    {id:'refill',name:'Đổ đầy một bình sương',text:'Nhận 1 bình sương để dành cho trận khó, trong giới hạn túi.',potion:1}
  ]}
};
export const ROUTE_BUILDS=[
  {id:'fire',name:'Hỏa triều',icon:'flame',ids:['wildfire','fireheart'],text:'Thiêu đốt mạnh hơn → mỗi lượt đốt hồi sinh lực.'},
  {id:'ward',name:'Gương thành',icon:'shield',ids:['mirror','wardflow'],text:'Chiêu tạo khiên hồi sinh lực → khiên chặn đòn phản sát thương.'},
  {id:'combo',name:'Liên tinh',icon:'sparkle',ids:['relay','continuum'],text:'Đổi người nối chiêu → tăng lực, thêm khiên và hoàn năng lượng.'}
];
export const ROUTE_BUILD_IDS=ROUTE_BUILDS.flatMap(b=>b.ids);
const mix=(seed,n)=>{let h=(seed^Math.imul(n+1,0x9e3779b9))>>>0;h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);return (h^(h>>>16))>>>0;};
export function newRuinsRoute(){return {version:1,position:null,history:[],curse:0};}
export function ruinsRouteMap(run){
  const events=['rescue','chest','altar','trader'];
  return Array.from({length:ROUTE_ROOMS},(_,i)=>{
    const room=i+1,floor=run.startFloor+i;
    if(room%5===0)return [{id:`${room}:1`,room,floor,lane:1,kind:'boss',event:null,elite:null}];
    const kinds=room===1?['trail','event','vault']:room%3===1?['elite','spring','event']:room%3===2?['spring','trail','elite']:['event','elite','trail'];
    const shift=mix(run.seed,room)%3;
    return [0,1,2].map(lane=>{const kind=kinds[(lane+shift)%3];return {id:`${room}:${lane}`,room,floor,lane,kind,event:kind==='spring'?'rest':kind==='event'?events[mix(run.seed,room*7+lane)%events.length]:null,elite:kind==='elite'?(mix(run.seed,room*11+lane)%2?'sentinel':'oracle'):null};});
  });
}
export const ruinsRouteNode=(run,id)=>ruinsRouteMap(run).flat().find(n=>n.id===id)||null;
export function ruinsRouteNext(run){
  const row=ruinsRouteMap(run)[run.floor-run.startFloor]||[];
  const last=run.route?.history.at(-1);const previous=last?ruinsRouteNode(run,last.node):null;
  return row.filter(n=>!previous||previous.kind==='boss'||n.kind==='boss'||Math.abs(n.lane-previous.lane)<=1);
}
export function ruinsRouteBlessing(run,node,pool,category){
  const care=['kindness','recovery','vitality','dew'];
  const preferred=pool.filter(id=>(category==='care'?care:ROUTE_BUILD_IDS).includes(id));
  const choices=preferred.length?preferred:pool;
  return choices.length?choices[mix(run.seed,node.room*19+node.lane)%choices.length]:null;
}
export function routeChoiceError(state,choice){
  const r=state.ruins.run;
  if(choice.hp&&r.hp<=Math.ceil((100+r.relics.lantern*8+(r.blessings.vitality||0)*15)*choice.hp))return 'Cần còn đủ sinh lực sau khi chia sẻ.';
  if(choice.food&&state.resources.food<choice.food)return `Cần ${choice.food} quả mọng.`;
  if(choice.costGold&&state.resources.gold<choice.costGold)return `Cần ${choice.costGold} vàng.`;
  if(choice.potion&&r.potions>=1+r.relics.flask)return 'Túi bình sương đã đầy.';
  if(choice.curse&&r.route.curse>=3)return 'Đã mang tối đa 3 lời nguyền.';
  if(choice.heal&&!choice.focus&&r.hp>=100+r.relics.lantern*8+(r.blessings.vitality||0)*15)return 'Cả đội đang đầy sinh lực.';
  return '';
}
