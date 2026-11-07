export const BREED_RECIPES = [
  {id:'lotus',elements:['leaf','water'],species:'lotusseal',hint:'Khi rừng gặp biển'},
  {id:'mist',elements:['fire','wind'],species:'mistfox',hint:'Khi lửa ôm lấy gió'},
  {id:'nebula',elements:['light','shadow'],species:'nebularabbit',hint:'Khi ngày chạm giấc mơ'}
];

export const FISH = [
  {id:'minnow',name:'Cá Mầm Non',spot:'pond',rarity:'N',color:'#9ac7ab',accent:'#5d927a',min:120,max:380,food:12,description:'Một chiếc lá nhỏ đang tập bơi.'},
  {id:'peach',name:'Cá Má Đào',spot:'pond',rarity:'R',color:'#e4b4a5',accent:'#b87c74',min:250,max:800,food:20,description:'Đỏ mặt mỗi lần thấy chiếc phao nổi.'},
  {id:'lotuskoi',name:'Koi Hoa Sen',spot:'pond',rarity:'SR',color:'#e3cba3',accent:'#be8f81',min:700,max:2300,food:35,description:'Mang theo hương sen từ đáy hồ.'},
  {id:'jade',name:'Long Ngư Ngọc',spot:'pond',rarity:'SSR',color:'#a4c8b7',accent:'#ccad67',min:1800,max:4800,food:55,description:'Một huyền thoại xanh lặng lẽ dưới lá sen.'},
  {id:'bluefin',name:'Cá Vây Ngọc',spot:'reef',rarity:'N',color:'#9dcbd2',accent:'#679aa9',min:240,max:650,food:14,description:'Chiếc vây hứng cả màu xanh của biển.'},
  {id:'clown',name:'Cá Hề Nắng',spot:'reef',rarity:'R',color:'#e6bd8f',accent:'#b6835b',min:300,max:950,food:22,description:'Luôn tìm cách làm rạn san hô bật cười.'},
  {id:'coralray',name:'Đuối San Hô',spot:'reef',rarity:'SR',color:'#ceb6c9',accent:'#a77e9e',min:1500,max:4200,food:38,description:'Một cánh diều lướt qua vườn san hô.'},
  {id:'sunfish',name:'Cá Mặt Trời',spot:'reef',rarity:'SSR',color:'#e8d59d',accent:'#b9a264',min:3000,max:8000,food:60,description:'Giữ một tia bình minh giữa biển sâu.'},
  {id:'moonfin',name:'Cá Vây Trăng',spot:'moon',rarity:'N',color:'#b8c7de',accent:'#8399b9',min:180,max:550,food:16,description:'Chỉ bơi theo ánh trăng, kể cả ban ngày.'},
  {id:'starshrimp',name:'Tôm Sao Nhỏ',spot:'moon',rarity:'R',color:'#d5bddb',accent:'#9e86af',min:90,max:280,food:24,description:'Một vì sao đi lạc xuống mặt hồ.'},
  {id:'dreamjelly',name:'Sứa Giấc Mơ',spot:'moon',rarity:'SR',color:'#c5b5df',accent:'#927bb4',min:400,max:1600,food:42,description:'Dưới chiếc ô trong suốt là một giấc mơ.'},
  {id:'galaxy',name:'Cá Ngân Hà',spot:'moon',rarity:'SSR',color:'#aaa9d0',accent:'#d3bb7c',min:2400,max:6600,food:65,description:'Vảy sáng như bầu trời đêm vừa thức giấc.'}
];
export const FISH_BY_ID = Object.fromEntries(FISH.map(f=>[f.id,f]));
export const FISH_SPOTS = [
  {id:'pond',name:'Hồ Lá Sen',subtitle:'Một buổi chiều, một chiếc phao nhỏ.',level:1,color:'#9ab9a4',icon:'leaf'},
  {id:'reef',name:'Bờ San Hô',subtitle:'Theo con sóng ra biển xanh.',level:3,color:'#8fbcc2',icon:'waves'},
  {id:'moon',name:'Bến Nguyệt Quang',subtitle:'Thả một điều ước xuống mặt hồ.',level:6,color:'#b0a3c9',icon:'moon'}
];
export const FISH_MILESTONES = [
  {target:3,reward:{tickets:2,essence:3}},
  {target:6,reward:{tickets:4,essence:6}},
  {target:9,reward:{tickets:6,essence:12}},
  {target:12,reward:{tickets:10,essence:20}}
];
