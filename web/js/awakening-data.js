const ultimate=(name,role,power,extra)=>({name,role,power,cost:3,cooldown:0,...extra});
const goal=(metric,target,text,extra={})=>({metric,target,text,...extra});
export const AWAKENING_MATERIALS={
  sigil:{name:'Ấn thủ vệ',icon:'sun',source:'Thắng Săn Thủ Vệ: nhận 1 + bậc boss.'},
  relic:{name:'Mảnh cổ linh',icon:'gem',source:'Vượt tầng boss 5, 10… của Phế Tích Cổ: nhận 2 + số tầng / 5.'}
};
export const AWAKENINGS={
  mossfox:{id:'mossfox',name:'Cáo Linh Đại Ngàn',color:'#cce4b0',accent:'#528d75',iris:'#60bb83',icon:'sprout',story:'Mầm lá đầu tiên vươn thành tán rừng. Tình bạn nhỏ che chở cả hòn đảo.',
    skill:ultimate('Đại ngàn cộng sinh','heal',0,{heal:.28,regen:.1,regenTurns:3,ward:.18,comboHeal:.12}),text:'Hồi 28% sinh lực, tạo 18% khiên và hồi 10% trong 3 lượt tới. Nếu nối chiêu với một bạn khác, hồi thêm 12%.',
    trial:{name:'Lời hứa của mầm xanh',mode:'explore',enemy:'berserker',team:['mossfox','axolotl','emberbird'],power:20,focus:2,goals:[goal('victory',1,'Thắng thử thách'),goal('cast:mossfox',1,'Dùng chiêu Cáo Mầm ít nhất 1 lần'),goal('combos',2,'Nối ít nhất 2 combo')],guide:'Mở bằng chiêu Cáo Mầm, tích năng lượng và đổi người ra chiêu để nối hệ. Địch dưới 40% HP sẽ cuồng nộ.'}},
  axolotl:{id:'axolotl',name:'Kỳ Nhông Thiên Thủy',color:'#c0e8eb',accent:'#7d9bd6',iris:'#61b7dd',icon:'drop',story:'Đôi mang đón lấy dòng thiên hà. Mỗi giọt nước gột rửa giá băng và nỗi mệt mỏi.',
    skill:ultimate('Thiên hà tịnh thủy','heal',0,{heal:.4,ward:.16,gain:1,cleanse:true}),text:'Hồi 40% sinh lực, tạo 16% khiên, làm tan băng khóa năng lượng và nhận lại 1 năng lượng.',
    trial:{name:'Dòng nước không đóng băng',mode:'boss',enemy:'frost',team:['axolotl','emberbird','mossfox'],power:28,focus:2,goals:[goal('victory',1,'Thắng Rồng Băng'),goal('cast:axolotl',1,'Dùng chiêu Kỳ Nhông Mây ít nhất 1 lần'),goal('hpPercent',60,'Kết thúc với ít nhất 60% sinh lực')],guide:'Giữ chiêu hồi phục cho lúc bị thương. Chim Than Hồng ngắt bão; đỡ hoàn hảo cũng chống đóng băng.'}},
  emberbird:{id:'emberbird',name:'Hỏa Điểu Xích Vũ',color:'#f5c48c',accent:'#c96855',iris:'#ebad49',icon:'flame',story:'Đốm than ấm hóa thành đôi cánh đỏ. Ngọn lửa được giữ gìn nay đủ sức rọi sáng đêm dài.',
    skill:ultimate('Xích vũ bùng cháy','attack',2.8,{burn:.65,burnTurns:3,detonate:true}),text:'Gây 280% đòn thường, kích nổ toàn bộ thiêu đốt còn lại rồi áp thiêu đốt mới bằng 65% đòn thường trong 3 lượt.',
    trial:{name:'Ngọn lửa xuyên vỏ thép',mode:'explore',enemy:'armored',team:['emberbird','axolotl','cottonbun'],power:20,focus:2,goals:[goal('victory',1,'Thắng quái giáp'),goal('cast:emberbird',2,'Dùng chiêu Chim Than Hồng 2 lần'),goal('armorPierces',1,'Vượt giáp phản kích ít nhất 1 lần')],guide:'Chiêu công kích hoàn hảo vượt giáp. Dùng Kỳ Nhông để hồi phục và nối Hơi nước; đừng hạ địch trước lần ra chiêu thứ hai.'}},
  sunfox:{id:'sunfox',name:'Cửu Vĩ Thái Dương',color:'#fff0cb',accent:'#d49a58',iris:'#efba49',icon:'sun',story:'Chín tia nắng gặp nhau thành vầng thái dương. Mỗi chiếc đuôi giữ lời hẹn của một người bạn.',
    skill:ultimate('Cửu nhật liên hoàn','attack',4.1,{pierce:true,comboPower:.55}),text:'Gây 410% đòn thường và xuyên khiên. Khi nối chiêu với một bạn khác, hệ số tăng thêm 55% đòn thường trước các thưởng combo.',
    trial:{name:'Chín vầng sáng phản kích',mode:'boss',enemy:'treant',team:['sunfox','axolotl','emberbird'],power:20,focus:0,goals:[goal('victory',1,'Thắng Cổ Mộc Gai'),goal('cast:sunfox',1,'Dùng chiêu Cửu Vĩ ít nhất 1 lần'),goal('parries',1,'Đỡ hoàn hảo ít nhất 1 đòn địch')],guide:'Đỡ đòn đang tới để mở phản kích. Dùng năng lượng đúng lúc, phối Hỏa/Thủy để xuyên vỏ cây.'}},
  phoenix:{id:'phoenix',name:'Phượng Hoàng Thiên Dương',color:'#ffe2a7',accent:'#d57970',iris:'#ecb84f',icon:'flame',story:'Đôi cánh mang sắc trời đầu tiên. Từ tàn tro, ánh bình minh nâng những người bạn đứng dậy.',
    skill:ultimate('Bình minh bất diệt','attack',2.8,{heal:.25,rescue:.25,burn:.45,burnTurns:3}),text:'Gây 280% đòn thường, hồi 25% sinh lực và thiêu đốt 45% trong 3 lượt. Khi ra chiêu ở 40% sinh lực trở xuống, hồi thêm 25%.',
    trial:{name:'Bình minh giữa bão tuyết',mode:'boss',enemy:'frost',team:['phoenix','mossfox','cottonbun'],power:22,focus:1,goals:[goal('victory',1,'Thắng Rồng Băng'),goal('cast:phoenix',1,'Dùng chiêu Phượng Bình Minh ít nhất 1 lần'),goal('interrupts',1,'Ngắt ít nhất 1 cơn bão tuyết')],guide:'Bão đến sau lượt Tụ sương. Để dành chiêu Phượng hoặc Hợp lực để ngắt bão và giữ năng lượng.'}},
  voiddragon:{id:'voiddragon',name:'Long Đế Tinh Uyên',color:'#bbb6e2',accent:'#68679e',iris:'#9ddff1',icon:'moon',story:'Tinh tú khép thành đôi cánh, bóng đêm hóa thành vương miện. Một nhịp vỗ làm lặng cả hư không.',
    skill:ultimate('Phán quyết hư không','attack',3.4,{pierce:true,breakShield:true,weaken:.45,weakenTurns:3,disrupt:true}),text:'Gây 340% đòn thường, phá và xuyên khiên, ngắt tụ phép/bão tuyết dù không đúng nhịp, giảm 45% đòn địch trong 3 lượt.',
    trial:{name:'Lặng yên sau lõi lửa',mode:'boss',enemy:'phoenix',team:['voiddragon','axolotl','emberbird'],power:24,focus:1,goals:[goal('victory',1,'Thắng Phượng Hoàng'),goal('cast:voiddragon',1,'Dùng chiêu Long Hư Không ít nhất 1 lần'),goal('coreBreakTurn',10,'Phá lõi lửa trước khi hết lượt 10',{max:true,positive:true})],guide:'Đánh thân đến khi lõi lộ. Chọn Lõi lửa trong sàn đấu rồi dồn chiêu xuyên khiên để chặn tái sinh.'}}
};
export const AWAKENING_IDS=Object.keys(AWAKENINGS);
export const awakeningRewardText=materials=>Object.entries(materials||{}).map(([k,n])=>`+${n} ${AWAKENING_MATERIALS[k].name}`).join(' · ');
export const AWAKENING_TRIALS=Object.fromEntries(AWAKENING_IDS.map(id=>[id,{id,...AWAKENINGS[id].trial,species:id,text:AWAKENINGS[id].story}]));
export const awakeningCost=id=>AWAKENING_IDS.includes(id)?{gold:['mossfox','axolotl','emberbird'].includes(id)?1800:3000,essence:['mossfox','axolotl','emberbird'].includes(id)?16:24,sigil:['mossfox','axolotl','emberbird'].includes(id)?6:10,relic:['mossfox','axolotl','emberbird'].includes(id)?9:15}:null;
export function awakenedOf(source,id){const holder=Array.isArray(source)?source.find(m=>m.id===id):source?.pets?source.pets.find(p=>p.id===id):source;return holder?.id===id&&holder.awakened===true&&Object.hasOwn(AWAKENINGS,id);}
export function awakeningGate(state,id){const p=state.pets.find(p=>p.id===id);return !Object.hasOwn(AWAKENINGS,id)?'Linh thú này chưa có dạng thức tỉnh.':!p?'Kết bạn với linh thú này trước nhé.':p.level<30||p.stars<3?'Cần linh thú cấp 30 và tiến hóa 3 sao.':'';}
export function grantAwakeningMaterials(state,kind,rank){
  if(!state.awakening)return {};
  const reward=kind==='boss'?{sigil:1+rank}:kind==='ruins'&&rank%5===0?{relic:2+rank/5}:{};
  for(const [key,n]of Object.entries(reward))state.awakening.materials[key]=Math.min(99999999,state.awakening.materials[key]+n);
  return reward;
}
