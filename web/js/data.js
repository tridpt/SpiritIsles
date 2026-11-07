import { NEW_SPECIES } from './creature-catalog.js';

export const ELEMENTS = {
  leaf: { name:'Mộc', color:'#4c9b64', pale:'#e9f4e3', icon:'leaf', strong:'water' },
  water:{ name:'Thủy', color:'#4a9fb9', pale:'#e5f4f8', icon:'drop', strong:'fire' },
  fire: { name:'Hỏa', color:'#d77a50', pale:'#fff0e4', icon:'flame', strong:'leaf' },
  wind: { name:'Phong', color:'#8e9d55', pale:'#f0f3e1', icon:'wind', strong:'leaf' },
  light:{ name:'Quang', color:'#c5a049', pale:'#faf1d7', icon:'sun', strong:'shadow' },
  shadow:{ name:'Ám', color:'#8b7aaf', pale:'#f1eafa', icon:'moon', strong:'light' }
};
export const RARITIES = {
  N: { name:'Thân quen', color:'#7b9279', chance:50, power:18, shards:1 },
  R: { name:'Hiếm', color:'#579bab', chance:32, power:24, shards:2 },
  SR:{ name:'Sử thi', color:'#9a7ba8', chance:15, power:31, shards:4 },
  SSR:{ name:'Huyền thoại', color:'#bc9247', chance:3, power:40, shards:8 }
};
export const SPECIES = [
  {id:'mossfox',name:'Cáo Mầm',element:'leaf',rarity:'N',shape:'fox',color:'#b5d892',accent:'#659460',description:'Mỗi chiếc lá trên đuôi là một lời chúc may mắn. Thích ngủ dưới bóng cây.',skill:'Mầm sống',perk:'Vườn quả +8%'},
  {id:'axolotl',name:'Kỳ Nhông Mây',element:'water',rarity:'R',shape:'axolotl',color:'#a2dadd',accent:'#e4a6bc',description:'Bơi qua những đám mây thấp để nhặt giọt sương. Luôn mỉm cười, kể cả khi lạc đường.',skill:'Bọt hồi phục',perk:'Khám phá +5% vàng'},
  {id:'emberbird',name:'Chim Than Hồng',element:'fire',rarity:'R',shape:'bird',color:'#edbe78',accent:'#db7c56',description:'Ngọn lửa trên đầu chỉ ấm bằng một tách trà. Bạn đồng hành lý tưởng vào buổi tối.',skill:'Lửa trại',perk:'Khám phá +5% gỗ'},
  {id:'cottonbun',name:'Thỏ Bông',element:'wind',rarity:'N',shape:'rabbit',color:'#f0dfbf',accent:'#c9b791',description:'Đôi tai bắt được cả tiếng hạt mầm nảy dưới đất. Chạy nhanh hơn một cơn gió nhỏ.',skill:'Bước gió',perk:'Khám phá +5% thức ăn'},
  {id:'sunseal',name:'Hải Cẩu Nắng',element:'light',rarity:'N',shape:'seal',color:'#f0d99a',accent:'#cba663',description:'Phơi nắng trên bãi biển rồi chia hơi ấm cho mọi người bằng một cái ôm.',skill:'Nắng dịu',perk:'Nhà cây +8%'},
  {id:'nightcat',name:'Mèo Trăng',element:'shadow',rarity:'N',shape:'cat',color:'#bfb5d6',accent:'#8b7aa9',description:'Mỗi tối mang về một mẩu giấc mơ. Đừng đánh thức khi chiếc đuôi đang phát sáng.',skill:'Mộng lành',perk:'Đài sao +8%'},
  {id:'mushroom',name:'Nấm Lon Ton',element:'leaf',rarity:'N',shape:'mushroom',color:'#d9dca5',accent:'#a7bd83',description:'Có thể giả làm nấm bình thường, nhưng không nhịn được cười khi trời mưa.',skill:'Bào tử ấm',perk:'Vườn quả +8%'},
  {id:'pebbleturtle',name:'Rùa Cuội',element:'water',rarity:'N',shape:'turtle',color:'#a8c5ad',accent:'#729b88',description:'Mang theo một khu vườn bé xíu trên lưng. Đi chậm để không làm rơi bông hoa.',skill:'Mai chắn',perk:'Xưởng gỗ +8%'},
  {id:'ferncat',name:'Mèo Dương Xỉ',element:'leaf',rarity:'R',shape:'cat',color:'#bdcf91',accent:'#7b9c5b',description:'Lá dương xỉ trên tai mở ra mỗi khi gặp một người bạn mới.',skill:'Lá chắn xanh',perk:'Vườn quả +10%'},
  {id:'flamefox',name:'Cáo Đốm Lửa',element:'fire',rarity:'N',shape:'fox',color:'#e8b692',accent:'#c77858',description:'Thích nướng hạt dẻ và chia phần lớn nhất cho bạn.',skill:'Tàn lửa',perk:'Nhà cây +8%'},
  {id:'breezebird',name:'Sẻ Gió',element:'wind',rarity:'R',shape:'bird',color:'#c8d6ae',accent:'#8ba177',description:'Lưu giữ những bài hát ở các hòn đảo đã đi qua trong chiếc lông vũ.',skill:'Gió dẫn lối',perk:'Khám phá +5% thức ăn'},
  {id:'stardeer',name:'Hươu Sao',element:'light',rarity:'R',shape:'deer',color:'#e9d7aa',accent:'#bd9b68',description:'Những chấm sáng trên lưng tạo thành bản đồ trời đêm.',skill:'Ánh dẫn đường',perk:'Đài sao +10%'},
  {id:'duskbun',name:'Thỏ Hoàng Hôn',element:'shadow',rarity:'R',shape:'rabbit',color:'#cebbce',accent:'#a18da5',description:'Xuất hiện ở khoảnh khắc ngày và đêm chạm nhau. Tai mềm như một đám mây.',skill:'Màn sương',perk:'Khám phá +5% vàng'},
  {id:'coralseal',name:'Hải Cẩu San Hô',element:'water',rarity:'SR',shape:'seal',color:'#abd5dc',accent:'#e2a69a',description:'Người chăm sóc rạn san hô. Tiếng hát có thể làm biển lặng sóng.',skill:'Khúc biển xanh',perk:'Khám phá +8% vàng'},
  {id:'blossomdeer',name:'Hươu Hoa Đào',element:'leaf',rarity:'SR',shape:'deer',color:'#ebc4c3',accent:'#b27e92',description:'Mỗi bước chân để lại một cánh hoa, ngay cả giữa mùa đông.',skill:'Vườn xuân',perk:'Vườn quả +15%'},
  {id:'lavadragon',name:'Rồng Núi Lửa',element:'fire',rarity:'SR',shape:'dragon',color:'#dba27c',accent:'#a9685a',description:'Một chú rồng tập phun lửa. Hiện tại mới thổi được những vòng khói hình trái tim.',skill:'Hỏa vũ',perk:'Khám phá +8% gỗ'},
  {id:'cloudfox',name:'Cáo Bồng Bềnh',element:'wind',rarity:'SR',shape:'fox',color:'#d9e4d4',accent:'#95b5a6',description:'Chiếc đuôi thật ra là một đám mây đang học cách trở thành cáo.',skill:'Vũ điệu mây',perk:'Khám phá +8% thức ăn'},
  {id:'moonjelly',name:'Sứa Nguyệt Quang',element:'shadow',rarity:'SR',shape:'jelly',color:'#c7b7e3',accent:'#9480be',description:'Bơi giữa không trung, mang theo những điều ước chưa kịp nói.',skill:'Sóng giấc mơ',perk:'Đài sao +15%'},
  {id:'glowmush',name:'Nấm Đom Đóm',element:'light',rarity:'SR',shape:'mushroom',color:'#e1d8a6',accent:'#b1b87d',description:'Những đốm sáng trên mũ nấm là nhà của cả một gia đình đom đóm.',skill:'Ngàn đốm sáng',perk:'Nhà cây +15%'},
  {id:'forestking',name:'Hươu Thần Rừng',element:'leaf',rarity:'SSR',shape:'deer',color:'#c0d6ab',accent:'#759b76',description:'Người gìn giữ khu rừng đầu tiên. Trên cặp sừng mọc một mùa xuân bất tận.',skill:'Rừng vĩnh cửu',perk:'Vườn quả +25%'},
  {id:'oceandragon',name:'Long Vương Biển',element:'water',rarity:'SSR',shape:'dragon',color:'#99cfd4',accent:'#6195b1',description:'Mang cả đại dương trong một giọt nước. Chỉ xuất hiện khi bạn thật lòng tin vào phép màu.',skill:'Thủy triều xanh',perk:'Khám phá +12% vàng'},
  {id:'phoenix',name:'Phượng Bình Minh',element:'fire',rarity:'SSR',shape:'bird',color:'#f0cc83',accent:'#d98a67',description:'Mỗi chiếc lông là một tia nắng đầu ngày. Tái sinh từ những lời hứa được giữ.',skill:'Bình minh rực rỡ',perk:'Khám phá +12% gỗ'},
  {id:'skywhale',name:'Cá Voi Tầng Mây',element:'wind',rarity:'SSR',shape:'whale',color:'#bdddd9',accent:'#83b2b4',description:'Chở những hòn đảo nhỏ đi dạo giữa bầu trời. Bài hát vang tới tận chân trời.',skill:'Biển trời',perk:'Khám phá +12% thức ăn'},
  {id:'sunfox',name:'Cửu Vĩ Ánh Dương',element:'light',rarity:'SSR',shape:'fox',color:'#f1dfac',accent:'#c8a66e',description:'Mỗi chiếc đuôi giữ một tia nắng. Chọn làm bạn với người biết quan tâm đến những điều nhỏ bé.',skill:'Chín vầng sáng',perk:'Nhà cây +25%'},
  {id:'eclipsecat',name:'Miêu Nhật Thực',element:'shadow',rarity:'SSR',shape:'cat',color:'#b8accf',accent:'#807396',description:'Đôi mắt có một bầu trời đêm riêng. Người canh giữ những lối đi giữa các giấc mơ.',skill:'Bước qua màn đêm',perk:'Đài sao +25%'},
  {id:'lotusseal',name:'Hải Cẩu Lá Sen',element:'water',rarity:'SR',shape:'seal',color:'#b5d9bf',accent:'#dfb1be',source:'breeding',description:'Sinh ra từ lời thì thầm của rừng và biển. Luôn đội một chiếc lá sen để che mưa cho bạn.',skill:'Mưa sen',perk:'Vườn quả +18%'},
  {id:'mistfox',name:'Cáo Khói Mây',element:'wind',rarity:'SR',shape:'fox',color:'#e6c9b4',accent:'#93b8b0',source:'breeding',description:'Gió ôm một đốm lửa và hóa thành chiếc đuôi mềm. Khi vui, bạn ấy thổi ra những đám mây ấm.',skill:'Gió than hồng',perk:'Khám phá +10% gỗ'},
  {id:'nebularabbit',name:'Thỏ Tinh Vân',element:'light',rarity:'SR',shape:'rabbit',color:'#cfc2e6',accent:'#d9bf7d',source:'breeding',description:'Nơi ánh sáng gặp giấc mơ, một vì sao bé xíu mở mắt. Đôi tai giữ cả một vệt ngân hà.',skill:'Giấc mơ sao',perk:'Đài sao +18%'},
  ...NEW_SPECIES
];
export const BY_ID = Object.fromEntries(SPECIES.map(s=>[s.id,s]));
export const GACHA_SPECIES = SPECIES.filter(s=>s.source!=='breeding');
// Shiny variants are cosmetic collection goals layered over the regular species.
// Keeping them as variants lets old saves, teams and combat snapshots remain valid.
export const SHINY_VARIANTS = {
  mossfox:{name:'Cáo Mầm Hào Quang',color:'#e8cd9b',accent:'#bc702e',iris:'#b56e29',glow:'#f4d67e',tag:'Lá vàng thức giấc',story:'Chiếc đuôi xòe thành lá thu. Mỗi khi vui, một hạt nắng bé xíu bay khỏi chóp tai.'},
  axolotl:{name:'Kỳ Nhông Cực Quang',color:'#b1d4f2',accent:'#9863bd',iris:'#8754bf',glow:'#a0ecf3',tag:'Sương cực quang',story:'Mang pha lê trên mang và một dải cực quang dọc đuôi. Những bong bóng giữ lại ánh sáng của biển đêm.'},
  blossomdeer:{name:'Hươu Hoa Đào Ngân Hà',color:'#e2b0dc',accent:'#7652a7',iris:'#ab65c4',glow:'#f5cced',tag:'Cánh hoa sao rơi',story:'Đôi cánh kết bằng cánh hoa tím. Những chòm sao trên lưng sáng lên mỗi khi bạn ấy bước qua vườn đào.'},
  forestking:{name:'Hươu Thần Mùa Vàng',color:'#346c65',accent:'#e6b94f',iris:'#eab744',glow:'#ffe4a2',tag:'Mùa xuân bất tận',story:'Cặp sừng nâng cả một tán lá vàng. Hạt giống lơ lửng quanh vương miện sẽ nở thành rừng khi chạm đất.'},
  oceandragon:{name:'Long Vương Biển Sao',color:'#5171b2',accent:'#d1b6ee',iris:'#65d7e9',glow:'#a5f0f6',tag:'Thủy triều ngân hà',story:'Vây biến thành những cánh buồm tinh tú. Một dòng ngân hà chảy qua đôi cánh, kéo theo ngọc trai và sao biển.'},
  eclipsecat:{name:'Miêu Nhật Thực Tinh Vân',color:'#565180',accent:'#d9a951',iris:'#f0bb56',glow:'#e8c9ff',tag:'Bầu trời thức tỉnh',story:'Ba chiếc đuôi ôm lấy vành trăng khuyết. Mặt nạ vàng và những dải lụa sao giữ giấc mơ an lành cho cả đảo.'}
};
export const SHINY_SPECIES = Object.keys(SHINY_VARIANTS).map(id=>BY_ID[id]).filter(Boolean);
export const SHINY_RATE = .012;
export const SHINY_PITY_MAX = 60;
export const BUILDINGS = [
  {id:'garden',name:'Vườn quả mọng',description:'Quả ngọt cho những chiếc bụng đói.',resource:'food',amount:12,interval:60,wood:20,gold:100,unlock:1,icon:'berry',max:10},
  {id:'lodge',name:'Nhà cây',description:'Một mái nhà ấm, một hòn đảo thịnh vượng.',resource:'gold',amount:24,interval:60,wood:30,gold:150,unlock:1,icon:'home',max:10},
  {id:'sawmill',name:'Xưởng gỗ',description:'Gom cành khô, xây những điều mới.',resource:'wood',amount:7,interval:90,wood:35,gold:250,unlock:2,icon:'wood',max:10},
  {id:'observatory',name:'Đài ngắm sao',description:'Nhặt những mảnh sao rơi giữa đêm.',resource:'crystals',amount:2,interval:300,wood:80,gold:600,unlock:3,icon:'star',max:10},
  {id:'sanctuary',name:'Đền cộng hưởng',description:'Nơi tình bạn biến thành phép màu.',resource:'essence',amount:1,interval:600,wood:160,gold:1800,unlock:5,icon:'gem',max:5}
];
export const BIOMES = [
  {id:'forest',name:'Rừng Thì Thầm',subtitle:'Lắng nghe câu chuyện của những tán lá',element:'leaf',color:'#a3bba0',unlock:1,power:42,stages:4,rewards:{gold:95,wood:18,food:20,crystals:5},boss:'Cổ Thụ Ngái Ngủ',icon:'tree'},
  {id:'reef',name:'Vịnh Ngọc Lam',subtitle:'Bên dưới làn nước, một bí mật đang chờ',element:'water',color:'#89bbbf',unlock:2,power:85,stages:5,rewards:{gold:150,wood:22,food:30,crystals:10},boss:'Cua San Hô Khổng Lồ',icon:'waves'},
  {id:'volcano',name:'Đồi Than Hồng',subtitle:'Những ngọn lửa cũng cần một người bạn',element:'fire',color:'#c6a08b',unlock:3,power:145,stages:5,rewards:{gold:240,wood:35,food:35,crystals:15},boss:'Rồng Đá Ngủ Quên',icon:'mountain'},
  {id:'clouds',name:'Quần Đảo Trên Mây',subtitle:'Bước lên những con đường chưa ai biết',element:'wind',color:'#b4bdaa',unlock:4,power:220,stages:6,rewards:{gold:340,wood:45,food:50,crystals:20},boss:'Đại Bàng Gió Bắc',icon:'cloud'},
  {id:'moon',name:'Hồ Trăng Lặng',subtitle:'Gặp những giấc mơ chưa từng được kể',element:'shadow',color:'#afa3c1',unlock:6,power:350,stages:6,rewards:{gold:500,wood:55,food:65,crystals:30},boss:'Vệ Thần Mộng Mị',icon:'moon'},
  {id:'sun',name:'Thánh Địa Bình Minh',subtitle:'Nơi ánh sáng đầu tiên trở về',element:'light',color:'#c9b88f',unlock:8,power:520,stages:7,rewards:{gold:700,wood:70,food:80,crystals:40},boss:'Thần Hộ Đảo',icon:'sun'}
];
export const QUESTS = [
  {id:'first-hatch',title:'Một người bạn mới',description:'Ấp 1 quả trứng linh thú',metric:'hatches',target:1,reward:{gold:100,food:25},xp:20},
  {id:'feed-five',title:'Bữa ăn đầy yêu thương',description:'Cho linh thú ăn 5 lần',metric:'feeds',target:5,reward:{tickets:2,food:40},xp:35},
  {id:'journey-one',title:'Bước chân đầu tiên',description:'Hoàn thành 1 chuyến thám hiểm',metric:'expeditions',target:1,reward:{tickets:3,gold:200},xp:60},
  {id:'build-three',title:'Ngôi nhà trong mơ',description:'Xây hoặc nâng cấp 3 công trình',metric:'builds',target:3,reward:{wood:60,crystals:100},xp:60},
  {id:'friends-eight',title:'Đảo đông vui rồi!',description:'Sưu tầm 8 loài linh thú',metric:'species',target:8,reward:{tickets:5,essence:8},xp:80},
  {id:'hatch-twenty',title:'Người ấp giấc mơ',description:'Ấp 20 quả trứng',metric:'hatches',target:20,reward:{tickets:5,crystals:200},xp:100},
  {id:'explorer',title:'Chân trời rộng mở',description:'Hoàn thành 10 chuyến thám hiểm',metric:'expeditions',target:10,reward:{tickets:8,essence:15},xp:150},
  {id:'evolve',title:'Phép màu trưởng thành',description:'Tiến hóa 1 linh thú',metric:'evolutions',target:1,reward:{tickets:5,crystals:150},xp:100},
  {id:'collector',title:'Nhà sưu tầm của đảo',description:'Sưu tầm 18 loài linh thú',metric:'species',target:18,reward:{tickets:15,essence:30},xp:250},
  {id:'hatch-hundred',title:'Trăm điều kỳ diệu',description:'Ấp 100 quả trứng',metric:'hatches',target:100,reward:{tickets:20,crystals:500},xp:300},
  {id:'first-breed',title:'Tình bạn nở hoa',description:'Đón 1 linh thú từ vườn lai tạo',metric:'breeds',target:1,reward:{tickets:3,essence:6},xp:60},
  {id:'angler-start',title:'Câu chuyện bên mặt nước',description:'Câu thành công 3 lần',metric:'catches',target:3,reward:{wood:35,food:40},xp:40},
  {id:'water-collector',title:'Sắc màu dưới sóng',description:'Sưu tầm 6 loài thủy sinh',metric:'fishSpecies',target:6,reward:{tickets:6,essence:12},xp:100},
  {id:'friends-thirty',title:'Đảo của ba mươi lời chào',description:'Sưu tầm 30 loài linh thú',metric:'species',target:30,reward:{tickets:10,crystals:200,essence:20},xp:300},
  {id:'friends-fortyfive',title:'Một đại gia đình kỳ diệu',description:'Sưu tầm 45 loài linh thú',metric:'species',target:45,reward:{tickets:15,crystals:300,essence:35},xp:400},
  {id:'friends-everyone',title:'Người giữ muôn tình bạn',description:'Sưu tầm đủ 58 loài linh thú',metric:'species',target:58,reward:{tickets:25,crystals:500,essence:60},xp:600}
];
export const RESOURCES = {
  gold:{name:'Vàng',icon:'coin'},food:{name:'Quả mọng',icon:'berry'},wood:{name:'Gỗ',icon:'wood'},crystals:{name:'Ngọc sao',icon:'gem'},tickets:{name:'Vé ấp',icon:'ticket'},essence:{name:'Tinh hoa',icon:'sparkle'}
};
export const EVENTS = [
  {title:'Một lối đi bí mật',text:'Dưới giàn dây leo có hai con đường. Mùi quả chín thoảng từ một bên, ánh sáng lấp lánh từ bên còn lại.',choices:[{text:'Đi theo mùi quả',icon:'berry',reward:{food:22}},{text:'Tìm ánh lấp lánh',icon:'gem',reward:{crystals:8}}]},
  {title:'Người khách lạc đường',text:'Một chú nấm đang ôm chiếc bản đồ ngược. Có lẽ bạn nên dừng lại giúp một tay?',choices:[{text:'Chia một ít quả mọng',icon:'heart',cost:{food:8},reward:{gold:70,essence:1}},{text:'Dẫn bạn về nhà',icon:'home',reward:{wood:15}}]},
  {title:'Chiếc rương dưới rễ cây',text:'Rương cũ mắc trong rễ cây phát ra tiếng ngân khe khẽ. Bên cạnh là một túi hạt giống.',choices:[{text:'Mở chiếc rương',icon:'chest',reward:{gold:55,crystals:4}},{text:'Gieo những hạt giống',icon:'leaf',reward:{food:25,wood:8}}]},
  {title:'Cơn mưa sao nhỏ',text:'Những đốm sáng rơi xuống khoảng rừng. Linh thú của bạn háo hức chạy theo.',choices:[{text:'Nhặt một mảnh sao',icon:'star',reward:{crystals:12}},{text:'Nghỉ ngơi cùng nhau',icon:'heart',heal:25,reward:{food:12}}]},
  {title:'Cây cầu trong sương',text:'Một cây cầu gỗ dẫn sang đảo nhỏ. Bạn nghe tiếng chuông gió từ phía xa.',choices:[{text:'Băng qua cây cầu',icon:'compass',reward:{wood:18,gold:35}},{text:'Tìm đường ven suối',icon:'drop',heal:15,reward:{crystals:5}}]}
];
