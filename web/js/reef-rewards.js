import {icon} from './art.js';
// Unlocks derive from completed trips, so repeated results cannot grant duplicates.
export function reefRewardEntry(state){
  const clears=state.clears.reef||0;
  return `<section class="reef-reward-entry" aria-label="Bộ sưu tập Vịnh Ngọc Lam"><span>${icon('waves',27)}</span><div><small>KỶ VẬT VÙNG BIỂN · ${clears} CHUYẾN THẮNG</small><h3>Mang một góc biển về đảo</h3><p>${clears>=1?'✓':'1 chuyến ·'} Vườn San Hô · ${clears>=3?'✓':'3 chuyến ·'} Đèn Ngọc Trai & vòng Ngọc Triều cho thú hệ Thủy · ${clears>=5?'✓':'5 chuyến ·'} Tượng Cua San Hô.</p><small>Đặt kỷ vật trong Trang trí đảo. Ghé vườn san hô cùng thú Thủy để khám phá khoảnh khắc mới.</small></div></section>`;
}
