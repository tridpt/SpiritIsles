// Role traits use existing HP, cover and cooldowns; no extra saved status or RNG.
export const ROLE_TRAITS = {
  attack:{name:'Săn mồi',short:'Chiêu +30% khi địch ≤40% HP',text:'Chiêu riêng gây thêm 30% sát thương khi thú thực sự trúng đòn còn tối đa 40% HP. Không áp dụng lên lõi lửa, thiêu đốt hay Hợp lực.',threshold:.4,bonus:.3},
  guard:{name:'Khiêu khích',short:'Hàng trước: hút đòn trong 2 lượt',text:'Dùng chiêu ở hàng trước để hút đòn đơn trong lượt này và lượt sau, giảm thêm 15% đòn chuyển hướng. Xuyên giáp và đánh lan vượt Khiêu khích.'},
  heal:{name:'Dưỡng hộ',short:'50% máu hồi dư chuyển thành khiên',text:'Một nửa lượng hồi máu tức thì còn dư từ chiêu riêng trở thành khiên cho người nhận, tối đa 60% HP. Hồi theo lượt và Hợp lực không tạo khiên dư.',conversion:.5},
  support:{name:'Tiếp sức',short:'Giảm thêm 1 lượt chờ cho một bạn',text:'Chiêu riêng giảm thêm 1 lượt chờ chiêu thường của đồng đội được chọn. Tự chọn ưu tiên bạn đang chờ lâu nhất; không giảm cho chính mình.'}
};
