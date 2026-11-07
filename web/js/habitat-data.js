// A memory belongs to a species, not to a rarity tier or an equipped battle team.
export const HABITAT_MOMENTS = [
  {id:'warm-spring',name:'Hơi ấm từ lòng đất',icon:'flame',decor:['hotspring'],bond:5,pose:'warm',elements:['fire'],text:'Bạn nhỏ sưởi đuôi bên suối ấm, vẽ những vòng khói hình trái tim trên mặt nước.'},
  {id:'ember-blossom',name:'Bông hoa từ tàn than',icon:'sparkle',decor:['lavatree'],near:['hotspring'],bond:15,pose:'bloom',elements:['fire'],text:'Hơi suối chạm những cành đá. Bạn nhỏ thổi một tia lửa, gọi bông hoa hổ phách đầu tiên.'},
  {id:'coral-song',name:'Khúc hát của rạn ngọc',icon:'waves',decor:['coralgarden'],bond:5,pose:'bubbles',elements:['water'],text:'Linh thú chạm vào vườn san hô. Những bong bóng mang tiếng biển trở lại đảo.'},
  {id:'pearl-tide',name:'Ngọc trai gọi thủy triều',icon:'sparkle',decor:['coralgarden'],near:['pearllamp'],bond:15,pose:'bubbles',elements:['water'],text:'Ánh ngọc và san hô hòa nhịp. Bạn nhỏ vẽ một vòng thủy triều quanh khu vườn.'},
  {id:'shade-nap',name:'Giấc ngủ dưới tán cây',icon:'leaf',decor:['sapling','cherry','palm'],bond:0,pose:'nap',text:'Tìm được bóng mát vừa ý, bạn nhỏ khép mắt nghe lá xào xạc.'},
  {id:'swing-play',name:'Chuyến bay xích đu',icon:'wind',decor:['swing'],bond:0,pose:'swing',text:'Một cú đẩy nhẹ, một tiếng cười. Chiếc xích đu biến thành con thuyền trên mây.'},
  {id:'flower-sniff',name:'Chiếc mũi dính phấn hoa',icon:'sprout',decor:['flowers'],bond:0,pose:'sniff',shapes:['fox','cat','wolf','rabbit','hamster','hedgehog','panda','deer','unicorn','kirin','lion','mushroom'],text:'Bạn nhỏ nghiêng đầu ngửi hoa rồi hắt hơi, làm phấn mật bay lấp lánh.'},
  {id:'pond-bubbles',name:'Bong bóng hồ sen',icon:'drop',decor:['pond'],bond:0,pose:'bubbles',elements:['water'],text:'Từng chiếc bong bóng nổi lên mặt hồ. Bạn nhỏ chạm mũi vào bóng lớn nhất.'},
  {id:'bench-rest',name:'Chiếc ghế dành cho bạn',icon:'heart',decor:['bench'],bond:10,pose:'rest',text:'Bạn nhỏ chừa một chỗ trên ghế, rồi tựa vào chiếc lá như đang chờ bạn ngồi cùng.'},
  {id:'lantern-chase',name:'Đuổi theo đom đóm',icon:'sparkle',decor:['lantern'],bond:5,pose:'chase',text:'Một đốm sáng trốn sau đèn, một đôi mắt tò mò đuổi theo. Cả góc đảo rộn ràng.'},
  {id:'stone-sunbath',name:'Viên đá giữ nắng',icon:'sun',decor:['rockery'],bond:5,pose:'sunbath',elements:['fire','light'],text:'Phiến đá đã giữ nắng cả buổi. Bạn nhỏ duỗi mình, ấm đến tận đầu đuôi.'},
  {id:'petal-flight',name:'Mưa cánh hoa',icon:'wind',decor:['cherry'],bond:10,pose:'glide',shapes:['bird','phoenix','dragon','griffin','owl','bat','moth','manta','whale','jelly','koi','peacock'],text:'Một vòng lượn quanh cành anh đào làm cánh hoa xoay thành dải lụa.'},
  {id:'moss-steps',name:'Vũ điệu mầm xanh',icon:'leaf',decor:['stepping'],near:['flowers'],bond:15,pose:'dance',elements:['leaf'],text:'Từ viên đá này sang viên đá khác, bạn nhỏ gọi những hạt mầm hát cùng luống hoa.'},
  {id:'moon-ripples',name:'Mặt hồ đầy sao',icon:'drop',decor:['pond'],near:['lantern'],bond:15,pose:'bubbles',elements:['water'],text:'Ánh đèn chạm mặt hồ, hóa thành những ngôi sao nhỏ trong vòng sóng.'},
  {id:'warm-light',name:'Ngọn đèn ấm áp',icon:'flame',decor:['lantern'],near:['bench'],bond:15,pose:'warm',elements:['fire'],text:'Bạn nhỏ thắp đèn bằng hơi ấm dịu dàng, để chiếc ghế luôn có người muốn ghé.'},
  {id:'wind-cradle',name:'Lời ru của gió',icon:'wind',decor:['swing'],near:['palm'],bond:15,pose:'swing',elements:['wind'],text:'Tán dừa gõ nhịp, xích đu đung đưa. Bạn nhỏ ngân nga một giai điệu mới.'},
  {id:'sun-blossom',name:'Bông hoa đón bình minh',icon:'sun',decor:['flowers'],near:['sapling'],bond:15,pose:'bloom',elements:['light'],text:'Một tia sáng được giấu trong nụ hoa. Khi bạn nhỏ mỉm cười, cả luống hoa bừng lên.'},
  {id:'star-dream',name:'Giấc mơ nấm trăng',icon:'moon',decor:['moonlamp'],near:['bench'],bond:15,pose:'dream',elements:['shadow'],text:'Dưới ánh nấm trăng, chiếc ghế trở thành một chiếc thuyền đưa giấc mơ đi xa.'},
  {id:'guardian-oath',name:'Lời hứa với Thủ vệ',icon:'shield',decor:['guardian'],bond:25,pose:'guard',text:'Bạn nhỏ chạm vào tượng đá, hứa sẽ cùng bạn bảo vệ những ngày bình yên.'},
  {id:'gate-whisper',name:'Lời thì thầm cổng cổ',icon:'compass',decor:['relicgate'],bond:25,pose:'wonder',text:'Cánh cổng đáp lại bằng những ký tự sáng. Bạn nhỏ nhận ra một câu chuyện rất xưa.'},
  {id:'picnic-friends',name:'Buổi hẹn hai người bạn',icon:'heart',decor:['bench'],near:['flowers'],bond:20,buddy:true,pose:'friends',text:'Hai người bạn khác hệ chia nhau một góc ghế. Không ai muốn buổi hẹn kết thúc.'},
  {id:'legend-aurora',name:'Cực quang trên đảo nhỏ',icon:'star',decor:['relicgate'],near:['moonlamp'],bond:40,rarities:['SSR'],pose:'aurora',text:'Cổng cổ và nấm trăng cùng thức giấc. Linh thú huyền thoại vẽ cực quang quanh đảo.'}
];
export const MOMENT_BY_ID=Object.fromEntries(HABITAT_MOMENTS.map(m=>[m.id,m]));
export const HABITAT_MILESTONES=[
  {id:'first-five',target:5,name:'Những thói quen bé xíu',reward:{tickets:1,food:60}},
  {id:'twelve',target:12,name:'Đảo đã có tiếng cười',reward:{tickets:2,crystals:50}},
  {id:'twenty-four',target:24,name:'Người hiểu những bạn nhỏ',reward:{tickets:3,essence:8}},
  {id:'forty-eight',target:48,name:'Một đảo đầy kỷ niệm',reward:{tickets:5,crystals:120}},
  {id:'ninety',target:90,name:'Nhà sưu tầm khoảnh khắc',reward:{tickets:8,essence:20}},
  {id:'one-fifty',target:150,name:'Ngàn điều muốn kể',reward:{tickets:10,crystals:300}}
];
export const momentApplies=(species,m)=>!!species&&!!m&&(!m.elements||m.elements.includes(species.element))&&(!m.shapes||m.shapes.includes(species.shape))&&(!m.rarities||m.rarities.includes(species.rarity));
export const memoryKey=(id,moment)=>`${id}:${moment}`;
export const newHabitat=()=>({version:1,discovered:{},claimed:[]});
