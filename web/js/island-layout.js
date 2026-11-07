// Cosmetic placement is separate from production and all combat snapshots.
export const GRID={cols:9,rows:7,x:488,y:222,dx:36,dy:15};
const item=(id,name,kind,w,h,quantity,extra={})=>({id,name,kind,w,h,quantity,...extra});
export const ISLAND_ITEMS=[
  item('hearttree','Cây Trái Tim','treasure',1,1,1,{campaignBoss:'forest-8',unlockText:'Vượt boss chương Rừng Cổ Thụ'}),
  item('tideshell','Vỏ Sò Ngân Nga','treasure',1,1,1,{campaignBoss:'reef-8',unlockText:'Vượt boss chương Vịnh Ngọc Lam'}),
  item('dawnbeacon','Hải Đăng Bình Minh','treasure',1,1,1,{campaignBoss:'volcano-8',unlockText:'Vượt boss chương Núi Lửa'}),
  item('lodge','Nhà cây','building',2,2,1,{building:'lodge'}),
  item('nursery','Vườn ấp','building',2,2,1),
  item('garden','Vườn quả','building',2,1,1,{building:'garden'}),
  item('sawmill','Xưởng gỗ','building',2,2,1,{building:'sawmill'}),
  item('observatory','Đài sao','building',1,1,1,{building:'observatory'}),
  item('sanctuary','Đền cộng hưởng','building',1,1,1,{building:'sanctuary'}),
  item('sapling','Cây tán tròn','garden',1,1,4),
  item('cherry','Cây anh đào','garden',1,1,2),
  item('palm','Dừa gió biển','garden',1,1,2),
  item('flowers','Luống hoa mật','garden',1,1,6),
  item('rockery','Đá cuội rêu','garden',1,1,4),
  item('path','Lối gạch mật ong','path',1,1,18,{ground:true}),
  item('stepping','Đường đá bước','path',1,1,12,{ground:true}),
  item('fence','Hàng rào gỗ','cozy',2,1,4),
  item('lantern','Đèn đom đóm','cozy',1,1,4),
  item('bench','Ghế nghỉ lá','cozy',2,1,2,{activity:'rest'}),
  item('swing','Xích đu mây','cozy',2,1,1,{activity:'play'}),
  item('pond','Hồ sen nhỏ','cozy',2,2,1,{activity:'watch'}),
  item('moonlamp','Nấm trăng sáng','treasure',1,1,2,{level:3,unlockText:'Đảo cấp 3'}),
  item('guardian','Tượng Thủ vệ','treasure',1,1,1,{unlock:'boss',unlockText:'Thắng 1 bậc Thủ vệ'}),
  item('relicgate','Cổng đá cổ','treasure',2,1,1,{unlock:'ruins',unlockText:'Vượt tầng 5 phế tích'}),
  item('hotspring','Suối Ấm','treasure',2,1,1,{volcanoClears:1,unlockText:'Thắng Đồi Than Hồng 1 lần'}),
  item('lavatree','Cây Dung Nham','treasure',1,1,2,{volcanoClears:3,unlockText:'Thắng Đồi Than Hồng 3 lần'}),
  item('stonedragon','Tượng Rồng Đá','treasure',1,1,1,{volcanoClears:5,unlockText:'Thắng Đồi Than Hồng 5 lần'}),
  item('prismfox','Tượng Cáo Hào Quang','treasure',1,1,1,{shinyMilestone:1,unlockText:'Nhận mốc 1 Shiny trong Sổ Hào Quang'}),
  item('prismgate','Cổng Cực Quang','treasure',2,1,1,{shinyMilestone:6,unlockText:'Nhận mốc 6 Shiny trong Sổ Hào Quang'}),
  item('towerlamp','Đèn Thiên Tinh','treasure',1,1,2,{towerFloor:10,unlockText:'Nhận rương tầng 10 Tháp Vô Tận'}),
  item('towerstatue','Tượng Tháp Sao','treasure',1,1,1,{towerFloor:30,unlockText:'Nhận rương tầng 30 Tháp Vô Tận'}),
  item('starlitlantern','Cổng Sao Rơi','treasure',2,1,1,{seasonal:'starlit-festival',unlockText:'Nhận mốc hoặc đổi quà trong Lễ Hội Sao Rơi'}),
  item('coralgarden','Vườn San Hô','treasure',1,1,3,{reefClears:1,unlockText:'Thắng Vịnh Ngọc Lam 1 lần'}),
  item('pearllamp','Đèn Ngọc Trai','treasure',1,1,2,{reefClears:3,unlockText:'Thắng Vịnh Ngọc Lam 3 lần'}),
  item('coralcrab','Tượng Cua San Hô','treasure',1,1,1,{reefClears:5,unlockText:'Thắng Vịnh Ngọc Lam 5 lần'})
];
export const ISLAND_BY_ID=Object.fromEntries(ISLAND_ITEMS.map(i=>[i.id,i]));
export const DECORATIONS=ISLAND_ITEMS.filter(i=>i.kind!=='building');
export const itemOf=type=>Object.hasOwn(ISLAND_BY_ID,type)?ISLAND_BY_ID[type]:null;
export const project=(x,y)=>({x:GRID.x+(x-y)*GRID.dx,y:GRID.y+(x+y)*GRID.dy});
export const unproject=(x,y)=>{const a=(x-GRID.x)/GRID.dx,b=(y-GRID.y)/GRID.dy;return {x:(a+b)/2,y:(b-a)/2};};
export const sizeOf=p=>{const d=itemOf(p.type);return p.rotation?{w:d.h,h:d.w}:{w:d.w,h:d.h};};
export const anchorOf=p=>{const {w,h}=sizeOf(p);return project(p.x+(w-1)/2,p.y+(h-1)/2);};
export function available(state,type) {
  const d=itemOf(type);if(!d)return false;
  if(d.campaignBoss&&!state.campaign?.stages[d.campaignBoss]?.wins)return false;
  if(d.building&&!state.buildings[d.building])return false;
  if(d.level&&state.level<d.level)return false;
  if(d.volcanoClears&&(state.clears?.volcano||0)<d.volcanoClears)return false;
  if(d.shinyMilestone&&!state.shiny?.claimed.includes(d.shinyMilestone))return false;
  if(d.towerFloor&&!state.tower?.claimed.includes(d.towerFloor))return false;
  if(d.seasonal&&!state.seasonal?.unlockedDecorations?.includes(d.id))return false;
  if(d.reefClears&&(state.clears?.reef||0)<d.reefClears)return false;
  if(d.unlock==='boss'&&!(state.boss?.best||state.boss?.rivals?.frost?.best||state.boss?.rivals?.phoenix?.best))return false;
  if(d.unlock==='ruins'&&(state.ruins?.best||0)<5)return false;
  return true;
}
export function placementError(state,layout,p,ignore=p.id) {
  const d=itemOf(p.type);if(!d||!available(state,p.type))return 'Món này chưa mở khóa.';
  if(![p.x,p.y,p.rotation].every(Number.isInteger)||![0,1].includes(p.rotation))return 'Vị trí không hợp lệ.';
  const {w,h}=sizeOf(p);
  if(p.x<0||p.y<0||p.x+w>GRID.cols||p.y+h>GRID.rows)return 'Đặt trọn món đồ trong bãi cỏ nhé.';
  const others=layout.placed.filter(q=>q.id!==ignore);
  if(others.filter(q=>q.type===p.type).length>=d.quantity)return 'Bạn đã đặt hết số món đang có.';
  for(const q of others){
    if(!!itemOf(q.type).ground!==!!d.ground)continue;
    const s=sizeOf(q);
    if(p.x<q.x+s.w&&p.x+w>q.x&&p.y<q.y+s.h&&p.y+h>q.y)return 'Ô này đã có đồ. Thử một ô trống nhé.';
  }
  return null;
}
export function newIslandLayout(state={buildings:{garden:{},lodge:{}}}) {
  const placed=[
    {id:'base-lodge',type:'lodge',x:4,y:2,rotation:0},
    {id:'base-nursery',type:'nursery',x:1,y:5,rotation:0},
    {id:'base-garden',type:'garden',x:4,y:6,rotation:0},
    {id:'base-tree-a',type:'sapling',x:0,y:6,rotation:0},
    {id:'base-tree-b',type:'sapling',x:0,y:0,rotation:0},
    {id:'base-tree-c',type:'sapling',x:8,y:0,rotation:0},
    {id:'base-cherry',type:'cherry',x:2,y:0,rotation:0},
    {id:'base-flowers',type:'flowers',x:7,y:4,rotation:0},
    ...[[3,4],[3,5],[3,6],[4,4],[5,4]].map(([x,y],i)=>({id:`base-path-${i}`,type:'path',x,y,rotation:0}))
  ];
  for(const [type,x,y] of [['sawmill',0,3],['observatory',7,1],['sanctuary',6,0]])if(state.buildings[type])placed.push({id:`base-${type}`,type,x,y,rotation:0});
  return {version:1,nextId:1,placed:placed.filter(p=>!itemOf(p.type).building||state.buildings[p.type])};
}
export const layoutOf=state=>state.islandLayout||newIslandLayout(state);
export function validateLayout(state,layout=state.islandLayout) {
  const fail=()=>{throw new Error('Bố cục đảo không hợp lệ.');};
  if(!layout||layout.version!==1||!Number.isInteger(layout.nextId)||layout.nextId<1||layout.nextId>99999999||!Array.isArray(layout.placed)||layout.placed.length>100)fail();
  const seen=new Set(),checked={placed:[]};
  for(const p of layout.placed){
    if(!p||typeof p.id!=='string'||!/^[a-z0-9-]{1,32}$/.test(p.id)||seen.has(p.id)||!itemOf(p.type)||placementError(state,checked,p,null))fail();
    seen.add(p.id);checked.placed.push(p);
  }
  return layout;
}
export function placeItem(state,layout,type,x,y,rotation=0,id=null) {
  const previous=id?layout.placed.find(p=>p.id===id):null;
  if(id&&!previous)return {error:'Không tìm thấy món đồ.'};
  if(previous&&previous.type!==type)return {error:'Món đồ không khớp.'};
  let next=layout.nextId;
  while(layout.placed.some(p=>p.id===`i${next}`))next++;
  if(!previous&&next>=99999999)return {error:'Đã đạt giới hạn mã đồ trang trí.'};
  const p={id:previous?.id||`i${next}`,type,x,y,rotation};
  const error=placementError(state,layout,p);if(error)return {error};
  if(previous)Object.assign(previous,p);else{layout.placed.push(p);layout.nextId=next+1;}
  return {item:previous||p};
}
export function storeItem(layout,id) {
  const index=layout.placed.findIndex(p=>p.id===id);if(index<0)return {error:'Không tìm thấy món đồ.'};
  return {item:layout.placed.splice(index,1)[0]};
}
export function commitLayout(state,draft) {
  try{validateLayout(state,draft);}catch(e){return {error:e.message};}
  state.islandLayout=JSON.parse(JSON.stringify(draft));return {layout:state.islandLayout};
}
