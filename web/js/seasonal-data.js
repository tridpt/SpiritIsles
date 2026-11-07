// The seasonal festival is intentionally data driven so a future return can
// reuse the same page with a different set of missions and rewards.
export const SEASON_KEY = 'starlit-festival';
export const SEASON_DURATION = 30 * 24 * 60 * 60 * 1000;
export const SEASON_DAYS = 30;

export const SEASON_MISSIONS = [
  { id:'hatch', title:'Những quả trứng ước nguyện', description:'Ấp trứng trong mùa', metric:'hatches', targets:[4,10,18,28], reward:50, icon:'egg', page:'hatch' },
  { id:'feed', title:'Bữa tiệc bên đom đóm', description:'Cho các bạn nhỏ ăn trong mùa', metric:'feeds', targets:[8,20,36,56], reward:55, icon:'berry', page:'pets' },
  { id:'explore', title:'Gửi lời chào chân trời', description:'Thắng chuyến thám hiểm trong mùa', metric:'expeditions', targets:[1,3,6,10], reward:80, icon:'compass', page:'explore' },
  { id:'fish', title:'Món quà từ mặt nước', description:'Câu cá thành công trong mùa', metric:'catches', targets:[3,7,12,18], reward:45, icon:'fish', page:'fishing' },
  { id:'campaign', title:'Viết tiếp câu chuyện', description:'Thắng ải chiến dịch trong mùa · chơi lại cũng tính', metric:'campaignWins', targets:[2,5,9,14], reward:75, icon:'map', page:'campaign' },
  { id:'memories', title:'Khoảnh khắc thân quen', description:'Có kỷ niệm trong Sổ khoảnh khắc · tính cả đã có', metric:'memories', targets:[2,4,7,10], reward:60, icon:'heart', page:'habitat' },
  { id:'stars', title:'Bản đồ những vì sao', description:'Có sao chiến dịch · tính cả đã có', metric:'campaignStars', targets:[3,9,18,24], reward:65, icon:'star', page:'campaign' },
  { id:'tower', title:'Bước chân giữa trời đêm', description:'Thắng thủ vệ tháp trong mùa · mỗi 5 tầng', metric:'towerBosses', targets:[1,2,3,4], reward:90, icon:'trophy', page:'tower' }
];

export const SEASON_MILESTONES = [
  { id:'dawn', threshold:100, title:'Đốm sáng đầu tiên', description:'Một lời chúc nhỏ cho đảo', reward:{tickets:2,food:35} },
  { id:'moon', threshold:300, title:'Mảnh trăng trong túi', description:'Ánh sáng đủ soi đường về', reward:{crystals:160,gold:220} },
  { id:'comet', threshold:600, title:'Đuôi sao chổi', description:'Năng lượng cho những chuyến đi xa', reward:{essence:12,tickets:2}, fragments:5 },
  { id:'arch', threshold:1000, title:'Cổng Sao Rơi', description:'Mở một góc lễ hội để đặt trên đảo', reward:{gold:600,essence:18}, decoration:'starlitlantern' },
  { id:'aurora', threshold:1500, title:'Cực quang thức giấc', description:'Đảo Bình Yên bừng lên sắc mới', reward:{crystals:280,tickets:4}, fragments:10 }
];

export const SEASON_SHOP = [
  { id:'food', title:'Giỏ quả ngọt', description:'Đủ cho một buổi chăm sóc', cost:40, reward:{food:120}, icon:'berry' },
  { id:'tickets', title:'Vé ấp lấp lánh', description:'Mở thêm một cơ hội gặp bạn mới', cost:90, reward:{tickets:1}, icon:'ticket' },
  { id:'crystals', title:'Túi ngọc sao', description:'Ánh sáng dành cho trứng hiếm', cost:150, reward:{crystals:120}, icon:'gem' },
  { id:'essence', title:'Tinh hoa lễ hội', description:'Nâng cấp một hình hài', cost:220, reward:{essence:6}, icon:'sparkle' },
  { id:'gold', title:'Hòm vàng đêm hội', description:'Góp thêm vào những công trình', cost:120, reward:{gold:500}, icon:'coin' },
  { id:'lantern', title:'Cổng Sao Rơi', description:'Mở trang trí sớm · cũng nhận được ở mốc 1.000 sao', cost:360, reward:{}, decoration:'starlitlantern', icon:'star' }
];

export const SEASON_CHALLENGES = [
  { id:'story', title:'Chòm sao của câu chuyện', text:'Thu thập 12 sao chiến dịch. Tính cả những sao đã có.', metric:'campaignStars', target:12, reward:120, page:'campaign', icon:'map', species:'stardeer' },
  { id:'tower', title:'Thắp đèn trên tầng mây', text:'Đạt kỷ lục tầng 10 Tháp Vô Tận. Kỷ lục cũ vẫn được ghi nhận.', metric:'towerBest', target:10, reward:120, page:'tower', icon:'trophy', species:'nebularabbit' },
  { id:'memories', title:'Bạn nhỏ có điều muốn kể', text:'Ghi 8 kỷ niệm vào Sổ khoảnh khắc. Tính cả kỷ niệm đã có.', metric:'memories', target:8, reward:120, page:'habitat', icon:'heart', species:'mossfox' }
];

export const seasonMission = id => SEASON_MISSIONS.find(m => m.id === id) || null;
export const seasonMilestone = id => SEASON_MILESTONES.find(m => m.id === id) || null;
export const seasonShopItem = id => SEASON_SHOP.find(m => m.id === id) || null;
