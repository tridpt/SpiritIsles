import {icon} from './art.js';
export function volcanoRewardEntry(state){
  const clears=state.clears.volcano||0;
  return `<section class="reef-reward-entry volcano-reward-entry" aria-label="Bộ sưu tập Đồi Than Hồng"><span>${icon('flame',27)}</span><div><small>KỶ VẬT NÚI LỬA · ${clears} CHUYẾN THẮNG</small><h3>Mang hơi ấm về đảo</h3><p>${clears>=1?'✓':'1 chuyến ·'} Suối Ấm · ${clears>=3?'✓':'3 chuyến ·'} Cây Dung Nham & diện mạo Than Hồng cho thú hệ Lửa · ${clears>=5?'✓':'5 chuyến ·'} Tượng Rồng Đá.</p><small>Đặt kỷ vật trong Trang trí đảo. Dẫn thú Lửa tới suối ấm và cây dung nham để khám phá khoảnh khắc mới.</small></div></section>`;
}
