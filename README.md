# Đảo Linh Thú · Spirit Isles 1.31.0



Game sưu tầm linh thú và phát triển đảo dành cho Android. Toàn bộ giao diện, hình vẽ, font chữ và luật chơi nằm trong ứng dụng; chơi offline và không có giao dịch tiền thật.



## Cài trên điện thoại



1. Chép `dist/DaoLinhThu-1.31.0.apk` sang điện thoại Android 8.0 trở lên.

2. Mở tệp APK và làm theo hướng dẫn cài đặt của Android. Đây là bản cài trực tiếp, chưa đưa lên Google Play.

3. Mở **Đảo Linh Thú**. Bạn bắt đầu với 3 linh thú, 10 vé ấp và tài nguyên xây đảo.



Nếu đã cài bản 1.0.0–1.30.0, cài đè bản 1.31.0 để giữ tiến trình. Bản lưu cũ tự bổ sung dữ liệu mới; thú, tài nguyên, bảo hiểm gacha và chuyến thám hiểm đang chơi được giữ nguyên. Có thể xuất bản lưu trong Menu → Cài đặt trước khi cập nhật.



Bản 1.1.1 sửa lỗi dấu tiếng Việt bị tách ở tiêu đề. Font Lora thường và nghiêng hỗ trợ đầy đủ tiếng Việt được đóng gói cùng game, dùng chung trên trình duyệt và Android, kể cả khi offline. Tiêu đề có khoảng cách dòng rộng hơn để dấu không chạm dòng bên cạnh.



Ứng dụng dùng Android System WebView để hiển thị game. Thiết bị cần WebView còn được cập nhật. APK hiện được ký bằng khóa debug trên máy phát triển; phát hành chính thức cần khóa ký release được giữ ổn định qua các bản cập nhật.



## Bạn bè trên đảo · 1.31.0

Chạm một linh thú → **Rủ bạn picnic**. Đặt **Ghế nghỉ lá** gần **Luống hoa mật** (tối đa 2 ô); bạn chủ cần 20 gắn bó và một bạn khác hệ trong đội đang hiện trên đảo cần ít nhất 10 gắn bó. Khung chăm sóc giải thích điều kiện còn thiếu hoặc góc quá chật. **Đến góc chơi** và các hành vi một thú vẫn dùng như trước.

- **Hai bạn thật sự cùng chơi:** tự chọn một bạn phù hợp trên đảo, lần lượt đi quanh nhãn/nút và các thú khác tới góc picnic, đứng chờ nhau rồi chia quả mọng, cúi đầu đáp lại và cười. Khăn và giỏ picnic nằm trong cảnh đảo; thẻ máy ảnh tránh che cả hai thú và lời thoại. Khi bật chuyển động, góc picnic mới được ưu tiên trong các lượt tự tìm đồ.
- **Ghi đúng người bạn:** quan sát 2,4 giây sau khi cả hai tới nơi rồi chạm máy ảnh. Kỷ niệm lưu đúng bạn đi cùng; xem lại trong sổ giữ người bạn đã ghi dù thứ tự bộ sưu tập khác. Mỗi loài/hành vi vẫn chỉ cộng tối đa +2 gắn bó cho bạn chủ một lần; người đi cùng không tạo phần thưởng mới.
- **Chơi theo nhịp của bạn:** Menu/ẩn ứng dụng tạm dừng cả đường đi và quan sát. Chạm chăm sóc một trong hai, chỉnh đảo, thay đội hoặc đổi kích thước màn hình kết thúc cảnh cũ. Tắt chuyển động vẫn có thể rủ picnic chủ động, đứng sẵn ở hai chỗ trống và ghi kỷ niệm với tư thế tĩnh.
- **Offline và cài đè:** dùng cấu trúc kỷ niệm sẵn có, giữ tài nguyên, đội hình, kỷ niệm cũ và chuyến đang dở. Người bạn ngoài đội vẫn có thể tham gia cảnh cận qua Sổ Kỷ Niệm.

Kiểm tra luật chơi **524/524 bài đạt**. **56 tình huống trình duyệt liên quan đã xác nhận**, gồm 44 tình huống cũ và 12 tình huống picnic. Lượt đầu bài kiểm tra thứ tự đường đi lấy mẫu 240 ms có thể bỏ lỡ đoạn đi ngắn; sau khi cố định đồng hồ và lấy mẫu 40 ms, cả 12 bài picnic đạt, không bỏ qua hay tự động chạy lại. Rà 17 ảnh tại 320×640, 390×844, 390×784, 768×1024 và 1440×1000: hai thú, camera và nút chăm sóc chạm được. Android lint **0 lỗi, 4 cảnh báo cũ**; **141 tệp web** trong APK khớp nguồn từng byte và giữ khóa ký cài đè.

Trên giả lập riêng **SpiritIslesAudit110**, cài đè offline **1.30.0 → 1.31.0** giữ toàn bộ bản lưu. Đã thử chạm cả hai thú, picnic tự động/chủ động, chỉ ghi khi bấm, lưu đúng bạn, Back đóng menu/chăm sóc, Home tạm dừng quan sát, resume giữ cả hai tư thế, đóng cưỡng bức/mở lại, giảm chuyển động và xem lại đúng người bạn. SHA-256 APK đã cài khớp gói giao; không có lỗi JavaScript. Báo cáo: `dist/ENGINE-1.31.0.tap`, `dist/BROWSER-1.31.0.json`, `dist/ISLAND-FRIENDS-FINAL-1.31.0.json`, `dist/ISLAND-FRIENDS-VISUAL-1.31.0.json`, `dist/ANDROID-ISLAND-FRIENDS-1.31.0.json`, `dist/BUNDLE-CHECK-1.31.0.json`, `dist/SOURCE-CHECK-1.31.0.json`, `dist/BUILD-INFO-1.31.0.json`.

APK: `dist/DaoLinhThu-1.31.0.apk`. Mã nguồn: `dist/source-1.31.0.zip`. Các bản phát hành cũ được giữ nguyên. Chưa thử trên điện thoại thật.

## Đảo sống · 1.30.0

Linh thú trong đội đang hiện trên đảo tự tìm đồ trang trí đã lưu để chơi: ngủ dưới cây, ngửi hoa, đuổi đom đóm, thổi bong bóng bên hồ, đung đưa bên xích đu hoặc khám phá góc báu vật. Mỗi lần một bạn dẫn hoạt động; lần lượt chọn bạn có góc chơi đi tới được và ưu tiên kỷ niệm chưa ghi. Thay thú trong đội để thấy những hành vi khác.

- **Đi tới đúng món đồ:** hành vi dựa trên loài/hệ, gắn bó, đồ đã đặt và các tổ hợp gần nhau. Điểm đến tính theo vị trí/xoay hiện tại; thú tìm đường quanh nhãn và nút game, tránh đứng đè lên nhau. Góc quá chật được bỏ qua; dời đồ bằng Chỉnh đảo để mở lối. Chuyển động chỉ là trạng thái trong cảnh, không tự tiêu thức ăn hay cấp thưởng.
- **Bắt gặp rồi ghi lại:** sau 2,4 giây quan sát khi game đang mở, nút máy ảnh sáng. Chạm để ghi vào Sổ Kỷ Niệm và nhận tối đa +2 gắn bó một lần cho mỗi cặp loài/hành vi. Nút ghi lại thu gọn thành biểu tượng 44×44 px khi màn hình chật; xem lại kỷ niệm cũ mở đúng trang trong sổ và không thưởng lặp. Mốc sưu tầm và lễ hội tiếp tục dùng chung dữ liệu kỷ niệm.
- **Chủ động rủ chơi:** chạm thú → **Đến góc chơi** để bắt đầu ngay. Khi tắt chuyển động hoặc thiết bị yêu cầu giảm chuyển động, thú đứng sẵn cạnh đồ phù hợp và giữ tư thế tĩnh; vẫn quan sát và ghi bình thường. Nút **Sổ Kỷ Niệm** trong khung chăm sóc mở các hành vi, điều kiện và cảnh cận có sẵn.
- **Giữ nhịp chơi:** mở Menu, chăm sóc hoặc chuyển ứng dụng tạm dừng hoạt động/quan sát. Mở lại giữ tiến độ quan sát và tư thế. Chăm sóc trực tiếp, thay kích thước màn hình hoặc sửa vị trí đồ kết thúc lượt cũ, không tự ghi. Hành vi hai thú vẫn chơi trong cảnh cận của sổ.
- **Offline và bản lưu:** dùng đồ trên đảo và luật ghi kỷ niệm hiện tại; không thêm trường save. Cài đè giữ linh thú, tài nguyên, kỷ niệm cũ, đội hình và trận/chuyến đang dở.

Kiểm tra luật chơi **520/520 bài đạt**. **44/44 tình huống trình duyệt liên quan đạt**, gồm 15 bài mới về tự tìm đồ, đường đi, ghi một lần, replay, đồ đã lưu/xóa, giảm chuyển động, Menu/ẩn ứng dụng, offline và màn hình 320/390/768/1440 px. Sau chỉnh cuối chạy lại 14 bài mới và đạt 14/14, không bỏ qua hoặc tự động thử lại. Các fixture tháp đã dùng cùng một đồng hồ cố định khi tạo/lưu, để bộ kiểm tra không phụ thuộc ngày chạy. Rà 15 ảnh giao diện, nút máy ảnh chạm được và các phím tắt không bị che.

Android lint **0 lỗi, 4 cảnh báo cũ**; **141 tệp web** trong APK khớp nguồn từng byte và giữ khóa ký cài đè. **Chưa thử trên điện thoại thật.**

APK: `dist/DaoLinhThu-1.30.0.apk`. Mã nguồn: `dist/source-1.30.0.zip`. Các bản phát hành cũ được giữ nguyên. Báo cáo: `dist/ENGINE-1.30.0.tap`, `dist/BROWSER-1.30.0.json`, `dist/LIVING-ISLAND-FINAL-1.30.0.json`, `dist/LIVING-ISLAND-VISUAL-1.30.0.json`, `dist/BUNDLE-CHECK-1.30.0.json`.

## Sổ Kỷ Niệm & Hành vi hôm nay · 1.29.0

Vào **Menu → Kỷ niệm**, hoặc chạm **Hành vi hôm nay** ngay trong cảnh đảo. Sổ giữ các hành vi theo từng linh thú: cây, hồ sen, xích đu, ghế và những góc trang trí đặc biệt mở ra cách chơi riêng. Kỷ niệm và phần thưởng cũ được giữ nguyên.

- **Gợi ý phù hợp với bộ sưu tập:** chỉ chọn thú bạn đang sở hữu, kể cả bạn không trong đội chiến đấu. Ưu tiên hành vi chưa ghi nhận đã đủ điều kiện; nếu chưa có, gợi ý hành vi còn ít điều kiện nhất và chỉ rõ đồ cần đặt, vị trí gần nhau, gắn bó hoặc bạn khác hệ còn thiếu.
- **Mỗi ngày một gợi ý:** lựa chọn theo ngày trên thiết bị, ổn định khi tải lại/offline. Ghi xong chuyển ngay sang hành vi mới; qua nửa đêm cũng cập nhật. Mọi hành vi khác vẫn có thể khám phá bất cứ lúc nào, không phải chờ ngày được gợi ý.
- **Đến đúng trang:** chạm gợi ý chọn đúng linh thú, cuộn tới hành vi và đánh dấu thẻ điều kiện. Trong sổ có nút Rủ chơi trực tiếp cho gợi ý đã sẵn sàng. Chấm báo ở menu sáng khi có hành vi mới đủ điều kiện.
- **Kỷ niệm có ý nghĩa:** quan sát một lúc rồi Ghi kỷ niệm để nhận tối đa +2 gắn bó, đúng một lần cho mỗi cặp loài/hành vi. Sáu mốc 5/12/24/48/90/150 kỷ niệm tặng vé, ngọc và tài nguyên; xem lại không cấp thưởng lặp.
- **Thêm thú, thêm câu chuyện:** ghi đủ các trang thú đang có sẽ hiện lời mời ghé vườn ấp; khi sở hữu bạn mới, gợi ý mở lại. Không cần trường lưu mới, kết nối mạng hoặc đặt lại tiến trình.
- **Nút trong cảnh game:** gợi ý nằm cạnh Chỉnh đảo, phía trên nhiệm vụ và kho tài nguyên, giữ khoảng cách giữa các nút ở 320×640 trở lên. Vùng trống quanh cụm nút không chặn phím tắt bên cạnh.

Kiểm tra luật chơi **514/514 bài đạt**, gồm sáu bài mới cho gợi ý hằng ngày. **290 tình huống trình duyệt đã được xác nhận**: lượt toàn bộ đạt 287, ba ca phát hiện vùng trống chặn phím tắt ở 320 px; sau khi sửa, chạy lại 19 ca liên quan và đạt 19/19, không bỏ qua hoặc tự động thử lại. Có bảy ca mới cho gợi ý, đổi ngày, điều kiện, hoàn tất bộ sưu tập và offline. Kiểm tra riêng xác nhận vuốt ve từ 9 lên 10 gắn bó làm sáng gợi ý ngay. Rà 16 cảnh ở 320×640, 390×844, 768×1024 và 1440×1000.

Android lint **0 lỗi, 4 cảnh báo cũ**; cả 140 tệp web trong APK khớp nguồn từng byte, cùng khóa ký với 1.28.0. Cài đè offline **1.28.0 → 1.29.0** trên giả lập riêng SpiritIslesAudit110 giữ bản lưu cũ. Chỉ dùng trình duyệt kiểm thử và bản lưu giả lập riêng. **Chưa thử trên điện thoại thật.** Báo cáo: `dist/ENGINE-1.29.0.tap`, `dist/BROWSER-VALIDATED-1.29.0.json`, `dist/BROWSER-FOLLOWUP-1.29.0.json`, `dist/DAILY-BOND-1.29.0.json`, `dist/DAILY-HABITAT-VISUAL-1.29.0.json`, `dist/ANDROID-DAILY-HABITAT-1.29.0.json`, `dist/BUNDLE-CHECK-1.29.0.json`, `dist/SOURCE-CHECK-1.29.0.json`, `dist/BUILD-INFO-1.29.0.json`.

APK: `dist/DaoLinhThu-1.29.0.apk`. Mã nguồn: `dist/source-1.29.0.zip`. Cài đè để giữ tiến trình; các artifact 1.28.0 được giữ riêng.

## Lễ Hội Sao Rơi · 1.28.0

Vào **Menu → Lễ Hội Sao Rơi**. Một mùa cá nhân kéo dài **30 ngày**, bắt đầu khi cập nhật hoặc tạo đảo mới. Lễ hội chơi offline, không cần đăng nhập liên tiếp. Cảnh đêm với đèn sao, linh thú ghé hội và ba khu **Hành trình / Mốc quà / Tiệm lễ hội** dùng hình vẽ được đóng gói sẵn.

- **4 chặng, 32 nhiệm vụ:** mở ngày 1, 8, 15 và 22. Ấp trứng, cho ăn, thắng thám hiểm, câu cá, thắng ải chiến dịch và thủ vệ tháp tính từ đầu mùa. Sao chiến dịch và kỷ niệm tính cả đã có; các hoạt động có thể chơi lại vẫn cộng tiến độ. Nhiệm vụ chặng trước luôn nhận được sau khi chặng mới mở.
- **3 thử thách dài hạn:** đạt 12 sao chiến dịch, tầng 10 Tháp Vô Tận và 8 kỷ niệm trong Sổ khoảnh khắc; mỗi thử thách tặng 120 sao lễ hội.
- **5 mốc ở 100 / 300 / 600 / 1.000 / 1.500 sao:** vé ấp, ngọc, tài nguyên, tổng cộng 15 mảnh Hào Quang và **Cổng Sao Rơi**. Tổng sao kiếm trong mùa dùng cho mốc; tiêu sao ở tiệm không khóa lại phần thưởng.
- **6 món trong tiệm:** mỗi gói đổi một lần mỗi mùa. Cổng Sao Rơi có thể đổi sớm bằng 360 sao hoặc nhận ở mốc 1.000 sao; đã sở hữu thì tiệm không trừ sao để mua lại. Nút **Đặt trên đảo** mở trực tiếp **Chỉnh đảo → Kho đồ → Báu vật**, dùng luật đặt/xoay/lưu của đảo hiện tại.
- **Hết mùa vẫn nhận và đổi quà:** tiến độ khóa ở lần cập nhật sau ngày 30. Người chơi tự chọn mở mùa sau; game nhận hộ mọi nhiệm vụ, thử thách và mốc đã đủ điều kiện, giữ sao chưa tiêu cùng đồ trang trí vĩnh viễn. Nhiệm vụ hoạt động mùa mới bắt đầu đếm lại; sưu tầm và kỷ lục vẫn được ghi nhận.
- **Giữ tiến trình cũ:** bản lưu cũ bắt đầu đủ 30 ngày, lấy số hoạt động hiện có làm mốc đếm. Không cấp thưởng lặp cho hoạt động trước cập nhật; thú, trang bị, Shiny và trận đang dở được giữ. Nhập dữ liệu lễ hội sai bị từ chối thay vì âm thầm đặt lại. Cấu trúc phong bì bản lưu version 1 giữ nguyên.

Kiểm tra luật chơi: **508/508 bài đạt**, gồm 15 bài lễ hội mới. **14/14 tình huống trình duyệt riêng cho lễ hội** đạt, gồm hoạt động thật, mở chặng theo đồng hồ, nhận thưởng một lần, đổi quà không mất mốc, đặt cổng bằng trình chỉnh đảo, xuất/nhập và offline. Kiểm tra 25 cảnh ở 320×640, 390×844, 768×1024, 1440×1000 và ngang 844×390; nút chạm tối thiểu 44×44 px, SVG hợp lệ, không tràn ngang và tôn trọng giảm chuyển động.

Lượt hồi quy toàn game **283/283 tình huống trình duyệt đạt**, không bỏ qua, không lỗi và không cần thử lại. Bao gồm các hệ thống trước đó cùng lễ hội mới. Có 25 ảnh kiểm tra lễ hội trên trình duyệt và 5 ảnh chụp trực tiếp Android trong `dist/screenshots/`.

Trên giả lập Android 15 riêng **SpiritIslesAudit110**, cài đè offline **1.27.0 → 1.28.0** giữ thú, tài nguyên và trận chiến dịch đang dở. Thao tác chạm nhận nhiệm vụ/thử thách, đổi cổng, đặt thật lên đảo, nhận tài nguyên mốc và đóng cưỡng bức/mở lại đều giữ đúng bản lưu. Chuyển mùa nhận hộ 32 nhiệm vụ, ba thử thách và năm mốc; kiểm tra sao mang sang, mảnh Hào Quang, trang trí vĩnh viễn và đổi quà ở mùa mới. SHA-256 APK đang cài khớp gói giao; không có lỗi JavaScript hoặc System UI không phản hồi. Dùng bản lưu kiểm thử riêng, không sửa bản lưu trình duyệt của người chơi. **Chưa thử trên điện thoại thật.**

**140 tệp web** trong APK khớp nguồn từng byte. Chữ ký v2 và khóa cài đè giữ nguyên; Android lint **0 lỗi, 4 cảnh báo có sẵn**. Báo cáo: `dist/ENGINE-1.28.0.tap`, `dist/BROWSER-1.28.0.json`, `dist/SEASONAL-BROWSER-1.28.0.json`, `dist/SEASONAL-VISUAL-1.28.0.json`, `dist/ANDROID-SEASONAL-1.28.0.json`, `dist/BUNDLE-CHECK-1.28.0.json`, `dist/BUILD-INFO-1.28.0.json`.

APK: `dist/DaoLinhThu-1.28.0.apk`. Mã nguồn: `dist/source-1.28.0.zip`. Các bản phát hành trước được giữ riêng.

## Chiến dịch cốt truyện · 1.27.0

Vào **Menu → Chiến dịch**, hoặc mở thẻ chiến dịch trong Thám hiểm. Ba chương **Rừng Cổ Thụ → Vịnh Ngọc Lam → Núi Lửa** có 8 ải/chương (24 ải, 72 sao). Mỗi ải có lời dẫn và hội thoại riêng; chạm điểm trên đường để xem mục tiêu, sức mạnh đề nghị, hành trang và thưởng trước khi bắt đầu.

- Mỗi ải có 2 đợt quái; ải boss có 3 đợt. Điều khiển tay hoặc bật AUTO tự đi, né cảnh báo và dùng kỹ năng. AUTO dừng khi hết ải; không tự trả phí vào ải tiếp.
- Ba sao: thắng, không có thú nào từng gục trong cả ải, hoàn thành thử thách riêng (giới hạn lượt, kỹ năng riêng, combo, phòng thủ, né đòn hoặc sinh lực cuối ải). Giữ kết quả tốt nhất **trong một lần vượt ải**, không ghép mục tiêu từ nhiều lần chơi. Thú hồi lại sau một đợt vẫn mất sao không-gục nếu đã ngã.
- Thưởng lần đầu nhận đúng một lần; chơi lại chỉ nhận thưởng thường. Mỗi chương có rương 8/16/24 sao, nhận thủ công và chỉ một lần. Không dùng tiến trình chiến dịch để mở giả các mốc khám phá hoặc thưởng Shiny của chuyến khám phá thường.
- Boss còn khoảng nửa sinh lực sẽ chuyển pha 2, gọi hai đồng đội thật có HP/chiêu riêng và tăng 15% sát thương. Cổ Thụ dùng rễ, Vua Cua gọi sóng, Rồng Đá có giáp/điểm yếu và dung nham. Một đòn kết liễu ở pha 1 vẫn kích hoạt pha 2. Cả trạng thái pha, quái hỗ trợ, HP riêng và điều kiện sao được lưu sau mỗi lượt.
- Vượt boss chương mở **Cây Trái Tim, Vỏ Sò Ngân Nga, Hải Đăng Bình Minh** trong **Chỉnh đảo → Kho đồ → Báu vật**. Đây là đồ trang trí.
- Đạt 3 sao mở **Quét nhanh ×1/×5**. Mỗi lượt tốn hành trang như chơi lại; nhận vàng/gỗ/tinh hoa thường, không lặp vé/ngọc thưởng lần đầu hay rương sao. Chưa đủ tài nguyên hoặc đội đang đi xa sẽ không trừ phí.
- Bản lưu cũ tự thêm chiến dịch trống và giữ các hệ thống trước đó. Hoạt động mới dùng cùng hệ chiến đấu, đội hình, kỹ năng, trang bị và ngoại hình Shiny. Không thay cấu trúc tệp sao lưu version 1.

Kiểm tra 1.27.0: **493/493 bài luật chơi** đạt, gồm 38 bài chiến dịch mới; **14/14 bài trình duyệt riêng cho chiến dịch** đạt. Cả 24 ải được vượt bằng luật thật, kiểm tra đánh tay/AUTO, điều kiện sao, chuyển pha, lưu giữa trận, chi phí, thưởng một lần và quét nhanh. **269 tình huống trình duyệt đã được xác nhận đạt**: lượt đầy đủ đầu có 264 bài đạt và 5 lỗi (một kỳ vọng kho còn 31 món thay vì 34, bốn kích thước có nút đóng Shiny quá nhỏ). Đã cập nhật số món, tăng vùng chạm nút đóng lên 44×44 px và chạy lại toàn bộ 20 bài Shiny/chỉnh đảo; tất cả đạt, không bỏ qua. Báo cáo tổng hợp giữ nguồn của từng kết quả và không ghi đè kết quả lỗi ban đầu.

Đã rà **45 khung hình chiến dịch** ở 320×640, 390×844, 768×1024, 1440×1000 và ngang 844×390, gồm ảnh chụp trực tiếp Android; sáu mẫu SVG cảnh/kỷ vật hợp lệ. **136 tệp web** trong APK khớp nguồn từng byte, chữ ký v2 và khóa cài đè giữ nguyên. Android lint: **0 lỗi, 4 cảnh báo có sẵn**.

Trên giả lập Android 15 riêng, đã cài đè offline **1.26.0 → 1.27.0**, đối chiếu thú, Shiny, tài nguyên và toàn bộ tiến trình cũ. Dùng thao tác chạm để đánh tay/AUTO khớp engine, đạt 3 sao, quét ×5 đúng phí, nhận rương sao một lần và mở ba kỷ vật chương. Đóng cưỡng bức/mở lại giữ trận, pha hai, hai quái hỗ trợ, sao và phần thưởng; AUTO tắt khi mở lại. Các lượt AUTO dùng đồng hồ điều khiển trong WebView và bản lưu kiểm thử riêng. Không sửa bản lưu trình duyệt của người chơi. **Chưa thử trên điện thoại thật.**

APK cuối đã được cài lại và xác nhận giữ bản lưu, mở bản đồ bằng chạm, nạp đúng chỉ dẫn Báu vật và có nút đóng Shiny 44×44 px khi offline. SHA-256 gói đang cài khớp tệp phát hành; không có lỗi JavaScript. Sau đợt rà Android đầy đủ chỉ sửa hai tệp giao diện này, mọi module luật chơi giống từng byte; báo cáo cuối lưu cả hai mã băm để đối chiếu.

Báo cáo: `dist/ENGINE-1.27.0.tap`, `dist/CAMPAIGN-BROWSER-1.27.0.json`, `dist/BROWSER-1.27.0.json`, `dist/BROWSER-FINAL-UI-1.27.0.json`, `dist/BROWSER-VALIDATED-1.27.0.json`, `dist/CAMPAIGN-VISUAL-1.27.0.json`, `dist/ANDROID-CAMPAIGN-1.27.0.json`, `dist/ANDROID-CAMPAIGN-FINAL-1.27.0.json`, `dist/BUNDLE-CHECK-1.27.0.json` và `dist/BUILD-INFO-1.27.0.json`.

APK: `dist/DaoLinhThu-1.27.0.apk`. Mã nguồn: `dist/source-1.27.0.zip`. Các bản phát hành trước được giữ riêng.

## Sổ Hào Quang · 1.26.0

Vào **Menu → Shiny (Sổ Hào Quang)**, hoặc mở từ Vườn ấp/Đội hình & linh thú. Chạm từng mẫu để so sánh với hình hài gốc. Sáu biến thể có chi tiết riêng: Cáo Mầm Hào Quang có đuôi lá vàng, Kỳ Nhông Cực Quang có mang pha lê, Hươu Hoa Đào Ngân Hà có cánh hoa, Hươu Thần Mùa Vàng có sừng nhánh vàng, Long Vương Biển Sao có cánh buồm tinh tú, Miêu Nhật Thực Tinh Vân có ba đuôi và trăng lưỡi liềm.

- **Trứng thưởng thêm Shiny:** mỗi trứng Mầm Xanh hoặc Ánh Sao có 1,2% nhận thêm một biến thể; bảo hiểm riêng ở trứng thứ 60, đếm từng trứng trong lượt 10. Kết quả thường và bảo hiểm SR/SSR theo luật cũ. Mọi lượt thường trong lượt 10 hoàn thành trước khi quay phần thưởng thêm. Hai loại trứng dùng chung bảo hiểm Shiny.
- **Chơi để chọn thú:** mỗi chuyến khám phá thắng cho 1 mảnh Hào Quang và 4% gặp thêm Shiny. Thủ vệ thắng cho 2 + bậc mảnh; boss tháp tầng 5/10/15/20/25/30 cho 2/3/3/4/4/5 mảnh. Đủ **30 mảnh**, chọn một biến thể chưa có. Thua/rút lui không có phần thưởng này; thưởng không lặp khi mở lại kết quả. Buổi tập không chuyển mảnh về đảo thật.
- **Ưu tiên mẫu chưa có:** mỗi biến thể chưa có có xác suất ngang nhau; khi đủ sáu, Shiny trùng thành 10 mảnh. Có thể đổi 10 mảnh dư lấy 2 vé ấp. Ghép hoặc gặp ngoài đường không đặt lại bảo hiểm trứng.
- **Hai hình hài của cùng một thú:** giữ cấp, sao, gắn bó, nhánh luyện và trang bị. Nếu chưa có loài gốc, nhận cả thú ở cấp 1. Đổi diện mạo trong sổ hoặc hồ sơ khi đội kết thúc hoạt động. Shiny theo thú lên đảo, đi đường và chiến đấu, dùng được cùng thức tỉnh/trang sức; không cộng chỉ số. Đội đang chơi dùng diện mạo đã chốt khi khởi hành.
- **Kỷ vật 1/3/6 Shiny:** nhận mốc trong sổ để mở Tượng Cáo Hào Quang + 1 vé, nền hồ sơ Tinh Vân + 3 vé, Cổng Cực Quang + 6 vé + 100 ngọc. Vào **Chỉnh đảo → Kho đồ → Báu vật** để đặt tượng/cổng; nền hồ sơ có nút bật/tắt trong sổ. Mỗi mốc nhận một lần.

Khóa lưu và phong bì phiên bản 1 giữ nguyên. Bản lưu cũ bổ sung sổ trống; bảo hiểm trứng cũ, thú, tài nguyên và hoạt động đang dở giữ nguyên. Dữ liệu Shiny có sẵn nhưng sai bị từ chối khi nhập. Các tệp hình vẽ, hiệu ứng và sổ mới được đóng gói/cache offline; giảm chuyển động của game và hệ điều hành được tôn trọng.

Kiểm tra luật chơi: **455/455 bài đạt**, gồm 27 bài Shiny mới. **255/255 tình huống trình duyệt** đạt trong lần chạy đầy đủ cuối, không bỏ qua hoặc cần thử lại; gồm 13 bài Shiny về xem trước không tiêu tài nguyên, ghép/đổi diện mạo, bảo hiểm trứng, kỷ vật/hồ sơ, đánh tay/AUTO, khám phá, boss tháp và offline. Có 16 khung hình chức năng cùng 21 khung hình rà đồ họa ở 320×640, 390×844, 768×1024, 1440×1000 và ngang 844×390; SVG, gradient và giảm chuyển động đều được kiểm tra. Đã xem trực tiếp sáu mẫu, kết hợp thức tỉnh, bộ sưu tập, so sánh, đảo, hồ sơ và các ảnh Android. **130 tệp web** trong APK khớp nguồn từng byte; chữ ký v2 và khóa cài đè giữ nguyên. Android lint **0 lỗi, 4 cảnh báo có sẵn**.

Giả lập Android 15 riêng SpiritIslesAudit110 đã kiểm tra cài đè offline **1.25.0 → 1.26.0**, giữ thú, tài nguyên và trận tháp đang dở. Thao tác chạm ghép ba Shiny, đổi hình hài, nhận mốc 1/3, bật nền hồ sơ và mở lại app giữ đúng dữ liệu. Trứng bảo hiểm cho cả kết quả thường và Shiny riêng. Đánh tay/AUTO đối chiếu engine, đóng cưỡng bức giữ đội và diện mạo trong trận, AUTO tắt khi mở lại; thắng boss cộng mảnh một lần. Tượng đã mở, cổng chưa đủ mốc vẫn khóa trong kho đồ. SHA-256 APK đang cài khớp gói giao, không lỗi JavaScript của game; hai lần System UI không phản hồi được xử lý và xác nhận game giữ focus trước khi chạm tiếp. Các lượt chiến đấu dùng đồng hồ điều khiển trong WebView; toàn bộ dùng bản lưu kiểm thử riêng, không sửa bản lưu trong trình duyệt của người chơi. **Chưa thử trên điện thoại thật.**

Báo cáo: `dist/ENGINE-1.26.0.tap`, `dist/BROWSER-1.26.0.json`, `dist/SHINY-VISUAL-1.26.0.json`, `dist/ANDROID-SHINY-1.26.0.json`, `dist/BUNDLE-CHECK-1.26.0.json`, `dist/BUILD-INFO-1.26.0.json`.

APK: `dist/DaoLinhThu-1.26.0.apk`. Mã nguồn: `dist/source-1.26.0.zip`. Các bản trước được giữ riêng.

## Tháp Vô Tận · 1.25.0

Vào **Menu → Tháp Vô Tận**, hoặc chọn cổng tháp trong Thám hiểm. Mở từ cấp đảo 2; mỗi chuyến tốn 10 quả mọng. Bản này có 30 tầng, ba vùng và sáu thủ vệ, dùng chính đội thú đã sưu tầm.

- **Chọn lối và xây bộ sức mạnh:** trận thường, tinh anh, điện phước lành, suối nghỉ hoặc kho báu. Chọn một trong ba phước lành sau trận; 11 loại phối hợp theo hệ thú, đội đồng hệ/đa hệ và thú N/R. Mỗi loại có giới hạn cộng dồn. Tinh anh mạnh hơn 28%, thưởng bụi thêm 70% và 12 ngọc, đổi lấy lời nguyền tăng 8% sát thương địch mỗi bậc, tối đa ba bậc.
- **Chiến đấu và AUTO thật:** mỗi thú có máu, hàng đứng, mục tiêu, chờ chiêu và vai trò riêng. AUTO dùng chiêu riêng, hồi phục, phòng thủ và Hợp lực; tự dừng sau trận để người chơi chọn lối/phước lành. Hai bình sương mỗi chuyến; lưu từng lựa chọn và từng lượt. Thủ vệ xuất hiện mỗi năm tầng.
- **Thưởng được cất ngay:** mỗi tầng trả tài nguyên/bụi một lần; thua hoặc rời tháp vẫn giữ phần đã kiếm. Đổi 80 bụi lấy hai vé ấp hoặc 60 bụi lấy tám tinh hoa. Rương lần đầu ở mốc 5/10/15/20/25/30, cùng rương tuần riêng. Mốc 10 mở hai Đèn Thiên Tinh; mốc 30 mở Tượng Tháp Sao và trang sức Tinh Quan cho đội thú ở đảo/trong tháp. Đặt các món trong kho Trang trí đảo.
- **Thay đổi mỗi tuần:** thứ Hai 00:00 giờ Việt Nam luân phiên Sấm Dội, Thiết Giáp và Sương Lặng. Chỉ kỷ lục/rương tuần làm mới; giữ kỷ lục vĩnh viễn, đồ trang trí và mọi sưu tầm. Chuyến leo dở giữ tuần khởi hành, tiếp tục bình thường và không cộng vào tuần mới.

Bản lưu phiên bản 1 được giữ; dữ liệu tháp tự bổ sung khi cài đè. Chọn đội hình và các chuyến đi khác khóa trong lúc leo tháp. Giao diện tháp có tông trời đêm, bản đồ chặng, lời nguyền và túi phần thưởng rõ ràng; nút chiến đấu vẫn nằm trong khung game.

Kiểm tra 1.25.0: **428/428 bài luật chơi**, gồm 30 bài mới về tháp; **242 tình huống trình duyệt đã xác nhận đạt**. Lần chạy đầy đủ đầu có bốn lỗi: hai kỳ vọng menu còn sáu mục, danh mục còn 27 món và nhãn Cài đặt còn phiên bản cũ. Đã cập nhật thành bảy mục/29 món/1.25.0, chạy lại toàn bộ 26 tình huống của bốn tệp liên quan; tất cả đạt, không bỏ qua. Kết quả gốc và nguồn của từng kết quả hợp nhất được giữ trong báo cáo. Đã rà **24 khung hình** ở 320×640, 390×844, 1440×1000 và ngang 844×390. SVG hợp lệ, không tràn trang và các tệp mới được cache offline.

Giả lập Android 15 riêng đã qua cài đè offline **1.24.0 → 1.25.0**, giữ tiến trình cũ; đánh tay/AUTO khớp engine, Home tạm dừng, Back dừng AUTO, đóng cưỡng bức giữ máu từng thú/phước lành/tầng. Thắng dừng ở màn chọn phước lành; rương lần đầu/rương tuần và trang sức giữ sau khi mở lại. Đợt rà đầy đủ có một lần System UI không phản hồi được xử lý trước khi tiếp tục; game không có lỗi JavaScript. Gói cuối chỉ sửa nhãn phiên bản so với gói rà đầy đủ; 126 tệp web được so sánh, mọi module luật chơi giống từng byte. Đã cài lại gói cuối và kiểm tra bằng chạm: nhãn 1.25.0, vương miện, đỡ đòn khớp engine và giữ trận sau khi khởi động lại; SHA-256 đang cài khớp APK giao. Android lint **0 lỗi, 4 cảnh báo có sẵn**. **Chưa thử trên điện thoại thật.**

Báo cáo: `dist/ENGINE-1.25.0.tap`, `dist/BROWSER-VALIDATED-1.25.0.json`, `dist/TOWER-VISUAL-1.25.0.json`, `dist/ANDROID-TOWER-1.25.0.json`, `dist/ANDROID-TOWER-FINAL-1.25.0.json`, `dist/BUILD-INFO-1.25.0.json`.

APK: `dist/DaoLinhThu-1.25.0.apk`. Mã nguồn: `dist/source-1.25.0.zip`. Các bản trước được giữ riêng.

## Đồi Than Hồng · 1.24.0

Mở **Thám hiểm → Đồi Than Hồng** ở đảo cấp 3, chọn **AUTO · Khởi hành** hoặc **Xem hành trình** khi đã vào chuyến đi. Đội thú đi qua năm chặng trong cùng cảnh núi lửa, có sông dung nham, cầu đá, tàn lửa và suối ấm. Cảnh, thú và túi không bị thay khi gặp quái rồi tiếp tục di chuyển. Nút nằm trong màn hình game và phù hợp cả điện thoại dọc/ngang.

- **Hai đường đi:** Suối ấm hồi 14 HP và thêm 35 vàng/12 quả; Khe quặng có quái mạnh hơn 35% và thêm 80 vàng/14 ngọc. AUTO chọn lối an toàn. Đồ vào túi, chỉ được trả về kho theo luật kết thúc chuyến đi.
- **Quái biết phối hợp:** Hộ Vệ Đá dựng khiên, che đồng đội; Sói Than Hồng vượt hàng trước/Khiêu khích để săn thú yếu hàng sau, khiên cá nhân vẫn bảo vệ được mục tiêu; Chim Tro Lửa tụ lực rồi đánh lan. Cả ba có hình vẽ riêng, thanh máu và ý định thật. Thú đã gục ngừng hành động.
- **Dung nham dưới chân:** cảnh báo theo lượt đã lưu, vùng đỏ và nền đá an toàn xuất hiện trước đòn. Né dùng một lượt, không gây sát thương hay thêm năng lượng, giảm 85% sát thương. Thú di chuyển tới nền đá khi né. Dung nham là sát thương môi trường thật; ngắt quái bằng Phá thế không dập được khe nứt.
- **Rồng Đá Ngủ Quên:** báo trước đòn Dậm vỡ nền và Hơi thở dung nham, đánh cả đội. Giáp đá có 45 điểm, giảm 55% sát thương thường khi còn giáp. Hợp lực/chiêu phá khiên bào giáp nhanh hơn; xuyên giáp cũng phá tốt và chỉ bị giảm 15% sát thương. Vỡ giáp mở hai đòn gây sát thương tiếp theo +60%; né và lấy đà giữ số đòn này. Giáp không tự hồi lại.
- **AUTO theo luật thật:** né cảnh báo, ưu tiên chữa thú yếu, dùng Hợp lực/phá giáp rồi bung lực vào điểm yếu. Không tự tạo nhịp hoàn hảo, cấp thêm lượt hay bắt đầu chuyến mới. Mở chiến thuật/chuyển ứng dụng tạm dừng; mở lại game giữ AUTO tắt.
- **Kỷ vật và ngoại hình:** thắng 1 chuyến mở Suối Ấm; 3 chuyến mở 2 Cây Dung Nham và diện mạo Than Hồng cho thú hệ Lửa trên đảo/bộ sưu tập; 5 chuyến mở Tượng Rồng Đá. Số món mở khóa dựa vào số lần thắng, không cộng lặp khi xem lại kết quả. Ngoại hình không tăng sức mạnh.
- **Hai kỷ niệm:** thú Lửa có 5 gắn bó ghé Suối Ấm để khám phá Hơi ấm từ lòng đất; 15 gắn bó, Cây Dung Nham gần Suối Ấm mở Bông hoa từ tàn than. Tổng cộng 22 hành vi và 592 cặp loài/hành vi tương thích.

Bản lưu và phong bì phiên bản 1 giữ nguyên. Trận núi lửa cũ giữ đúng đội và dạng sinh lực cũ; cơ chế giáp/dung nham chỉ có ở trận núi lửa mới. Các kiểm tra dùng trình duyệt biệt lập và giả lập SpiritIslesAudit110, không sửa bản lưu ở trình duyệt của người chơi.

Kiểm tra 1.24.0: **398/398 bài luật chơi** (20 bài mới), **17/17 tình huống trình duyệt vùng núi lửa** và **35 khung hình** ở 320×640, 390×844, 768×1024, 1440×1000, 844×390 đạt. Âm thanh theo hệ/cảnh báo, tắt âm, giảm chuyển động theo cài đặt/hệ điều hành, SVG và cache offline đều được kiểm tra. **120 tệp web** trong APK khớp nguồn từng byte; chữ ký v2 và khóa cài đè giữ nguyên. Android lint **0 lỗi, 4 cảnh báo có sẵn**.

Giả lập Android 15 SpiritIslesAudit110 đã qua cài đè offline **1.23.0 → 1.24.0**, giữ nguyên bản lưu; chạm né Dậm vỡ nền và Hợp lực phá giáp khớp engine, AUTO né dung nham/hơi lửa, Home/Back/chiến thuật tạm dừng, đóng cưỡng bức giữ đội/giáp và AUTO tắt khi mở lại. Hành trình đủ năm trận tạo năm báo cáo, trả thưởng một lần, lưu lại sau khi khởi động lại. SHA-256 APK đang cài khớp gói giao; không lỗi JavaScript hoặc ANR System UI. Các bước kiểm tra lượt dùng đồng hồ điều khiển trong WebView. **Chưa thử trên điện thoại thật.**

Báo cáo: `dist/ENGINE-1.24.0.tap`, `dist/BROWSER-VOLCANO-1.24.0.json`, `dist/BROWSER-1.24.0.json` (bộ hồi quy toàn bộ), `dist/VOLCANO-VISUAL-1.24.0.json`, `dist/VOLCANO-EXTRAS-1.24.0.json`, `dist/ANDROID-VOLCANO-1.24.0.json`, `dist/BUILD-INFO-1.24.0.json`.

APK: `dist/DaoLinhThu-1.24.0.apk`. Mã nguồn: `dist/source-1.24.0.zip`. Giữ các bản phát hành trước riêng biệt.

## Vịnh Ngọc Lam · 1.23.0

Mở **Thám hiểm → Vịnh Ngọc Lam** ở đảo cấp 2, chọn **AUTO · Khởi hành** hoặc khởi hành thủ công rồi **Xem hành trình**. Cả đội đi qua năm chặng trong một cảnh biển, không thay cảnh/thú khi chuyển đi đường → giao chiến → đi tiếp. Cầu gỗ, bãi cát, hải đăng, rạn san hô và đường bọt sóng dùng SVG cục bộ; có vệt chân, hiệu ứng sóng, tiếng chiêu theo hệ và giảm chuyển động theo cài đặt/hệ điều hành. Nút vẫn nằm trong khung game; màn ngang có cụm điều khiển bên phải.

- **Chọn đường có đánh đổi:** bờ cát hồi 12 HP, thêm 28 vàng và 10 quả; rạn sâu có quái mạnh hơn 30%, thêm 65 vàng và 10 ngọc. Vật phẩm vào túi hành trình; chỉ luật kết thúc chuyến trả thưởng về kho. AUTO mặc định chọn bờ cát an toàn, không tự mua tài nguyên hay khởi hành chuyến mới.
- **Đội quái riêng:** Cua Đá ở hàng trước dựng khiên/che đòn; Sứa Tích Điện chuẩn bị ở lượt đầu của chu kỳ ba lượt, phóng điện đánh lan lượt hai và đánh đơn lượt ba; Sò Ngọc ở hàng sau chữa bạn dưới 70% HP với thời gian chờ thật. Hạ một con sẽ chặn hành động của con đó. Ý định, chọn mục tiêu và hiệu ứng bám đúng từng con. Ba mẫu đối thủ có hình vẽ cua, sứa và sò riêng; dùng định danh loài có sẵn trong bản lưu để giữ tương thích.
- **Boss Cua San Hô:** mỗi lượt thứ ba báo Sóng triều trên mặt đất. Né dùng đúng một lượt, không đánh hay tích năng lượng, giảm 85% sát thương sóng. Né thành công làm boss hở bụng: sát thương ở lượt ra đòn kế tiếp +20%, chỉ một lần. Lấy đà giữ cơ hội này. AUTO cũng phải dùng một lượt né theo cùng luật; không tạo nhịp hoàn hảo. Đóng/mở game giữ cảnh báo và cơ hội phản công theo bản lưu.
- **Kỷ vật mang về đảo:** thắng 1 chuyến mở 3 Vườn San Hô; 3 chuyến mở 2 Đèn Ngọc Trai cùng vòng Ngọc Triều trên thú hệ Thủy ở đảo/bộ sưu tập; 5 chuyến mở Tượng Cua San Hô. Vào Trang trí đảo, mục Báu vật, để đặt. Đây là mở khóa theo số chuyến thắng, không cộng lại số món khi xem lại kết quả và không tăng chỉ số chiến đấu.
- **Hai khoảnh khắc mới:** thú Thủy có 5 gắn bó chơi với Vườn San Hô để tìm Khúc hát của rạn ngọc; 15 gắn bó và Đèn Ngọc Trai đặt gần san hô mở Ngọc trai gọi thủy triều. Ghi kỷ niệm vào Sổ khoảnh khắc theo luật cũ, không nhận gắn bó lặp lại.

Bản lưu, khóa lưu và phong bì phiên bản 1 giữ nguyên. Trận vịnh cũ giữ đội hình đã lưu và dạng máu chung nếu có; các nhóm mới nhận cơ chế ven biển. Rừng Thì Thầm và các vùng khác được giữ nguyên. Không thay bản lưu ở trình duyệt đang mở của người chơi; các kiểm tra dùng trình duyệt biệt lập và AVD kiểm thử riêng.

Kiểm tra 1.23.0: **378/378 bài luật chơi**, gồm 18 bài mới về vùng biển; **215 tình huống trình duyệt đã được xác nhận đạt**. Lần chạy đầy đủ có 214 bài đạt và một bài còn đếm danh mục cũ 21 món. Đã cập nhật kỳ vọng thành 24 món sau khi thêm ba kỷ vật, chạy lại bài đó ở năm kích thước và toàn bộ 15 tình huống vùng biển trên CSS cuối; tất cả đạt, không bỏ qua. Báo cáo gốc được giữ ở `dist/BROWSER-1.23.0.json`; báo cáo hợp nhất có nguồn từng kết quả ở `dist/BROWSER-VALIDATED-1.23.0.json`.

Đã rà **30 khung hình biển** ở 320×640, 390×844, 768×1024, 1440×1000 và ngang 844×390. Đã tăng độ tương phản chữ chọn đường/Hợp lực sau lượt rà đầu. Âm thanh bật/tắt, giảm chuyển động, gradient SVG, cache offline và báo lỗi JavaScript đều qua kiểm tra. **116 tệp web** trong APK khớp nguồn từng byte; chữ ký v2 và khóa ký giữ nguyên. Android lint: **0 lỗi, 4 cảnh báo đã có**.

Giả lập Android 15 riêng đã qua cài đè offline **1.22.0 → 1.23.0**, giữ bản lưu; chạm né đối chiếu với luật thật; AUTO né và tiếp tục dùng chiêu; chiến thuật/Home/Back tạm dừng; đóng cưỡng bức và mở lại giữ trận, AUTO tắt. Một chuyến đủ năm chặng tạo năm báo cáo và trả thưởng một lần. Lần kiểm tra đầu chạy APK trước chỉnh tương phản; hai gói chỉ khác `reef-journey.css`, các module luật chơi giống nhau từng byte. APK cuối đã được cài và kiểm tra lại bằng chạm: chọn rạn sâu, ba mẫu quái, nhãn đủ tương phản và né sóng mở bụng; bản lưu giữ nguyên khi cài lại, SHA-256 gói đang cài khớp gói giao. Các kiểm tra số lượt dùng đồng hồ điều khiển trên WebView; toàn bộ dùng bản lưu kiểm thử riêng. **Chưa thử trên điện thoại thật.**

APK: `dist/DaoLinhThu-1.23.0.apk`. Mã nguồn: `dist/source-1.23.0.zip`. Các APK/mã nguồn trước vẫn được giữ riêng.

## Phiêu lưu liền mạch ở Rừng Thì Thầm · 1.22.0

Vào **Thám hiểm → Rừng Thì Thầm → AUTO · Khởi hành**. Với chuyến rừng đang dở, chọn **Bật AUTO** hoặc **Xem hành trình** trong thẻ **Khu rừng đang gọi**. Màn phiêu lưu mới dành cho vùng rừng; các vùng khác và sàn đấu chi tiết tiếp tục dùng giao diện trước.

- **Cùng một thế giới suốt chuyến đi:** cảnh rừng nhiều lớp, con đường, đội thú và túi hành trình giữ nguyên khi chuyển từ đi đường sang giao chiến rồi đi tiếp. Vị trí thú phản ánh hàng trước/sau; mỗi thú có tên và thanh máu riêng. AUTO tự chọn đường miễn phí và dùng chiêu theo chiến thuật đã lưu. Nút điều khiển nằm trong khung game; màn hình ngang đưa bảng chiêu sang bên phải.
- **Chuyển động theo thú và vai trò:** thú cận chiến lao đến mục tiêu thật, chim/rồng và thú phép bắn từ xa; hồi máu, khiên và tiếp sức hướng đến đúng đồng đội. Đòn trúng có số, vệt chém, phản ứng lùi và âm thanh theo hệ. Chọn **Thế trận & chi tiết** để đổi thế, người nhận hỗ trợ, kỹ năng thức tỉnh và canh nhịp. Chuyển động và âm thanh tuân theo Cài đặt; giảm chuyển động của hệ điều hành cũng tắt chuyển động cảnh và thú.
- **Boss Cổ Thụ báo Rễ trồi:** mỗi lượt thứ ba của boss rừng xuất hiện vùng nguy hiểm trên đất và nút **Né rễ ngay**. Đòn rễ tăng thêm 65% so với đòn dồn sức và đánh lan tất cả thú còn sống, không bị hộ vệ chuyển hướng. Né dùng đúng một lượt, giảm 85% sát thương lượt đó, không gây sát thương trực tiếp hoặc tăng năng lượng. Hiệu ứng theo lượt và chờ chiêu vẫn chạy; giữ Lấy đà/Phản kích và Phá thế đã tích. AUTO ưu tiên né theo cùng luật, người chơi có thể chạm né trước lịch AUTO. Báo đòn suy ra từ lượt đang lưu; đóng/mở game không bỏ qua hoặc cộng thêm lượt. Bản lưu cũ dùng sinh lực chung vẫn chơi được.
- **Nhặt đồ có thật:** vật phẩm từ lựa chọn đường và trận thắng rơi rồi bay về túi, hiển thị đúng phần tăng của chiến lợi phẩm. Túi chỉ giữ đồ trong chuyến đi; tài nguyên được cộng theo luật kết thúc chuyến cũ, một lần. Kết quả có thưởng và bốn báo cáo trận thật. Hiệu ứng không tự cấp thưởng, không lưu trạng thái riêng.

Khóa lưu và định dạng phiên bản 1 giữ nguyên. Cài đè giữ đội, HP/khiên/che chắn, thời gian chờ, đảo, tài nguyên, chiến thuật, đội hình lưu và nhật ký. Back dừng AUTO trước khi rời cảnh; mở chiến thuật hoặc chuyển ứng dụng tạm dừng. Mở lại game giữ AUTO tắt. Bộ cảnh SVG, CSS và các module mới được đóng gói/cache offline.

Kiểm tra 1.22.0: **360/360 bài luật chơi** (12 bài mới và 348 hồi quy), **200/200 tình huống trình duyệt** đạt trong lần chạy đầy đủ cuối cùng, không bỏ qua, không có bài flaky hoặc retry. Đã rà **30 khung hình rừng** tại 320×640, 390×844, 768×1024, 1440×1000 và ngang 844×390; kiểm tra chạm không bị che, giữ cùng phần tử cảnh/thú khi gặp quái, đường đi, né, chiến lợi phẩm và kết quả. Các bài riêng xác nhận cache offline, SVG không thiếu gradient, âm thanh bật/tắt và tần số theo hệ, giảm chuyển động trong game và theo hệ điều hành. **112 tệp web** trong APK khớp nguồn từng byte; chữ ký v2 và khóa ký giữ nguyên. Android lint: **0 lỗi, 4 cảnh báo đã có**.

Trên giả lập Android 15 riêng, đã cài đè **1.21.0 → 1.22.0 khi offline** và đối chiếu bản lưu trước/sau. Bản lưu kiểm tra được nhập qua Cài đặt để thử chạm né theo đúng luật thật, AUTO né, thao tác Home/Back, mở chiến thuật, đóng cưỡng bức/mở lại và trọn chuyến đi với bốn báo cáo, thưởng chỉ một lần. Đồng hồ điều khiển trên WebView được dùng để kiểm tra số lượt mà không cộng thêm thời gian thao tác. Giả lập có hai lần System UI không phản hồi; công cụ đóng đúng hộp thoại hệ thống và xác minh game giữ focus trước mỗi chạm/chụp. Không có lỗi JavaScript của game. SHA-256 gói đang cài khớp APK. **Chưa thử trên điện thoại thật.**

APK: `dist/DaoLinhThu-1.22.0.apk`. Mã nguồn: `dist/source-1.22.0.zip`. Các bản phát hành trước được giữ riêng.

## Đồ họa đảo & cảnh chiến đấu · 1.21.0

Đảo có vách đá nhiều lớp, tán cây có ánh sáng và bóng tối, nước xanh ngọc, thác nước, hoa và dương xỉ. Công trình có vật liệu và cửa sổ sáng, vẫn dùng đúng vị trí đã lưu trong trình trang trí đảo. HUD dùng xanh rừng, viền đồng và mặt nút vàng ấm; chữ và thông tin chiến đấu nằm trên nền rõ ràng.

Cảnh thám hiểm, hành trình và sàn đấu có **6 chủ đề riêng**: rừng có tán cây và tia nắng, vùng nước có thác và san hô, núi lửa có đá tối và dung nham, vùng gió có đảo nổi và phế tích, vùng bóng đêm có trăng và nấm phát sáng, vùng ánh sáng có đền đá. Cảnh nền chỉ làm hình ảnh, không nhận chạm hoặc che mục tiêu.

Linh thú được tăng sắc độ, bóng tiếp xúc, ánh sáng viền và ánh phản chiếu; giữ khuôn mặt và dáng riêng của từng loài. Thú SR/SSR có vòng triệu hồi và nền trưng bày riêng; SSR thêm vòng phù văn và chi tiết vàng. Trứng Mầm Xanh có vỏ ngọc và hoa văn lá; trứng Ánh Sao có vỏ lam tím, chòm sao và ngôi sao khảm vàng. Hình vẽ dùng SVG tự chứa gradient, đóng gói và cache offline. Hiệu ứng mới tuân theo **Chuyển động** trong Cài đặt và lựa chọn giảm chuyển động của hệ điều hành.

Định dạng bản lưu giữ nguyên; đọc trực tiếp bản 1.20.0, bao gồm chiến thuật AUTO, ba đội hình lưu và nhật ký chiến đấu.

Kiểm tra 1.21.0: **348/348 bài luật chơi**, **186/186 tình huống trình duyệt** và **12/12 bài AUTO kiểm tra lại sau chỉnh nhãn thú** đạt, không bỏ qua hoặc cần chạy lại trong các báo cáo cuối. Đã rà **47 khung hình chính và cảnh theo hệ** ở 5 kích thước: 320×640, 390×844, 768×1024, 1440×1000 và ngang 844×390; không tràn ngang hoặc lỗi JavaScript. Tài nguyên mới hoạt động offline và tuân theo giảm chuyển động. **108 tệp web** trong APK khớp nguồn từng byte; chữ ký v2 và khóa ký giữ nguyên. Android lint: **0 lỗi, 4 cảnh báo đã có**.

Trên giả lập Android 15 riêng, đã cài đè **1.20.0 → 1.21.0 khi offline**, giữ nguyên thú, đảo, tài nguyên, chiến thuật AUTO, đội hình lưu và nhật ký. Đã kiểm tra chạm mở thú SSR và trứng Ánh Sao, đi đường, cảnh chiến đấu, đóng cưỡng bức và mở lại trận đang chơi; AUTO tắt sau mở lại. Xác nhận một lượt AUTO dùng đồng hồ điều khiển trên WebView đã tải lại để thao tác giả lập không chạy thêm lượt. SHA-256 gói đang cài khớp APK. **Chưa thử trên điện thoại thật.**

APK: `dist/DaoLinhThu-1.21.0.apk`. Mã nguồn: `dist/source-1.21.0.zip`. Các bản phát hành trước được giữ riêng.

## Chiến thuật AUTO, đội hình lưu & báo cáo · 1.20.0

Trong sàn đấu hoặc hành trình, chạm nút **An toàn / Càn quét / Săn boss** cạnh AUTO để mở **Sổ tay đội trưởng**. Trên trang **Đội hình & linh thú**, chọn **Chiến thuật** hoặc **Báo cáo**. Bảng nằm trong game, có ba mục Chiến thuật, Đội hình lưu và Báo cáo.

- **Càn quét:** nhắm đối thủ yếu máu, hồi ưu tiên dưới 30%, dùng thế Tấn công (+25% sát thương gây và nhận). Chỉ đỡ sớm khi thật sự yếu; vẫn dùng kỹ năng cứu bạn, ngắt phép và Hợp lực theo tình huống.
- **An toàn:** hồi ưu tiên dưới 48%, nhắm hồi phục/hỗ trợ của địch, ưu tiên Hộ vệ trước đòn mạnh. Trở về thế Cân bằng, tự chuyển Phòng bị khi bạn yếu nhất dưới 60% và địch chuẩn bị đánh mạnh.
- **Săn boss:** hồi ưu tiên dưới 60%, giữ tuyệt kỹ thức tỉnh cho thủ lĩnh cuối vùng, tầng boss phế tích và các thủ vệ; ưu tiên ngắt phép và nhắm rễ/lõi. Có thể chỉnh **ngưỡng hồi 0–80%**, **tuyệt kỹ khi phù hợp/chỉ boss/tự dùng**, **mục tiêu hỗ trợ/yếu máu** và **ưu tiên ngắt phép**. Tắt ưu tiên hồi/ngắt không cấm chiêu có hiệu ứng đó xuất hiện tự nhiên khi đội công kích hoặc Hợp lực.
- **Lưu 3 đội hình có tên:** mỗi ô giữ thứ tự tối đa 3 thú, hàng trước/sau và chiến thuật đang chỉnh. Cấp, nhánh luyện và trang bị lấy theo thú hiện tại. Đổi đội bằng một nút trước chuyến đi; trong chuyến đi/buổi tập chỉ cho lưu, không áp đội khác. Lưu vào ô đã có sẽ ghi đè đúng ô đó. Chọn hồ sơ chỉ là bản nháp; **Áp dụng** hoặc **Lưu đội hiện tại** mới ghi lại. Đổi nhanh ưu tiên mục tiêu ở HUD được lưu ngay.
- **Báo cáo trận thật:** tự ghi từng lượt cả AUTO và đánh tay; có sát thương, hồi máu thực nhận, khiên mới, sát thương đã nhận/chặn và lượt dùng chiêu của từng thú, kèm thứ tự gục. Hợp lực và hiệu ứng chưa có nguồn cá nhân được tách thành số liệu đội; sát thương lõi/ngắt phép ghi riêng. Khiên đầu trận không tính là khiên tạo trong lượt. Giữ **8 trận gần nhất**, tiếp tục bản đang ghi sau tải lại, không cấp thêm thưởng. Trận cũ bắt đầu ghi từ lúc cập nhật được đánh dấu thiếu lượt trước đó. Luyện tập ghi trong bản sao riêng và không đổi nhật ký trận thật.
- **Tạm dừng rõ ràng:** mở Sổ tay sẽ dừng lịch AUTO và đồng hồ canh nhịp; lượt đã chốt được phép diễn xong. Back đóng Sổ tay trước, trở về AUTO chờ đúng lượt tiếp theo. Đóng game luôn giữ AUTO tắt; hồ sơ, đội hình và báo cáo vẫn được lưu offline. Mỗi chiêu giữ đúng năng lượng, chờ chiêu và giới hạn một lần thức tỉnh mỗi trận.

Bản lưu 1.19.0 chỉ được bổ sung cấu hình AUTO mặc định và nhật ký trống; đội, sinh lực/khiên/che chắn, thời gian chờ, luồng ngẫu nhiên, bộ sưu tập, kỷ niệm và tài nguyên đang có được giữ nguyên. Khóa lưu và phong bì phiên bản 1 không đổi. Dữ liệu mới có sẵn nhưng sai bị từ chối, không âm thầm đặt lại. Các module và CSS mới được đóng gói/cache offline.

Kiểm tra 1.20.0: **348/348 bài luật chơi** và **186/186 tình huống trình duyệt** đạt trong lần chạy đầy đủ cuối cùng, không có bài bỏ qua hoặc cần chạy lại. Đã rà **40 khung hình ở 5 kích thước** từ 320×640 đến 1440×1000 và ngang 844×390, không tràn ngang hoặc lỗi JavaScript. **106 tệp web** trong APK khớp nguồn từng byte; chữ ký v2 và khóa ký giữ nguyên. Android lint: **0 lỗi, 4 cảnh báo đã có**.

Trên giả lập Android 15 riêng, đã cài đè **1.19.0 → 1.20.0 khi offline**, giữ nguyên trận đang chơi và tiến trình. Đã chạm chỉnh chiến thuật, lưu/áp đội sau khi rút lui, đối chiếu chiêu Tiếp sức/hồi máu và báo cáo với luật thật; kiểm tra mở Sổ tay, Home/Back, đóng cưỡng bức và mở lại. Một hành trình AUTO hoàn chỉnh đã ghi báo cáo và nhận thưởng đúng một lần; cấu hình, đội lưu và nhật ký còn nguyên sau mở lại, AUTO tắt. Các xác nhận số lượt dùng đồng hồ điều khiển trên WebView đã tải lại để thao tác giả lập không chạy thêm lượt. SHA-256 gói đang cài khớp APK. **Chưa thử trên điện thoại thật.**

APK: `dist/DaoLinhThu-1.20.0.apk`. Mã nguồn: `dist/source-1.20.0.zip`. Các bản phát hành trước được giữ riêng.

## Hành trình AUTO · 1.19.0

Vào **Thám hiểm → AUTO · Khởi hành** để đội tự đi qua từng chặng, gặp quái, chọn mục tiêu, đánh thường, dùng chiêu riêng/Thức tỉnh/Hợp lực, hồi máu và mang chiến lợi phẩm về đảo. Với chuyến đi đang dở, chọn **Bật AUTO** trong phần Hành trình tự động. Trong trận thủ vệ, phế tích hoặc luyện tập tự do, nút **AUTO BẬT/TẮT** nằm ngay trong màn hình sàn đấu. Các bài giải cố định Võ đường/Thức tỉnh vẫn chơi thủ công.

- **AI theo tình huống:** ưu tiên chữa bạn yếu máu, hộ vệ hàng trước, tiếp sức cho chiêu đang chờ, ngắt tụ phép và nhắm rễ/lõi boss. Chọn ưu tiên **Nhắm hỗ trợ** hoặc **Nhắm yếu máu**. Mọi chiêu vẫn tốn năng lượng, chờ chiêu và giới hạn thức tỉnh đúng luật; AUTO dùng nhịp thường, không tự tạo nhịp hoàn hảo.
- **Đi đường và chiến đấu nối nhau:** thú bước trên đường có cảnh cuộn, chuyển sang trận khi gặp quái, rồi tiếp tục đi sau khi thắng. Lựa chọn tự động chỉ lấy đường miễn phí; không tự chi tài nguyên cho khách lạc đường. Phần thưởng được cấp bởi luật cũ, một lần khi kết thúc chuyến.
- **Điều khiển ngay trong game:** tốc độ ×1/×2, tắt AUTO để tự chọn chiêu. Chạm tắt trong hiệu ứng sẽ để lượt đã chốt diễn xong rồi dừng. Back lần đầu tắt AUTO, lần sau rời sàn. Đóng màn hình hoặc tải lại luôn giữ AUTO tắt; chuyển ứng dụng tạm dừng, trở lại chờ lượt kế tiếp, không cộng dồn thời gian.
- **Tự lưu và kết thúc rõ ràng:** lưu từng nước đi; màn hình kết quả liệt kê chiến lợi phẩm. Hết chuyến hoặc thua sẽ dừng; không tự mua lượt mới. Cài đè giữ nguyên bản lưu 1.18.0, kể cả trận cũ còn dở.

Kiểm tra luật chơi: **326/326** (20 bài mới về AUTO và 306 hồi quy). Đã kiểm tra **25 khung hình** tại 320×640, 390×844, 768×1024, 1440×1000 và 844×390: nút điều khiển nằm trong màn hình, không tràn ngang. **172/172 tình huống trình duyệt** đạt sau lần chạy đầy đủ và các bài kiểm tra lại: hai bài còn tham chiếu phiên bản 1.18 đã được sửa để kiểm tra phiên bản hiện hành; bài kéo trang trí đảo thỉnh thoảng bỏ lỡ điểm chạm từ bản trước đã qua khi chạy riêng, không sửa bài kiểm tra này. Thêm bài chạm AUTO qua đúng thời điểm chuyển lượt: nút nhận lệnh ngay khi chạm và chỉ đổi trạng thái một lần; Enter vẫn dùng được. Giữ nguyên báo cáo lần đầu và lần kiểm tra lại để đối chiếu. Android lint: 0 lỗi, 4 cảnh báo đã có; 102 tệp web trong APK khớp nguồn từng byte, chữ ký v2 và khóa ký giữ nguyên.

Trên giả lập Android 15 riêng, đã cài đè **1.18.0 → 1.19.0** khi offline và giữ nguyên trận 3v3, HP/khiên/che chắn/chờ chiêu, thú, kỷ niệm và tài nguyên. Đã chạm AUTO để tự dùng Tiếp sức rồi hồi máu theo luật thật; nút tắt, tốc độ, Home/Back và đóng cưỡng bức đều được kiểm tra. Sau Home, đội dừng; quay lại chỉ lên một lượt kế tiếp. Đã chạy trọn hành trình đi đường → đánh quái → nhận thưởng một lần. Kiểm tra số lượt dùng đồng hồ điều khiển trên WebView đã tải lại trước khi thử, để thời gian thao tác giả lập không chạy thêm lượt; báo cáo ghi rõ phương pháp này. SHA-256 gói đang cài khớp APK. **Chưa thử trên điện thoại thật.**

APK: `dist/DaoLinhThu-1.19.0.apk`. Mã nguồn: `dist/source-1.19.0.zip`. Các bản phát hành cũ được giữ nguyên.

## Chiêu riêng theo vai trò · 1.18.0

Trong các trận từng thú, vai trò của chiêu đang dùng có thêm một nội tại. Nhánh Bảo hộ của thú hồi phục dùng vai trò Hộ vệ; tuyệt kỹ thức tỉnh dùng vai trò của chính tuyệt kỹ.

- **Công kích · Săn mồi:** chiêu riêng thêm 30% sát thương nếu thú thực sự trúng đòn còn tối đa 40% HP. Kiểm tra sau chuyển hướng của hộ vệ. Không cộng cho đánh thường, Hợp lực, thiêu đốt, phản đòn hay sát thương đánh lõi lửa.
- **Hộ vệ · Khiêu khích:** dùng chiêu ở hàng trước để hút đòn đơn trong lượt hiện tại và lượt sau. Đòn bị chuyển hướng giảm thêm 15%; hộ vệ gục thì các đòn còn lại đổi mục tiêu. Xuyên giáp và đánh lan vượt Khiêu khích. Ý định từng địch và nhãn trên thú thể hiện người đang hút đòn.
- **Hồi phục · Dưỡng hộ:** một nửa lượng hồi tức thì còn dư từ chiêu riêng chuyển thành khiên cho đúng người nhận, làm tròn xuống và giữ giới hạn khiên cá nhân 60% HP. Hồi theo lượt và Hợp lực không chuyển hồi dư; không hồi sinh giữa trận.
- **Hỗ trợ · Tiếp sức:** người được chọn giảm thêm 1 lượt chờ chiêu thường, ngoài mức giảm khi kết thúc lượt. Tự chọn ưu tiên đồng đội còn sống đang chờ lâu nhất; có thể chạm chọn người nhận. Không giảm cho chính mình, không giảm lượt dùng tuyệt kỹ thức tỉnh, không xuống dưới 0.

Xem trước lượt chạy luật thật trên bản sao, hiển thị người nhận, khiên từ hồi dư và giảm chờ. Hồi máu/khiên/tiếp sức có hiệu ứng bay đến đúng thú, kèm số nổi Săn mồi, Khiêu khích và giảm chờ. Mở **Chiêu riêng theo vai trò** trong sàn đấu để đọc điều kiện; phần chi tiết thú cũng có giải thích nội tại.

Bản lưu 1.17.0 giữ nguyên định dạng đội hình, HP, khiên, che chắn, thời gian chờ và luồng ngẫu nhiên. Các nội tại mới áp dụng khi dùng chiêu; trận cũ chưa có đội hình riêng và bài giải cố định Võ đường/Thức tỉnh giữ luật cũ. Tất cả tài nguyên trò chơi có sẵn offline.


Kiểm tra 1.18.0: **306/306** bài kiểm tra luật chơi, gồm 23 bài mới cho nội tại và 283 hồi quy trước đó; **160/160 tình huống trình duyệt** đạt sau lần chạy đầy đủ và một lần chạy lại bài kiểm tra kéo đảo (lần đầu bỏ lỡ điểm chạm; bài kiểm tra không đổi). **60 khung hình** cho 4 vai trò ở 320×640, 390×844, 768×1024, 1440×1000 và 844×390. Android lint: 0 lỗi, 4 cảnh báo đã có; 99 tệp web trong APK khớp nguồn từng byte, chữ ký v2 và khóa ký giữ nguyên.

Trên giả lập Android 15 riêng, đã cài đè **1.17.0 → 1.18.0** khi offline với một trận 3v3 đang chơi: giữ nguyên thú, HP, khiên, che chắn, chờ chiêu, kỷ niệm và tài nguyên. Đã chạm Tiếp sức để mở chiêu hồi máu ở lượt kế tiếp, đối chiếu luật thật và xác nhận Dưỡng hộ tạo 5 khiên đúng người nhận. Back hủy xem trước không tiêu lượt; đóng cưỡng bức rồi mở lại giữ nguyên trận và khiên. SHA-256 gói đang cài khớp APK. **Chưa thử trên điện thoại thật.**

APK: `dist/DaoLinhThu-1.18.0.apk`. Mã nguồn: `dist/source-1.18.0.zip`. Báo cáo: `dist/BUILD-INFO-1.18.0.json`, `dist/ENGINE-1.18.0.tap`, `dist/BROWSER-RESULTS-1.18.0.json` (giữ cả báo cáo lần đầu và lần chạy lại), `dist/ROLES-VISUAL-1.18.0.json`, `dist/ANDROID-ROLES-1.18.0.json`, `dist/BUNDLE-CHECK-1.18.0.json`. Ảnh: `dist/screenshots/roles-*-1.18.0.png`. Các APK và mã nguồn trước được giữ nguyên.

## Chiến đấu đội hình 3v3 · 1.17.0

Trận mới trong thám hiểm, phế tích và luyện tập tự do có đội địch thường **3 thú**, mỗi thú hai bên có **máu, khiên và trạng thái gục riêng**. Thủ lĩnh và thủ vệ vẫn là một đối thủ lớn. Thú gục ngừng đánh và không dùng được chiêu; chiêu hồi phục không hồi sinh giữa trận. Thắng một phòng giúp những bạn đã gục hồi lại **25% sinh lực** trước chặng tiếp theo.

**Chạm đối thủ để chọn mục tiêu, chạm đồng đội để chọn người nhận hồi máu hoặc khiên.** Chưa chọn đồng đội thì ưu tiên bạn yếu máu theo tỷ lệ HP. Chiêu hỗ trợ tính phần trăm trên sinh lực tối đa của người nhận; khiên cá nhân bảo vệ đúng người đó. Thiêu đốt và hồi phục theo lượt giữ mục tiêu đã gắn, không tự nhảy sang thú khác khi mục tiêu gục. Đánh thường phân sức mạnh theo những thú còn đứng vững và chuyển mục tiêu khi địch gục giữa lượt. Hợp lực đánh lan đội địch, dùng đúng một lượt và 2 năng lượng. Chiêu riêng chỉ cho thú được chọn ra chiêu.

Trong **Đội hình & linh thú**, chọn hàng trước/sau trước khi khởi hành. Cần ít nhất một thú hàng trước. Hàng trước giảm 10% sát thương trực tiếp; hàng sau giảm 30% khi còn bạn hàng trước. Hộ vệ hàng trước dùng chiêu sẽ che đòn nhắm hàng sau trong lượt này và lượt sau. Xuyên giáp và đánh lan bỏ qua bảo vệ theo hàng. Đội hình đã chốt được lưu riêng trong chuyến đi; không đổi hàng giữa hành trình.

Địch hồi phục ưu tiên bạn dưới 70% máu; hộ vệ dựng khiên cho bạn dưới 65%. Chiêu hỗ trợ có thời gian chờ, địch đã gục không được hành động. Mỗi đối thủ có dự định hiển thị ngay dưới sàn và có thể điều chỉnh sau nước đi của bạn. Khi địch chỉ hồi máu hoặc tạo khiên, đội bạn không mất khiên và không nhận phản kích giả. Những cơ chế giáp, tụ phép, cuồng nộ, rễ hồi sinh, băng khóa năng lượng và lõi phượng hoàng vẫn hoạt động.

Sàn đấu hiện HP/khiên, hàng trước/sau, vòng chọn mục tiêu và số sát thương/hồi phục trên đúng thú. Thú gục mờ đi; màn đánh nhanh cũng khóa chiêu và làm mờ thú đó. Xem trước mô phỏng luật thật trên bản sao, có thể mở chi tiết sinh lực từng thú sau lượt. Các vùng chạm và hàng đội hình nằm trong màn game; giảm chuyển động vẫn giữ đầy đủ thông tin.

**Bản lưu đang có trận cũ tiếp tục đúng luật sinh lực chung cho đến hết trận đó.** Phòng tiếp theo hoặc chuyến mới tự khởi tạo sinh lực riêng từ HP hiện có. Không đặt lại thú, tài nguyên, bộ sưu tập hay tiến trình. Các bài thử thách cố định và thử thức tỉnh ở võ đường giữ luật đã cân bằng cho mục tiêu bài; luyện tập tự do dùng luật đội hình mới.

Kiểm tra: **283/283 luật chơi** gồm 242 hồi quy cho bản lưu cũ và 41 kiểm thử đội hình mới; **153/153 ca giao diện duy nhất**, tổng hợp lượt toàn bộ và các lượt kiểm tra lại cuối cùng. Bao phủ mục tiêu, gục/hồi phục, che chắn, AI hỗ trợ, dự báo, dòng RNG sau tải lại, boss, phần thưởng một lần, sắp hàng, đánh nhanh, offline và giữ trạng thái khi mở lại. Rà **28 khung hình** ở 320×640, 390×844, 768×1024, 1440×1000 và ngang 844×390; không tràn ngang hoặc lỗi JavaScript. APK có **98 tệp web khớp byte với nguồn**, cùng khóa ký 1.16.1; Android Lint **0 lỗi, 4 cảnh báo cũ**.

Trên giả lập **Android 15** riêng, không có mạng mặc định, cài đè **1.16.1 → 1.17.0** giữ nguyên trận đang chơi, thú, sổ kỷ niệm và tài nguyên. Trận cũ kết thúc rồi phòng kế tiếp mở 3v3; đã chạm chọn đối thủ/đồng đội, tung Hợp lực đúng 2 năng lượng/1 lượt, đối chiếu HP và hành động địch với luật thật. Back hủy xem trước và đóng sàn; các nút đổi hàng khóa khi đang đi. Đóng cưỡng bức rồi mở lại giữ nguyên HP/khiên từng thú. SHA-256 gói đang cài khớp APK phát hành. **Chưa thử trên điện thoại thật.**

APK: `dist/DaoLinhThu-1.17.0.apk`. Báo cáo: `dist/BUILD-INFO-1.17.0.json`, `dist/ENGINE-1.17.0.tap`, `dist/BROWSER-1.17.0.json`, `dist/SQUAD-VISUAL-1.17.0.json`, `dist/ANDROID-SQUAD-1.17.0.json`, `dist/BUNDLE-CHECK-1.17.0.json`. Ảnh: `dist/screenshots/squad-*-1.17.0.png`. Mã nguồn: `dist/source-1.17.0.zip`. Các APK và mã nguồn phiên bản trước được giữ riêng.

## Cả đội cùng ra chiêu · 1.16.1

**Hợp lực** cho toàn bộ thú có thật trong đội cùng ra chiêu, mỗi bạn có ánh sáng và luồng chiêu theo hệ riêng. Đánh thường, đỡ đòn và lấy đà cũng cho cả đội tham gia. Đội hai thú hiện đúng hai bạn; **chiêu riêng / tuyệt kỹ thức tỉnh** chỉ cho thú được chọn thực hiện. Nhãn chiêu, danh sách thú tham gia và phần xem trước giải thích rõ hai loại này. Sàn đấu, nút đánh nhanh và cảnh phát lại trên điện thoại dùng cùng quy tắc chọn thú ra đòn.

Quái thường trong thám hiểm xuất hiện thành nhóm **2 thú ở chặng đầu, 3 thú ở các chặng sau**; phế tích có nhóm 2–3 thú theo phòng và tầng. Các thành viên có loài khác nhau và giữ nguyên khi tải lại trận. Cả nhóm cùng phản công khi địch có đòn đánh. Thủ lĩnh cuối vùng, thủ vệ và đối thủ luyện tập vẫn có một đối thủ chính. Đội hình hai bên được giãn vị trí để nhìn rõ từng thú trên màn hình nhỏ.

**Hai bên dùng sinh lực chung theo đội.** Nhóm địch dùng sức mạnh và ý định chung của trận hiện có; chưa có HP hoặc AI độc lập cho từng con. Một lần Hợp lực vẫn là một lượt, dùng đúng 2 năng lượng; hoạt cảnh nhiều thú không nhân sát thương, chi phí hay phần thưởng. Bản lưu, nguồn ngẫu nhiên, đội hình đã chốt khi khởi hành và cơ chế chiến đấu được giữ nguyên. Bật giảm chuyển động vẫn có nhãn Hợp lực và kết quả đầy đủ.

Kiểm tra: **242/242 luật chơi, 93/93 kiểm thử giao diện chiến đấu** trong hai lượt không trùng nhau (69 kiểm thử chính, 24 kiểm thử bổ sung về boss, thức tỉnh và tạm dừng). Bao phủ đội 1/2/3 thú, chiêu riêng, Hợp lực ở thám hiểm/phế tích/thủ vệ, phản công, đánh nhanh/phát lại, xem trước, offline, giảm chuyển động và tải lại đúng lượt/năng lượng. Rà **24 khung hình** ở 320×640, 390×844, 768×1024 và 1440×1000; không có tràn ngang sàn đấu hoặc lỗi JavaScript. APK có **94 tệp web khớp byte với nguồn**, cùng khóa ký 1.16.0; Android Lint **0 lỗi, 4 cảnh báo cũ**.

Trên giả lập Android 15 riêng không có mạng mặc định, cài đè **1.16.0 → 1.16.1** giữ nguyên toàn bộ bản lưu, gồm trận đang chơi và sổ khoảnh khắc. Đã chạm dùng Hợp lực: đủ ba thú và ba luồng chiêu, địch phản công đủ ba thành viên; chỉ trừ 2 năng lượng và tăng một lượt. Back hủy bước xem trước mà không tiêu hao; đóng cưỡng bức rồi mở lại giữ đúng trận và nhóm địch. SHA-256 gói đang cài khớp APK phát hành. Kiểm thử có đóng hộp thoại System UI không phản hồi của giả lập trước khi xác nhận lại thao tác Back; ghi chú giữ riêng ở `dist/ANDROID-TEAM-AUDIT-NOTES-1.16.1.json`. **Chưa thử trên điện thoại thật.**

Báo cáo: `dist/BUILD-INFO-1.16.1.json`, `dist/ENGINE-1.16.1.tap`, `dist/BROWSER-TEAM-1.16.1.json`, `dist/BROWSER-TEAM-EXTRA-1.16.1.json`, `dist/TEAM-VISUAL-1.16.1.json`, `dist/ANDROID-TEAM-1.16.1.json`, `dist/BUNDLE-CHECK-1.16.1.json`. Ảnh: `dist/screenshots/team-*-1.16.1.png`. Mã nguồn: `dist/source-1.16.1.zip`. APK và mã nguồn 1.16.0 được giữ riêng.

## Sổ khoảnh khắc · 1.16.0

Chạm thú trên đảo → **Khám phá góc chơi**, hoặc vào **Linh thú / Xây đảo / Nhật ký → Sổ khoảnh khắc**. Chọn một thú đã sở hữu, xem gợi ý góc chơi và gắn bó cần có rồi bấm **Rủ chơi**. Mở cảnh gần ngay trong màn đảo; ngắm khoảng 2,4 giây rồi bấm **Ghi kỷ niệm**. Mỗi kỷ niệm mới cho tối đa +2 gắn bó, chặn ở 100. Xem lại không nhận lặp thưởng. Thú ngoài đội chiến đấu cũng có thể cùng chơi.

Có **18 loại hành vi, 554 kỷ niệm theo loài** cho 58 linh thú: ngủ dưới tán cây, chơi xích đu, ngửi hoa, thổi bong bóng hồ sen, đuổi đom đóm, tắm nắng và những hành vi riêng theo hệ. Hai thú khác hệ có thể hẹn nhau bên ghế và hoa; thú SSR có khoảnh khắc cực quang với cổng cổ và nấm trăng. Một số góc cần hai món cách nhau tối đa 2 ô, tính theo chân đồ sau khi xoay. Chỉ đồ đã đặt và **Lưu** mới mở hành vi; đồ trong kho hoặc bản nháp chưa lưu không tính. Kho đồ có gợi ý hành vi gắn với từng món.

Sổ có bộ lọc **Gợi ý mới / Đã khám phá / Tất cả**, tiến độ từng thú và toàn bộ bộ sưu tập. Sáu mốc 5 / 12 / 24 / 48 / 90 / 150 kỷ niệm tặng vé ấp, thức ăn, tinh thể và tinh hoa; mỗi mốc nhận một lần cho cả đảo. Kỷ niệm đã ghi vẫn còn khi thay đổi trang trí. Menu hoặc đưa app xuống nền tạm dừng thời gian quan sát; Back đóng góc chơi trước. Rời app khi chưa ghi không tạo kỷ niệm. Giảm chuyển động vẫn cho chơi và ghi bình thường.

Dữ liệu mới được lưu, xuất/nhập và khôi phục offline. Bản lưu cũ tự bổ sung sổ trống; dữ liệu sổ có sẵn nhưng hỏng bị từ chối. Không đổi đội, lượt đấu, sự kiện hoặc nguồn ngẫu nhiên của chuyến đang chơi. Hình vẽ, hoạt cảnh và sáu tệp mới được đóng gói trong APK/cache offline. APK và mã nguồn 1.15.1 được giữ riêng.

Kiểm tra: **239/239 luật chơi, 136/136 giao diện** trong lượt chạy toàn bộ; rà **13 khung hình/bố cục** từ 320×640 đến 1440×1000. Bao phủ đồ chưa lưu, khoảng cách sau khi xoay, khác loài/hệ/SSR, gắn bó chạm trần, bạn đồng hành ngoài đội, mốc quà nhận một lần, phát lại, Menu/Back/đưa xuống nền, giảm chuyển động và xuất/nhập offline. APK có **91 tệp web khớp byte với nguồn**, cùng khóa ký 1.15.1; Android Lint **0 lỗi, 4 cảnh báo cũ**.

Trên giả lập Android 15 riêng khi không có mạng mặc định, cài đè **1.15.1 → 1.16.0** giữ nguyên bản lưu và cuộc gặp phế tích/RNG. Đã ghi hai kỷ niệm bằng cảm ứng và nhận đúng +4 gắn bó; Back đóng Menu trước rồi góc chơi, Home dừng thời gian quan sát và tiếp tục cảnh khi mở lại, đóng cưỡng bức giữ kỷ niệm đã ghi. Phát lại không nhận thưởng lặp. SHA-256 gói đang cài khớp APK phát hành. **Chưa thử trên điện thoại thật.**

Báo cáo: `dist/BUILD-INFO-1.16.0.json`, `dist/ENGINE-1.16.0.tap`, `dist/BROWSER-1.16.0.json`, `dist/HABITAT-VISUAL-1.16.0.json`, `dist/ANDROID-HABITAT-1.16.0.json`, `dist/BUNDLE-CHECK-1.16.0.json`. Ảnh: `dist/screenshots/habitat-*-1.16.0.png`. Mã nguồn: `dist/source-1.16.0.zip`.

## Giao diện rõ hơn · 1.15.1

Nền trang nội dung chuyển sang xanh kem đặc, giảm cảm giác phủ sương. Chữ phụ, tab thám hiểm, chỉ số sinh lực/năng lượng, bụi cổ và mô tả lựa chọn được tăng tương phản. Tab đang chọn dùng xanh đậm, mốc tầng hiện tại có vòng vàng; thanh sinh lực và ô năng lượng có màu rõ hơn. Giữ hiệu ứng cảnh đảo, minh họa và trạng thái nút chưa đủ điều kiện. Bản lưu và luật chơi giữ nguyên.

## Chỉnh đảo tự do · 1.15.0

Nút **Chỉnh đảo** nằm ngay trong cảnh, hoặc vào **Xây đảo → Trang trí đảo theo ý bạn**. Kéo công trình/đồ đã đặt để dời, chạm **Kho đồ** để chọn món mới rồi chạm ô trên bãi cỏ để đặt. Có lưới 9×7, vùng đặt xanh/đỏ, xoay, cất, hoàn tác/làm lại 30 bước. Vuốt nền để nhìn quanh, hai ngón hoặc nút Phóng/Thu để đổi góc nhìn; nút Toàn đảo đưa khung nhìn về vừa cảnh. Trên máy tính có thể Tab chọn đồ, Enter/Space chọn và dùng phím mũi tên để dời từng ô.

Có **15 loại trang trí** vẽ riêng: cây tán tròn, anh đào, dừa biển, hoa mật, đá rêu, lối gạch mật ong, đá bước, hàng rào, đèn đom đóm, ghế lá, xích đu mây, hồ sen, nấm trăng, tượng Thủ vệ và cổng đá cổ. Nấm trăng mở ở cấp đảo 3, tượng khi thắng một bậc Thủ vệ bất kỳ, cổng khi vượt tầng 5 phế tích. Các món có sẵn với số lượng giới hạn; không dùng tài nguyên hoặc thêm giao dịch. Công trình xây mới xuất hiện trong Kho đồ để tự đặt lên đảo.

Chỉ **Lưu** mới giữ bố cục; Back hoặc chọn màn khác từ Menu hỏi trước khi bỏ bản nháp đã thay đổi. Cất công trình trả mô hình về kho và vẫn giữ sản xuất. Đường đi nằm bên dưới đồ vật; đồ cùng lớp không đặt chồng và toàn bộ chân đồ phải nằm trong bãi cỏ. Nhãn công trình đi theo vị trí mới; thú tìm chỗ trống gần đó khi một nhãn chiếm chỗ đứng cũ. Bố cục đã lưu được xuất/nhập cùng tiến trình, chơi offline và khôi phục khi mở lại. Bản lưu cũ tự có bố cục mặc định, không đổi tài nguyên, thú, đội hình, lượt đấu, sự kiện hay RNG của chuyến đang chơi.

Kiểm tra: **226/226 luật chơi**, **129/129 giao diện** trong lượt toàn bộ và **7/7 kiểm tra riêng chỉnh đảo** sau sửa trường hợp khôi phục bản lưu khi còn bản nháp. Đã thử kéo/hủy bằng cảm ứng, đặt sai ô, xoay/cất/hoàn tác, phóng hai ngón, Back/Menu, lưu và xuất/nhập offline. Rà 28 ảnh ở 7 kích thước từ 320×640 đến 1440×1000, thêm kiểm tra bố cục ngang 844×390 trong kiểm thử giao diện. APK có 84 tệp web khớp nguồn, cùng khóa ký bản 1.14.0, Android Lint 0 lỗi và 4 cảnh báo cũ.

Trên giả lập Android 15 riêng, cài đè **1.14.0 → 1.15.0** giữ bản lưu cũ và tự thêm bố cục. Đã thử kéo đồ bằng cảm ứng, hủy kéo, chỉ lưu khi bấm Lưu, Back cảnh báo bỏ bản nháp, Home giữ bản nháp, đóng cưỡng bức rồi mở lại giữ bố cục đã lưu, và chơi hoàn toàn offline. SHA-256 APK đang cài khớp tệp phát hành. **Chưa thử trên điện thoại thật.** Báo cáo Android: `dist/ANDROID-ISLAND-LAYOUT-1.15.0.json`.

Báo cáo: `dist/BUILD-INFO-1.15.0.json`, `dist/BUNDLE-CHECK-1.15.0.json`, `dist/ENGINE-1.15.0.tap`, `dist/BROWSER-1.15.0.json`, `dist/BROWSER-LAYOUT-1.15.0.json`, `dist/ISLAND-LAYOUT-VISUAL-1.15.0.json`. Mã nguồn: `dist/source-1.15.0.zip`.

## Bạn nhỏ sống trên đảo · 1.14.0

Ba linh thú trong đội tự dạo quanh bãi cỏ, ngửi ngó, chơi và ngủ. Có bốn nhịp chuyển động theo hình thể: chạy lon ton, nhảy, đi lắc lư và lượn; Cáo Mầm, Kỳ Nhông Mây và Chim Than Hồng có nhịp riêng ngay từ đầu. Đường đi tránh các nút trong cảnh và bạn khác. Đi lại chỉ thay hình ảnh, không dùng nguồn ngẫu nhiên hay sửa đội hình của chuyến thám hiểm.

Chạm vào thú mở bong bóng chăm sóc ngay trên đảo. **Vuốt ve** cho phản ứng và tối đa +1 gắn bó mỗi 5 phút, 3 lần mỗi ngày cho từng thú; hết lượt vẫn vuốt ve được. Gắn bó dùng chỉ số hiện có, tối đa 100. **Cho ăn** dùng đúng chi phí, XP, gắn bó và tiến trình nhiệm vụ của cơ chế cũ. Có thể chạm nút hoặc giữ quả mọng kéo đến thú khác; thả hụt và hủy thao tác không mất thức ăn. **Xem thú** mở đầy đủ chi tiết, kỹ năng và tiến hóa như trước.

Khi chăm sóc, các bạn đứng lại để dễ chạm. Back hoặc Escape đóng bong bóng trước; mở Menu/hộp thoại hoặc đưa app xuống nền tạm dừng hoạt cảnh. Tắt Chuyển động hoặc bật giảm chuyển động của hệ thống giữ thú đứng yên và vẫn chăm sóc được. Dữ liệu vuốt ve chỉ được thêm vào từng thú khi có thưởng; bản lưu cũ tiếp tục dùng được và chuyến đang chơi giữ nguyên lượt, đội, sự kiện và nguồn ngẫu nhiên. Toàn bộ hình vẽ và mã được đóng gói offline, giữ bố cục nút trong cảnh của 1.13.1.

Bản 1.14.0 đạt **218/218 kiểm thử luật chơi và 122/122 kiểm thử giao diện trong một lượt toàn bộ**. Rà 14 bố cục/ảnh ở 7 kích thước từ 320×640 đến 1440×1000, gồm các nút chăm sóc có vùng chạm ít nhất 44 px; lấy 60 mẫu khi đảo đang chuyển động ở mỗi kích thước. Thao tác kéo quả được kiểm tra bằng sự kiện chạm thật của trình duyệt, gồm thả hụt và hủy. APK có **79 tệp web khớp byte với nguồn**, chữ ký v2 cùng khóa 1.13.1, Android Lint **0 lỗi và 4 cảnh báo cũ**.

Trên giả lập Android 15 riêng, cài đè 1.13.1 → 1.14.0 giữ nguyên bản lưu và cuộc gặp phế tích chưa chọn khi offline. Đã kiểm tra vuốt ve lưu gắn bó, giới hạn qua lần mở lại, kéo quả chạm sang thú khác chỉ tính một bữa, Back đóng chăm sóc/Menu trước, Home tạm dừng rồi tiếp tục, đóng cưỡng bức giữ nguyên tiến trình, và tắt chuyển động. SHA-256 APK đang cài khớp tệp phát hành. **Chưa thử trên điện thoại thật.**

Báo cáo: `dist/BUILD-INFO-1.14.0.json`, `dist/BUNDLE-CHECK-1.14.0.json`, `dist/ENGINE-1.14.0.tap`, `dist/BROWSER-1.14.0.json`, `dist/ISLAND-LIFE-VISUAL-1.14.0.json`, `dist/ANDROID-ISLAND-LIFE-1.14.0.json`. Ảnh ở `dist/screenshots/island-*-1.14.0.png`; mã nguồn ở `dist/source-1.14.0.zip`.

## Nút trong màn chơi · 1.13.1

Thanh điều hướng ngang dưới cùng đã được bỏ. Bốn biểu tượng **Ấp trứng, Linh thú, Xây đảo, Nhật ký** nằm hai bên cảnh đảo; **Thám hiểm** vẫn là nút khởi hành trong cảnh. Góc trên có **Menu** mở bảng sáu chức năng ở giữa màn hình, đánh dấu nơi đang xem. **Cài đặt**, âm thanh, chuyển động và nhập/xuất bản lưu nằm trong bảng này. Chọn nơi đến sẽ đóng bảng; Back, Escape, nút đóng hoặc chạm nền cũng đóng bảng trước khi rời màn chơi. Các màn nội dung dùng toàn bộ khoảng trống phía dưới, không còn thanh nút che thao tác.

Bố cục được rà ở 320×640 đến 1440×1000, kiểm tra cả phần nhãn dưới biểu tượng, các nút trong bảng và màn hình ngang thấp. Menu tiếp tục dùng được offline; mở/đóng/chuyển màn giữ nguyên cuộc gặp phế tích chưa chọn, tài nguyên và nguồn ngẫu nhiên. Bản cập nhật chỉ đổi giao diện, không thay luật chơi hay định dạng bản lưu. APK, nguồn và báo cáo 1.13.0 được giữ riêng.

Bản 1.13.1 đạt **210 kiểm thử luật chơi và 116 kiểm thử giao diện**. Lượt toàn bộ đạt 114/116; hai kiểm thử còn tìm thanh điều hướng đã bỏ được đổi sang nút trong cảnh/Menu, rồi chạy lại cả 9 kiểm thử sảnh/điều hướng liên quan đều đạt. Báo cáo tổng hợp giữ kết quả mới nhất của từng kiểm thử và dẫn về hai báo cáo gốc; không thay mã sản phẩm sau lượt toàn bộ. Có thêm 14 ảnh/bố cục sảnh và Menu đã xác nhận nút/nhãn bấm được, không tràn màn hình. APK có **76 tệp web khớp byte với nguồn**, chữ ký v2 cùng khóa 1.13.0, Android Lint **0 lỗi và 4 cảnh báo cũ**.

Trên giả lập Android 15 riêng, cài đè 1.13.0 → 1.13.1 giữ nguyên thú, tài nguyên, cuộc gặp phế tích chưa chọn và nguồn ngẫu nhiên. Khi Wi-Fi/dữ liệu tắt và không có mạng mặc định, đã mở đủ sáu mục Menu, bốn lối tắt trong cảnh đảo, Cài đặt/bản lưu; kiểm tra nhãn ở chiều rộng WebView 320 px, Back đóng Menu trước rồi về đảo, Home/tiếp tục và đóng cưỡng bức vẫn giữ chuyến đi. Tình huống sự kiện chỉ được nhập qua giao diện trong giả lập kiểm thử. SHA-256 APK đang cài khớp tệp phát hành. **Chưa thử trên điện thoại thật.**

Báo cáo: `dist/BUILD-INFO-1.13.1.json`, `dist/BUNDLE-CHECK-1.13.1.json`, `dist/ENGINE-1.13.1.tap`, `dist/BROWSER-1.13.1.json`, `dist/BROWSER-INITIAL-1.13.1.json`, `dist/IN-WORLD-FINAL-NAVIGATION-1.13.1.json`, `dist/IN-WORLD-VISUAL-1.13.1.json`, `dist/ANDROID-IN-WORLD-SMOKE-1.13.1.json`. Ảnh ở `dist/screenshots/in-world-*-1.13.1.png`, nguồn đóng gói ở `dist/source-1.13.1.zip`.

## Chuyến rẽ nhánh · 1.13.0

Vào **Thám hiểm → Phế Tích Cổ → Chuyến rẽ nhánh · 10 điểm**. Mở ở cấp đảo 2, dùng 12 quả mọng và kết thúc sau 10 điểm dừng trong khu đã chọn. Hành trình dài 50 tầng vẫn có nút riêng; bản đang chơi tiếp tục đúng luật và trạng thái cũ.

- **Bản đồ có đường nối:** 26 điểm trên 10 hàng, chia thành hai cửa 5 điểm. Mỗi hàng thường có ba hướng; từ hướng ngoài chỉ sang hướng kề, từ hướng giữa có thể đi cả ba. Thủ vệ đứng ở điểm 5 và 10. Có thể nhìn trước các loại phòng trong cửa hiện tại, theo dõi đường đã đi và mở lại bản đồ trong trận. Toàn bộ bản đồ và loại cuộc gặp được xác định bởi hạt giống khởi hành; xem bản đồ không đổi nguồn ngẫu nhiên.
- **Bốn cuộc gặp và một trạm nghỉ:** cứu bạn nhỏ bằng 16 quả mọng để nhận phép hồi phục, hoặc mất 12% sinh lực tối đa lấy bụi/vàng; rương phong ấn cho 24 bụi, 120 vàng và một phép nhưng thêm lời nguyền; bệ đá đổi 20% sinh lực tối đa lấy phép chiến thuật, hoặc hồi phục/tích năng lượng; người lữ hành bán bình 90 vàng hoặc trà hồi 40% với 60 vàng; trạm nghỉ hồi 45% và thêm 1 năng lượng, hoặc thêm một bình sương. Luôn có lựa chọn miễn phí an toàn, cho xem phép cụ thể và lượng sinh lực trước khi chốt. Chỉ được chọn một lần; không thể hiến đến gục hoặc mua vượt túi bình. Mỗi lời nguyền tăng 15% sát thương địch đến hết chuyến, tối đa 3.
- **Hai tinh anh có điểm yếu:** Vệ Binh Gương Rêu mang 30 khiên, hai lượt giáp chặn 50% và phản 14; đỡ hoàn hảo phá hết khiên, Hợp lực/xuyên giáp/chiêu công kích hoàn hảo vượt giáp. Tư Tế Sao Lạc tụ phép rồi tung chú mạnh ×2,4; ngắt phép thưởng 1 năng lượng và 12 khiên. Tinh anh mạnh hơn 30%, thưởng thêm 75% bụi và được đổi bộ chọn phép một lần.
- **Ba bộ chiến thuật, sáu phước lành:** Hỏa triều tăng thiêu đốt mới 35% mỗi bậc và hồi 3 sinh lực mỗi bậc khi đốt gây sát thương; Gương thành phản 35% sát thương bị khiên chặn mỗi bậc và hồi 6 khi chiêu riêng tạo được khiên; Liên tinh tăng 20% sát thương combo và thêm 8 khiên mỗi bậc, ghép với hoàn 1 năng lượng mỗi combo. Hai mảnh ghép mỗi bộ hiện trong túi chiến thuật; màn chọn phép ưu tiên một mảnh còn dùng được. Đây là hiệu ứng của từng phép, không có thưởng bộ ẩn.

Sức mạnh và di vật được chốt khi khởi hành; kỹ năng gốc, nhánh luyện, trang bị, nhịp, thế trận và tuyệt kỹ thức tỉnh vẫn dùng được. Mỗi trận mới đặt lại lần dùng tuyệt kỹ. Các khu sau được cân bằng cho chuyến bắt đầu không có phép, thay vì giả định đã tích phép từ 40 tầng trước. Vượt khu mở điểm khởi hành kế tiếp và rương mốc; tầng thủ vệ vẫn nhận Mảnh cổ linh đúng nguồn. Cuộc gặp/trạm nghỉ không trao nguyên liệu thức tỉnh hoặc phép sau chiến đấu. Bụi và tài nguyên thưởng được cất ngay; chi phí cuộc gặp trừ vào kho thật, các số tổng chiến lợi phẩm ghi lượng đã kiếm. Thua hoặc trở về giữ phần đã kiếm sau khi thanh toán các chi phí đã chọn.

Lựa chọn phòng, sự kiện, phép, lời nguyền, trạng thái tinh anh, lần dùng tuyệt kỹ và nguồn ngẫu nhiên được lưu từng bước. Bản lưu cũ không được thêm một chuyến rẽ nhánh giả; trường bản đồ có sẵn nhưng sai bị từ chối. Khóa lưu và định dạng phiên bản 1 giữ nguyên. Hai module mới và CSS được đóng gói/cache offline. Không thay tài khoản, không chạm bản lưu của người dùng trong quá trình kiểm thử.

Bản 1.13.0 qua **210 kiểm thử luật chơi và 113 kiểm thử giao diện**. Kiểm tra tất cả lựa chọn sự kiện, chi phí và thưởng một lần, ba bộ phép, hai tinh anh, lời nguyền, đường nối, cả năm khu và thắng đủ 10 điểm. Xem trước khớp lượt thật; tải lại giữ đúng đường đã chọn, cuộc gặp và tuyệt kỹ đã dùng. Bao phủ bản lưu 50 tầng cũ, dữ liệu hỏng, màn hình 320–1440 px, thao tác chạm, giảm chuyển động và cache offline.

APK có **75 tệp web khớp byte với nguồn**, chữ ký v2 cùng khóa 1.12.0; Android Lint **0 lỗi, 4 cảnh báo cũ**. Báo cáo luật chơi, trình duyệt, hình ảnh và gói cài ở `dist/ENGINE-1.13.0.tap`, `dist/BROWSER-1.13.0.json`, `dist/ROUTE-VISUAL-1.13.0.json` và `dist/BUNDLE-CHECK-1.13.0.json`.

Trên giả lập Android 15 riêng khi Wi-Fi/dữ liệu tắt và không có mạng mặc định, đã cài đè 1.12.0 → 1.13.0, giữ đúng bộ sưu tập có thú thức tỉnh và trận 50 tầng đang chơi. Sau đó đi hết 10 điểm bằng nút giao diện: mở rương lấy lời nguyền, ghé trạm nghỉ/bệ đá, ngắt phép Tư Tế Sao Lạc, đỡ hoàn hảo phá khiên Gương Rêu và dùng tuyệt kỹ thức tỉnh. Từng nước đi được đối chiếu với xem trước và luật chơi cùng trạng thái ngẫu nhiên. Đóng cưỡng bức giữ nguyên cuộc gặp chưa chọn, dấu dùng tuyệt kỹ, chiến thắng và 7 Mảnh cổ linh từ hai thủ vệ. Khu bắt đầu tầng 11 mở đúng, chuyến mới không còn lời nguyền; Back, Home, đưa app lên lại và đóng cưỡng bức giữ nguyên chuyến. Tình huống khởi đầu chỉ được nhập bằng giao diện vào giả lập kiểm thử riêng. **Chưa thử trên điện thoại thật.**

Kiểm tra Android được hoàn tất qua pha hành trình và pha vòng đời ứng dụng. Hộp thoại ANR của System UI trong giả lập được đóng trước khi kiểm tra lại; bước Home dùng trạng thái Activity Android vì khung hình của WebView tạm dừng khi chạy nền. Chi tiết và bản lưu kiểm chứng nằm trong `dist/ANDROID-ROUTE-SMOKE-1.13.0.json`, `dist/ANDROID-ROUTE-AUDIT-NOTES-1.13.0.json` và `dist/route-native-*.json`; ảnh ở `dist/screenshots/route-*-1.13.0.png`. Thông tin gói cuối ở `dist/BUILD-INFO-1.13.0.json`, nguồn ở `dist/source-1.13.0.zip`. APK, nguồn và báo cáo 1.12.0 vẫn được giữ riêng.

## Thức tỉnh linh thú · 1.12.0

Vào **Thức tỉnh** trên đảo, **Linh thú → Đền Thức tỉnh**, hoặc mở đền ngay từ chi tiết một thú có dạng mới. Có thể ngắm trước cả sáu hình hài, kể cả khi chưa sở hữu. Dạng mới có màu, sừng, mang, cánh, đuôi và hoa văn riêng, dùng cùng hệ tô khối SVG 2.5D trong bộ sưu tập, chi tiết, đội hình, đảo và chiến đấu.

| Linh thú | Hình hài thức tỉnh | Tuyệt kỹ mới |
| --- | --- | --- |
| Cáo Mầm | Cáo Linh Đại Ngàn | Đại ngàn cộng sinh: hồi máu, khiên, hồi phục 3 lượt; nối chiêu được hồi thêm |
| Kỳ Nhông Mây | Kỳ Nhông Thiên Thủy | Thiên hà tịnh thủy: hồi máu, khiên, tan băng và hoàn 1 năng lượng |
| Chim Than Hồng | Hỏa Điểu Xích Vũ | Xích vũ bùng cháy: kích nổ thiêu đốt còn lại rồi áp lửa 3 lượt mới |
| Cửu Vĩ Ánh Dương | Cửu Vĩ Thái Dương | Cửu nhật liên hoàn: dồn sát thương xuyên khiên, mạnh thêm khi nối chiêu |
| Phượng Bình Minh | Phượng Hoàng Thiên Dương | Bình minh bất diệt: công kích, đốt và hồi máu; hồi thêm khi sinh lực không quá 40% |
| Long Thần Hư Không | Long Đế Tinh Uyên | Phán quyết hư không: phá khiên, ngắt phép/bão dù không đúng nhịp, suy yếu 3 lượt |

Thú cần **cấp 30, tiến hóa 3 sao** và vượt thử thách riêng. Mỗi thử thách có ba mục tiêu, phải đạt đủ trong cùng một lần thắng: nối combo, dùng chiêu của chính thú đó, giữ sinh lực, đỡ hoàn hảo, xuyên giáp, ngắt bão hoặc phá lõi đúng hạn. Dùng đội cho mượn với sức mạnh cố định; thú chính giữ nhánh đã luyện. Miễn phí thử lại, lưu sau từng lượt và có báo cáo. Thử thách không trao sao Võ đường hay chuyển tài nguyên, trang bị, XP hoặc tiến trình từ bản sao luyện tập vào đảo thật.

Lễ vật kiếm trong các hoạt động hiện có:

- **Ấn thủ vệ:** mỗi lần thắng một thủ vệ thật nhận **1 + bậc boss**; bậc 1 được 2 ấn. Thua hoặc rút lui không nhận.
- **Mảnh cổ linh:** vượt tầng boss 5, 10, 15… trong Phế Tích Cổ nhận **2 + số tầng / 5**, tương ứng 3, 4, 5… mảnh. Được cất ngay sau khi thắng, vẫn giữ nếu rời phế tích. Tầng thường và suối không trao.
- Ba thú khởi đầu dùng **1.800 vàng, 16 tinh hoa, 6 ấn, 9 mảnh** mỗi thú. Ba thú SSR dùng **3.000 vàng, 24 tinh hoa, 10 ấn, 15 mảnh** mỗi thú. Giao diện hiển thị số đang có, số cần và đường đến hoạt động kiếm nguyên liệu.

Thức tỉnh mở vĩnh viễn hình hài mới, **+15% sức mạnh** và thêm một tuyệt kỹ độc lập với chiêu gốc/hai nhánh kỹ năng. Tuyệt kỹ tốn **3 năng lượng, mỗi thú dùng 1 lần mỗi trận**; dùng lại được ở trận hoặc tầng mới. Giữ dấu nối chiêu, phối vai trò, trang bị, thế trận và nhịp chiến đấu. Chiêu hỗ trợ không tiêu Lấy đà/Phản kích và không nhắm rễ/lõi. Hiệu ứng xem trước chạy bằng đúng luật chiến đấu trên bản sao.

Kết thúc hành trình thật và buổi tập đang mở trước khi bấm Thức tỉnh. Bản chụp đội đang chiến đấu giữ nguyên hình hài và kỹ năng khi khởi hành. Bản cũ chỉ thêm trường thức tỉnh còn thiếu; dữ liệu có sẵn nhưng sai bị từ chối. Khóa lưu và phong bì phiên bản 1 giữ nguyên. Bốn module mới cùng CSS được đóng gói và cache offline.

Bản 1.12.0 qua **195 kiểm thử luật chơi và 105 kiểm thử giao diện**. Bao phủ sáu thử thách đủ mục tiêu, điều kiện/chi phí và thanh toán một lần, sáu tuyệt kỹ trong cả ba chế độ, xem trước khớp lượt thật, hiệu ứng và kỹ năng gốc/nhánh, nhận nguyên liệu đúng nguồn, bản lưu cũ, tiếp tục giữa trận và cache offline. Giao diện được kiểm tra từ 320–1440 px; sáu hình hài mới có đường vẽ hợp lệ, nằm trong khung và hỗ trợ giảm chuyển động.

APK có **72 tệp web khớp byte với nguồn**, chữ ký v2 cùng khóa 1.11.1; Android Lint **0 lỗi, 4 cảnh báo cũ**. Trên giả lập Android 15 riêng khi Wi-Fi/dữ liệu tắt và không có mạng mặc định, đã cài đè 1.11.1 → 1.12.0, giữ nguyên bộ sưu tập và trận thật đang chơi, tiếp tục thử thách sau khi đóng cưỡng bức, thắng 3 trận thủ vệ và vượt 15 tầng phế tích qua nút giao diện để kiếm 6 ấn/12 mảnh, thức tỉnh Cáo Mầm rồi dùng tuyệt kỹ. Đóng cưỡng bức giữ đúng hình hài, tài nguyên và dấu đã dùng tuyệt kỹ. Bản APK cuối được cài lại và đối chiếu SHA-256; kiểm tra nút sảnh tại 320/432 px, cả sáu hình hài và tiếp tục bản lưu. Bản đóng gói cuối chỉ đổi CSS bố cục sảnh so với bản đã kiểm tra toàn bộ luồng Android; mọi module luật chơi khớp byte. Dữ liệu kiểm thử chỉ nằm trong giả lập riêng. **Chưa thử trên điện thoại thật.**

Báo cáo: `dist/BUILD-INFO-1.12.0.json`, `dist/BUNDLE-CHECK-1.12.0.json`, `dist/ENGINE-1.12.0.tap`, `dist/BROWSER-1.12.0.json`, `dist/ANDROID-AWAKENING-SMOKE-1.12.0.json` và `dist/AWAKENING-REPACK-CHECK-1.12.0.json`. Ảnh sáu dạng: `dist/awakening-forms.png`; ảnh điện thoại và Android trong `dist/awakening-*.png` và `dist/screenshots/awakening-native-*`. Nguồn đóng gói ở `dist/source-1.12.0.zip`; APK, nguồn và báo cáo 1.11.1 vẫn được giữ riêng.

## Gương mặt riêng cho 58 loài · 1.11.1

Mỗi linh thú có chân dung riêng theo giải phẫu và tính cách: mắt tròn, mắt hạnh nhân, mí ngái ngủ, nháy mắt hoặc cười híp; mõm cáo, ria mèo, răng thỏ, mỏ chim, nanh rồng và mắt nhìn nghiêng cho cá/rùa/cá voi. Các biến thể cùng loài khác độ mở mắt, khoảng cách mắt, màu tròng, con ngươi và dấu má. Thú SSR có đường mắt, hoa văn và màu ngọc riêng; Miêu Nhật Thực và Long Thần Hư Không có hai màu mắt.

Hình mới dùng chung ở đảo, sổ linh thú, chi tiết, ấp trứng, đội hình, chiến đấu và Võ đường. Giữ chất liệu SVG tô khối 2.5D, chuyển động chớp mắt có cả con ngươi và tia sáng, hỗ trợ giảm chuyển động. Toàn bộ hình và module chân dung được đóng gói/cache offline. Cập nhật chỉ thay ngoại hình, không thay chỉ số, luật chơi hoặc định dạng bản lưu.

Bản 1.11.1 qua **170 kiểm thử luật chơi và 92 kiểm thử giao diện**. Kiểm tra đủ 58 hình SVG, không lỗi đường vẽ, không tràn khung hoặc trùng ID, mọi gradient và vùng cắt mắt đều nằm trong đúng hình; đồng thời kiểm tra thao tác ngắm thú, cảm ứng, giảm chuyển động và tải lại offline. Đã xem ảnh tổng hợp 58 loài, ảnh chân dung lớn và ảnh chi tiết trên Android.

APK có **67 tệp web khớp byte với nguồn**, chữ ký v2 cùng khóa 1.11.0; Android Lint **0 lỗi, 4 cảnh báo cũ**. Trên giả lập Android 15 riêng đã tạo bộ sưu tập đủ 58 loài và trận Cổ Mộc đang chơi, cài đè 1.11.0 → 1.11.1, xác nhận toàn bộ tiến trình giữ nguyên, hiển thị mặt mới ở chi tiết/chiến đấu và force-stop mở lại khi không có mạng. Dữ liệu kiểm thử chỉ nằm trong giả lập riêng, không chạm bản lưu trình duyệt hoặc điện thoại của người dùng. Chưa thử điện thoại thật.

Báo cáo: `dist/BUILD-INFO.json`, `dist/BUNDLE-CHECK.json`, `dist/ENGINE-1.11.1.tap`, `dist/BROWSER-1.11.1.json`, `dist/ANDROID-FACES-SMOKE-1.11.1.json`, `dist/FACES-AFTER-VISUAL.json`. Ảnh so sánh trong `dist/screenshots/faces-before-*` và `faces-after-*`; ảnh Android trong `faces-native-*-1.11.1.png`. Bản 1.11.0 được giữ trong APK cũ, `dist/source-1.11.0.zip` và hai báo cáo có hậu tố `-1.11.0.json`.

## Võ đường linh thú · 1.11.0

Vào **Võ đường** trên đảo, hoặc **Thám hiểm → Võ đường**. Hoạt động mở ngay từ đầu, miễn phí và không có giới hạn theo ngày.

- **Phòng luyện tập:** dùng đội, sức mạnh và trang bị thật trên bản chụp riêng. Chọn một trong 7 đối thủ: bia thường, giáp phản đòn, pháp sư, cuồng nộ hoặc một trong ba thủ vệ bậc 1. Có thể thử miễn phí hai nhánh của từng thú ở bậc 3, kể cả khi thú thật chưa mở nhánh. Lựa chọn không thay cấp, nhánh hoặc trang bị của thú thật. Nếu không đổi lựa chọn, giữ kỹ năng đang dùng.
- **8 ải chiến thuật, 24 sao:** mỗi ải có đội cho mượn và sức mạnh cố định. Thắng ải trước mở ải sau. Các bài gồm phản kích, xuyên giáp, ngắt phép, combo ba thú, đội N/R, chặt rễ, ngắt bão và phá lõi trước khi hết lượt 6. Mỗi ải có sao thắng và hai mục tiêu phụ; chỉ ghi sao sau chiến thắng. Sao từng mục tiêu tích lũy qua các lần thắng, không bị mất nếu lần sau đánh kém hơn.
- **Báo cáo:** lượt đấu, sát thương, đòn mạnh nhất, sát thương nhận, đỡ hoàn hảo, combo, ngắt phép/bão, sinh lực cuối và chiêu riêng của từng thú. Tổng sát thương gồm lõi và phản đòn; chiêu riêng loại lượt thiêu đốt có từ trước và phản đòn. Các số có thể bao gồm sát thương vượt lượng HP còn lại.
- **Thưởng một lần:** thắng mỗi ải lần đầu nhận 1 vé + 200–480 vàng. Mốc 3/6/12/18/24 sao có thưởng riêng, mỗi mốc nhận đúng một lần. 6 sao mở danh hiệu Người đọc nhịp, 12 sao mở hào quang ngọc, 18 sao mở bia chiến công trên đảo và 24 sao mở danh hiệu Bậc thầy chiến thuật. Món trang trí có thể bật/tắt trong Quà sao và không tăng chỉ số.

Buổi tập/ải lưu sau từng lượt, kể cả đội cho mượn, nhánh thử, trạng thái chiến đấu, mục tiêu và nguồn ngẫu nhiên. Rời sàn hay đóng app để tiếp tục sau; **Kết thúc & xem báo cáo** dừng hẳn buổi tập mà không ghi sao. Giới hạn 60 lượt/trận. Hủy canh nhịp hoặc bấm Back trước khi chốt không tiêu lượt.

Mọi lượt tập chạy bằng luật chiến đấu thật trên bản sao độc lập. Vàng, nguyên liệu, trang bị rơi ra, XP và tiến trình boss/phế tích bên trong bản sao không chuyển ra ngoài. Có thể tập trong khi vẫn giữ một hành trình thật đang chơi. Chỉ thưởng lần đầu và mốc sao quy định ở trên được cấp vào tài nguyên thật. Xem trước cũng chạy trên bản sao và không tiêu nguồn ngẫu nhiên hay ghi sao.

Khóa lưu `spirit-isles-save-v1` và định dạng 1 giữ nguyên. Bản cũ chỉ được bổ sung trường `dojo` khi chưa có; dữ liệu Võ đường có sẵn nhưng sai bị từ chối. Bản chụp không được chứa Võ đường lồng nhau. Tệp CSS và bốn module mới được lưu cache và đóng gói để chơi offline.

## Nhánh kỹ năng & bộ trang bị · 1.10.0



Vào **Linh thú → chọn một thú → Luyện kỹ năng**. Mỗi loài trong cả 58 loài có hai nhánh, giữ bộ chiêu riêng và năng lượng/thời gian chờ của loài đó:



- Công kích có thiêu đốt: **Hỏa tâm** tăng đốt, giảm nhẹ sát thương trực tiếp; **Phá giáp** bỏ đốt để xuyên khiên và giảm đòn địch, bậc 3 phá hết khiên.

- Công kích khác: **Bùng lực** tăng sát thương trực tiếp; **Hút sinh lực** giảm sát thương để hồi sinh lực đội.

- Hồi phục: **Mạch sống** tăng hồi ngay và hồi theo lượt; **Bảo hộ** trở thành vai trò Hộ vệ, tạo khiên và hồi nhẹ, không gây sát thương trực tiếp.

- Hộ vệ: **Thành lũy** bỏ sát thương/phản đòn để tạo khiên lớn; **Gai phản đòn** giảm khiên, tăng phản đòn trong 3 lượt.

- Hỗ trợ: **Tiếp sức** hoàn năng lượng và tăng lực, không đánh hay đốt; **Khống chế** gây sát thương và giảm đòn địch trong 3 lượt.



Bậc 1 mở ở cấp thú 5 với **150 vàng + 2 tinh hoa**; bậc 2 ở cấp 10 với **350 vàng + 5 tinh hoa**; bậc 3 ở cấp 15 với **700 vàng + 9 tinh hoa**. Sau khi mở lần đầu, đổi nhánh hoặc dùng chiêu gốc miễn phí, giữ bậc luyện. Hai nhánh dùng chung bậc; các thẻ cho xem hiệu ứng ở bậc hiện tại trước khi chọn. Cần kết thúc mọi chuyến đi để đổi/nâng kỹ năng, giống khóa đội và trang bị.



Trong **Xưởng → Trang bị**, đeo cả hai món trên cùng một thú để kích hoạt:



| Bộ | Hai món | Hiệu ứng |

|---|---|---|

| Vĩnh Đông | Bùa Nanh Băng + Thạch Vĩnh Đông | Nếu thú mang bộ ở trong đội, đỡ hoàn hảo một đòn địch tạo khiên bằng 10% HP tối đa **sau** đòn đó. Không kích hoạt khi địch mất lượt/đang tụ sức/hồi máu; nhiều bộ không cộng dồn. |

| Vũ Hỏa | Vòng Vũ Hỏa + Thạch Tái Sinh | Thiêu đốt mới từ chiêu hoặc nối chiêu của chính thú mang bộ mạnh hơn 35%. Không tăng đòn trực tiếp hay đốt do thú khác tạo. |



Chỉ số của từng món vẫn có tác dụng khi chưa đủ bộ. Khiên chung giới hạn 60% sinh lực tối đa; Vĩnh Đông tuân theo cả khiên phế tích đang có. Bộ đồ, nhánh và bậc được chốt vào đội khi khởi hành, dùng trong cả quần đảo, phế tích và boss. Vai trò và phối đội hiển thị theo nhánh đã chọn. Chiêu hỗ trợ giữ Lấy đà/Phản kích, không bị coi là chiêu công kích khi xét giáp phản đòn, ngắt phép hoặc nhắm lõi/rễ.



Sàn đấu hiển thị tên nhánh, bậc và hai bộ đang kích hoạt. Xem trước bao gồm khiên sau đỡ, mức/ lượt đốt và các chỉ số của nhánh; chỉ xem hoặc hủy không đổi bản lưu. Nút đồ trong xưởng, chi tiết thú và túi cho biết bộ 1/2 hay 2/2, từng món còn thiếu và đường vào boss tương ứng.



Khóa `spirit-isles-save-v1`, định dạng bản lưu 1 và dự phòng Android đồng bộ giữ nguyên. Thú trong bản cũ được thêm bậc 0 khi thiếu trường luyện; trận đang chơi giữ nguyên bản chốt đội và hiệu ứng cũ đến khi kết thúc. Dữ liệu nhánh/bộ có sẵn nhưng sai định dạng bị từ chối. Bốn tệp mới được đóng gói và lưu cache để chơi offline.



## Chiến thuật kẻ địch & hai thủ vệ mới · 1.9.0



Vào **Thám hiểm → Săn Thủ Vệ** để chọn Cổ Mộc Gai, Rồng Băng hoặc Phượng Hoàng. Mỗi boss có 5 bậc và tiến trình/phần thưởng lần đầu riêng. Đảo hiển thị tổng tiến độ 15 bậc.



| Thủ vệ | Mở khóa | Cơ chế riêng |

| --- | --- | --- |

| Cổ Mộc Gai | Đảo cấp 2 | Khiên vỏ cây, hai rễ hồi sinh, lõi cuồng nộ. |

| Rồng Băng | Đảo cấp 3 + thắng Cổ Mộc bậc 1 | Tụ sương trước Bão tuyết; khóa tích năng lượng và vảy băng giai đoạn 2. |

| Phượng Hoàng | Đảo cấp 4 + thắng Rồng Băng bậc 1 | Lõi lửa lộ ở 60% HP, hồi phục và một lần tái sinh. |



Mỗi bậc kế tiếp yêu cầu thắng bậc trước và thêm một cấp đảo. Mỗi lần vào dùng 12 quả mọng, không giới hạn lượt mỗi ngày. Các trận đang chơi từ bản cũ vẫn tiếp tục với luật cũ.



- **Rồng Băng:** nhịp Quét cánh → Tụ sương (không đánh) → Bão tuyết ×1,7 → Nanh băng ×2. Bão tuyết khóa việc nhận thêm năng lượng trong 2 lượt; năng lượng đã có vẫn dùng được. Chiêu công kích Hỏa hoặc Hợp lực ngắt toàn bộ bão và làm tan băng. Đỡ hoàn hảo cũng làm tan/chống băng; Phá thế ngắt lượt bão. Nếu hết năng lượng, băng tự hết sau hai lượt, không khóa trận vĩnh viễn.

- **Phượng Hoàng:** dưới 60% HP, chọn Thân hoặc Lõi lửa trong sàn đấu. Đòn nhắm lõi gây đủ sát thương vào lõi và kèm 25% lên thân. Phá lõi chặn hồi phục và tái sinh. Nếu hạ thân khi lõi còn sống, boss hồi 45% HP đúng một lần và bỏ lượt phản công đó; không nhận phần thưởng sớm. Lõi còn sống hồi 10% HP thân mỗi lượt thứ tư, có thể ngắt bằng Phá thế. Bản lưu giữ cả HP lõi lẫn lần tái sinh đã dùng.

- **Quái giáp phản kích:** hai lượt có giáp giảm 35% sát thương và phản 9 sát thương nếu bị công kích; lượt thứ ba hở sườn. Hợp lực, xuyên/phá giáp hoặc chiêu công kích hoàn hảo vô hiệu cả giáp lẫn phản đòn. Sát thương phản tính chung vào lượng Nhận trong xem trước, vẫn qua giảm sát thương và khiên.

- **Pháp sư:** một lượt tụ phép, sau đó tung chú ×2,15. Hợp lực hoặc chiêu công kích đúng nhịp ngắt phép; ngắt từ lượt tụ khiến lượt sau pháp sư nghỉ. Phá thế cũng ngắt được. Trạng thái tụ/ngắt phép được lưu.

- **Thú cuồng nộ:** dưới 40% HP, sát thương địch tăng 60%, kể cả khi chính đòn vừa đánh làm nó vượt ngưỡng. Xem trước tính đúng thay đổi này để chọn kết liễu hay đỡ đòn.



Ba chiến thuật xuất hiện trong các chặng quần đảo sau lượt làm quen và những tầng thường của phế tích. Ý định, hướng dẫn đối phó, trạng thái và xem trước đều dùng cùng luật với trận thật. Xem trước báo lõi mất HP, phá lõi, tái sinh, ngắt phép/bão, năng lượng bị khóa, giáp và phản đòn. Không đổi bản lưu, thời gian chờ hoặc trạng thái ngẫu nhiên khi chỉ xem/hủy.



Hai boss mới có hình SVG tô khối riêng, cảnh nền băng/lửa, hiệu ứng chữ/số theo cơ chế và hỗ trợ giảm chuyển động. Rồng Băng rơi ngẫu nhiên Bùa Nanh Băng hoặc Thạch Vĩnh Đông; Phượng Hoàng rơi Vòng Vũ Hỏa hoặc Thạch Tái Sinh. Đây là đồ chỉ rơi từ boss tương ứng, có thể mang, nâng, ghép trùng và tái chế ở xưởng; 6 công thức chế cũ giữ nguyên. Túi đầy đổi phần thưởng thành nguyên liệu.



Giữ khóa bản lưu spirit-isles-save-v1, định dạng phiên bản 1 và bản dự phòng Android ghi đồng bộ. Dữ liệu mới còn thiếu được bổ sung; dữ liệu đã có nhưng hỏng bị từ chối. Tất cả hình vẽ, luật chơi và hướng dẫn được đóng gói offline.



## Nước đi chiến thuật · từ 1.8.0



Trong trận quần đảo, Phế Tích Cổ hoặc Săn Thủ Vệ, chọn **Vào sàn đấu** để dùng đầy đủ cơ chế chiến đấu. Đọc ý định địch, chọn thế trận và chiêu, xem trước kết quả rồi mới chốt lượt. Đổi lựa chọn, xem trước hoặc quay lại không tiêu năng lượng, lượt, hiệu ứng hay trạng thái ngẫu nhiên.



- **Ba thế trận:** Cân bằng giữ sức mạnh thường; Tấn công gây thêm 25% nhưng cũng nhận thêm 25% sát thương; Phòng bị gây và nhận ít hơn 20%. Thế chọn chỉ được lưu khi chốt lượt; các nút đánh nhanh ở màn hành trình tiếp tục dùng thế đã lưu và hiển thị thế hiện tại ở lối vào sàn.

- **Lấy đà:** dùng một lượt, không tấn công trực tiếp, nhận 2 năng lượng (tối đa 3), nhưng chịu thêm 35% sát thương trong lượt đó. Đòn tấn công kế tiếp mạnh hơn 45%. Đỡ và kỹ năng hỗ trợ thuần túy giữ Lấy đà; không cộng dồn và không thể Lấy đà lại trước khi tiêu. Lượt này không có thanh canh nhịp, không tích Phá thế và giữ nguyên sơ hở đang có. Chọn lúc địch tụ sức là cơ hội an toàn; xem trước cũng tính hồi máu và hiệu ứng theo lượt của địch.

- **Đỡ hoàn hảo mở Phản kích:** giảm 90% sát thương đòn tới và tích +25% cho một đòn tấn công sau. Chỉ nhận nếu địch thực sự ra đòn; ngắt địch bằng Phá thế, địch tụ sức, hồi máu hoặc bị hạ trước đó không cho Phản kích. Phản kích không cộng dồn, giữ qua lượt đỡ/hỗ trợ, kết hợp được với Lấy đà và dùng đúng một lần.

- **Nhắm rễ hồi sinh:** ở giai đoạn 2 Cổ Mộc, chọn Thân cây hoặc Rễ hồi sinh. Nhắm rễ bằng một chiêu gây sát thương sẽ chặt hết rễ còn sống, đổi lại sát thương lên thân còn 50%. Nếu sang giai đoạn lõi, rễ tự biến mất. Các quy tắc cũ khi nhắm thân vẫn áp dụng: đánh thường chặt một rễ; Hỏa, combo hoặc hợp lực chặt hết.

- **Xem trước nước đi thật:** hiển thị sát thương, lượng nhận sau khiên, hồi phục và khiên tạo ra hoặc HP sau lượt; có cảnh báo gục, hạ địch, địch hồi máu, chặt rễ và mở Phản kích. Chuyển giữa Chạm thường và Hoàn hảo để so sánh; kết quả tương ứng nhịp bạn thực sự chạm. Nút Bỏ canh nhịp dùng đòn thường không tích Phá thế. Quần đảo hiển thị khoảng dao động sát thương; phế tích và boss dùng đúng trạng thái ngẫu nhiên đã lưu.

- **Đọc trạng thái dễ hơn:** thẻ chiêu hiện vai trò hoặc combo sẵn sàng; khi chọn chiêu có mô tả hiệu ứng. Thanh trạng thái hiện khiên, đốt, hồi phục, suy yếu, tăng lực, phản đòn, Lấy đà và Phản kích. Hoạt cảnh phân biệt chuẩn bị, đỡ và tấn công, hiển thị hồi máu địch, rễ bị chặt và phản đòn. Hợp lực cũng phá khiên trong quần đảo như hai chế độ còn lại.



Thế trận, Lấy đà và Phản kích lưu theo từng trận, kết thúc khi sang trận mới. Bản lưu đang chơi từ 1.7.0 trở về trước tự thêm thế Cân bằng và hai hiệu ứng trống; dữ liệu chiến thuật đã có nhưng hỏng bị từ chối. Giữ khóa `spirit-isles-save-v1`, định dạng phiên bản 1 và cơ chế dự phòng Android. Toàn bộ luật và phần xem trước đóng gói offline. Sàn đấu và nút chốt vừa màn hình 320 × 640 khi canh nhịp; giảm chuyển động vẫn dùng được.



## Giao diện đảo & sảnh game · từ 1.7.0



Màn chính trở thành một cảnh đảo phủ màn hình: thanh tài nguyên và cấp đảo ở trên, các hoạt động ở hai bên, nút Thám hiểm và Thu hoạch phía dưới. Bỏ thanh bên, tiêu đề giới thiệu và các hàng thẻ dài của giao diện cũ. Trên điện thoại từ 320 × 720, các thao tác chính nằm trong một màn hình; màn hình thấp hơn vẫn cuộn được.



- **Chạm để chơi:** chọn công trình hoặc linh thú trực tiếp trên đảo. Bến câu, Lai tạo, Phế tích và Thủ vệ có nút riêng, kèm trạng thái mở khóa hoặc chuyến đang chơi. Thám hiểm tự dẫn về chuyến quần đảo, phế tích hoặc thủ vệ đang dở.

- **Mục tiêu ngay trên đảo:** thanh nhiệm vụ ưu tiên mục đã hoàn thành để nhận thưởng, hoặc dẫn tới hoạt động cần làm. Quà mỗi ngày, số tài nguyên, thu hoạch và trứng lai hiển thị trạng thái thật từ bản lưu.

- **Cùng một phong cách:** nền biển, khung màu kem viền vàng, nút có độ nổi và thanh chức năng cố định ở dưới cho cả máy tính lẫn điện thoại. Chữ dùng font Be Vietnam đã đóng gói, hỗ trợ dấu tiếng Việt và offline.

- **Ít cuộn trước khi chơi:** đội hình hiển thị ba ô thú; mở “Phối đội & nối chiêu” khi cần xem chiến thuật. Vườn ấp đưa trứng và nút ấp đơn/10 lên gần phía trên. Màn xây dựng, thám hiểm, nhiệm vụ và hộp thoại dùng cùng khung game.



Hiệu ứng trang trí tôn trọng cài đặt Chuyển động và giảm chuyển động của hệ điều hành. Bản lưu vẫn dùng khóa, định dạng phiên bản 1 và bản dự phòng Android hiện có; luật chơi, tỷ lệ gacha và tiến trình được giữ nguyên khi cài đè.



## Sàn đấu chủ động · từ 1.6.0



Trong trận quần đảo, Phế Tích Cổ hoặc Săn Thủ Vệ, chạm **Vào sàn đấu**. Sàn đấu có cảnh nền theo hệ, luôn đặt đội và đối thủ cạnh nhau, hai thanh sinh lực, ý định địch và các chiêu trong cùng một giao diện. Trên điện thoại sàn đấu phủ toàn màn hình; khi ngắm nhịp sẽ thu gọn hàng chọn chiêu để vẫn thấy đấu trường và nút ra đòn. Thú lao tới, phóng chiêu, đối thủ phản ứng khi trúng rồi mới đến nhịp phản công; số hiển thị dùng sát thương/hồi phục/khiên thật của lượt.



- **Canh nhịp ra đòn:** chọn đánh thường, đỡ đòn, hợp lực hoặc chiêu của một thú rồi chạm nút lớn khi kim vào vùng màu. Vùng xanh từ 30–70% cho +10% sát thương, hồi phục và khiên từ chiêu; vùng vàng từ 43–57% cho +25%. Kim đi và về, có thể chờ bao lâu cũng được. Chạm ngoài vùng vẫn dùng chiêu thường, không bị phạt thêm. Trên máy tính dùng phím cách để chốt nhịp.

- **Đỡ đúng lúc:** đỡ thường giảm 75% sát thương, vùng xanh giảm 82%, vùng vàng giảm 90%. Theo dõi ý định để giữ nhịp đỡ cho đòn dồn sức, hoặc dùng phá thế ngắt hẳn đòn đó.

- **Thanh phá thế:** một hành động canh nhịp thường nhận 8 điểm, xanh 20, vàng 34. Đủ 100 điểm sẽ trừ 100, ngắt ý định của đối thủ trong lượt đó, kể cả dựng khiên, hút năng lượng hoặc tự hồi phục. Địch lộ sơ hở để hành động tiếp theo của đội gây thêm 20% sát thương. Hiệu ứng theo lượt và rễ hồi sinh vẫn theo luật của chúng. Thanh chỉ tồn tại trong trận hiện tại.

- **Chọn nhịp chơi:** nút Canh nhịp cho phép đánh nhanh ngay trong sàn. Cách này dùng sức mạnh thường và không tự tạo điểm phá thế. Có thể chọn Ra chiêu thường trong lúc ngắm, hoặc Đổi chiêu để hủy mà không mất lượt, năng lượng hay trạng thái ngẫu nhiên. Mọi kỹ năng, combo, thời gian chờ và trang bị đều dùng chung luật của ba chế độ.

- **Tiếp tục an toàn:** rời ứng dụng tạm dừng đúng vị trí kim. Nút quay lại Android hủy phần ngắm trước, lần kế tiếp rời sàn mà giữ trận. Đóng hẳn khi chưa chốt không ra đòn; chốt chiêu ghi bản lưu trước khi chạy hoạt cảnh, nên đóng giữa hoạt cảnh vẫn giữ đúng lượt đã chơi. Thanh phá thế và sơ hở được lưu cùng HP, năng lượng và hiệu ứng.



Chuyển động tôn trọng cài đặt game và hệ điều hành. Khi giảm chuyển động, phản hồi chiến đấu hiển thị bằng chữ và số, thao tác canh nhịp vẫn dùng được; có thể tắt canh nhịp để chọn chiêu trực tiếp. Không có vòng vẽ nền khi sàn đứng yên, đã đóng hoặc kim tạm dừng. Toàn bộ giao diện, luật mới và hình vẽ được đóng gói offline.



Bản lưu vẫn dùng khóa `spirit-isles-save-v1`, định dạng phiên bản 1. Trận cũ tự thêm thanh phá thế trống; dữ liệu phá thế đã có nhưng sai sẽ bị từ chối khi nhập. Đội, trang bị, bảo hiểm gacha, các hoạt động và bản dự phòng Android được giữ nguyên.



## Săn Thủ Vệ, trang bị & hiệu ứng chiến đấu · từ 1.5.0



**Cổ Mộc Gai** mở ở cấp đảo 2, vào từ thẻ trên đảo hoặc **Thám hiểm → Săn Thủ Vệ**. Một trận dùng 12 quả mọng; không giới hạn lượt theo ngày. Có 5 bậc thử thách, mỗi bậc cần thắng bậc trước và đạt cấp đảo tương ứng từ 2 đến 6.



- **Ba giai đoạn trong một trận:** vỏ cây dựng khiên; khi còn 60% sinh lực mọc hai rễ hồi sinh; khi còn 30% sinh lực lõi lộ sáng, đội gây thêm 20% sát thương nhưng boss đánh mạnh hơn 30%. Đánh thường chặt một rễ; chiêu Hỏa, combo hoặc tuyệt kỹ hợp lực chặt hết. Rễ còn sống hồi máu cho boss sau mỗi lượt.

- **Đọc đòn để phản ứng:** boss báo trước tụ sức và Đại chấn rễ. Tụ sức không đánh, phòng thủ giảm 75% sát thương. Dùng được cả 58 kỹ năng riêng, combo hệ và hiệu ứng phối đội. Trận tăng sát thương địch sau lượt 12 và kết thúc tối đa 60 lượt.

- **Thắng để phát triển:** nhận vàng, tinh hoa, nhựa cổ, đá rễ, lõi rừng và một trang bị cấp 1. Lần đầu thắng mỗi bậc có thêm 2 vé ấp, ngọc và XP. Kết quả rơi đồ được lưu cùng trận; mở lại không đổi phần thưởng. Thua hoặc rút lui không mất thú hay trang bị, không nhận chiến lợi phẩm.



**Xưởng Lá Cổ** mở ở cấp đảo 2, vào từ **Linh thú → Chế đồ cho người bạn của bạn**. Mở hòm làm quen miễn phí một lần để nhận 9 nhựa cổ và 6 đá rễ, đủ nguyên liệu chế ba món đầu tiên.



- **Ba ô cho mỗi thú:** Bùa, Vòng cổ và Tinh thạch; có 6 công thức tăng sức mạnh, hồi phục hoặc khiên từ chiêu. Mỗi món chỉ do một thú mang. Chạm **Trang bị** trong chi tiết thú hoặc **Chọn bạn mang** ở xưởng để quản lý.

- **Chế và nâng:** chế món cấp 1 bằng 90 vàng, 3 nhựa cổ và 2 đá rễ. Nâng tối đa cấp 5; nguyên liệu tăng theo cấp, từ cấp 3 lên 4 cần lõi rừng kiếm từ boss. Có thể dùng một bản trùng cấp 1 chưa mang thay toàn bộ nhựa/đá và giảm một nửa vàng; lõi vẫn cần khi áp dụng. Ghép và tái chế có bước xem trước, xác nhận trước khi tiêu thụ đồ.

- **Đồ dùng được ở cả ba chế độ:** sức mạnh, hồi phục và khiên tác động trong quần đảo, phế tích và săn thủ vệ. Đội và trang bị được chốt khi khởi hành; kết thúc chuyến đi mới thay, nâng hoặc tái chế. Vẫn có thể chế món mới trong lúc đội đang đi. Túi tối đa 120 món; phần thưởng trang bị khi đầy được chuyển thành nguyên liệu.



Khi ra đòn, thú lao lên, phóng chiêu theo hệ, có va chạm và số sát thương/hồi phục/khiên thực tế. Nếu đấu trường nằm ngoài màn hình do đang cuộn tới nút kỹ năng trên điện thoại, một ô diễn biến nhỏ xuất hiện tạm thời phía trên thanh điều hướng. Hiệu ứng tôn trọng lựa chọn Chuyển động trong game và giảm chuyển động của hệ điều hành; không trì hoãn thao tác hoặc đổi luật chiến đấu.



Bản lưu tiếp tục dùng khóa `spirit-isles-save-v1`, định dạng phiên bản 1 và bản dự phòng Android ghi đồng bộ. Bản cũ tự thêm xưởng và thủ vệ khi thiếu; dữ liệu đã có nhưng hỏng sẽ bị từ chối khi nhập. Trận quần đảo/phế tích cũ giữ nguyên sức mạnh thành viên đang đi. Từng lượt boss tự lưu HP, giai đoạn, rễ, năng lượng, thời gian chờ, hiệu ứng và trạng thái ngẫu nhiên. Tất cả tính năng hoạt động offline.



## Kỹ năng linh thú & phối đội · từ 1.4.0



Cả **58 loài có kỹ năng chiến đấu riêng**, chia thành Công kích, Hộ vệ, Hồi phục và Hỗ trợ. Cáo Mầm hồi máu theo lượt, Rùa Cuội dựng khiên, Chim Than Hồng thiêu đốt và Sẻ Gió tăng sát thương. Xem vai trò, chi phí và hiệu ứng trong chi tiết của cả thú đã có và chưa kết bạn; nội tại trên đảo vẫn hiển thị riêng.



- **Ra chiêu trong cả hai chế độ:** thám hiểm quần đảo và Phế Tích Cổ đều có ba thẻ kỹ năng. Đánh thường hoặc phòng thủ để tích tối đa 3 năng lượng chung; chiêu riêng dùng 1–3 năng lượng và một lượt. Sau khi dùng, chờ 2–3 hành động khác của đội; nút hiện rõ thiếu năng lượng hoặc số lượt còn chờ. Tuyệt kỹ hợp lực dùng 2 năng lượng vẫn có thể chọn.

- **Nối chiêu giữa hai thú:** Mộc + Thủy tạo Nảy mầm, hồi thêm 12% sinh lực; Thủy + Hỏa tạo Hơi nước, tăng 35% sát thương và xuyên khiên; Hỏa + Phong tạo Hỏa phong, thiêu đốt; Mộc + Phong tạo Tán lá, thêm 18% khiên; Quang + Ám tạo Nhật thực, phá khiên và giảm đòn địch. Hai thú cùng hệ tăng 15% sát thương chiêu sau, các cặp khác tăng 10%. Hai thứ tự đều dùng được. Đánh thường, phòng thủ hoặc tuyệt kỹ hợp lực giữ dấu ấn để chờ nối chiêu.

- **Phối ba vai trò:** Hộ vệ + Hồi phục tăng 20% khiên từ chiêu; Công kích + Hỗ trợ tăng 10% sát thương chiêu; ba vai trò khác nhau nhận 6% khiên đầu trận. Bảng đội trong Linh thú hiển thị hiệu ứng đang có, còn thiếu và các combo có thể tạo. Chọn **Đổi bạn** để thay đúng một vị trí.

- **Chọn đúng thời điểm:** thiêu đốt và hồi phục kích hoạt đầu lượt tiếp theo; tăng sát thương, suy yếu và phản đòn có thời hạn. Hiệu ứng cùng loại giữ mức mạnh hơn và thời gian dài hơn. Tổng khiên đội tối đa bằng 60% sinh lực; kỹ năng cũng phối hợp với các phép bổ trợ hiện có trong phế tích.

- **Giữ nhịp hành trình:** năng lượng dư mang sang trận tiếp theo trong cùng chuyến đi; dấu ấn, thời gian chờ và hiệu ứng tạm kết thúc sau mỗi trận. Đội được khóa khi đang khám phá; sức mạnh thành viên được chốt lúc khởi hành. Từng lượt tự lưu cả năng lượng, thời gian chờ và hiệu ứng; mở lại không hồi chiêu miễn phí.



Bản lưu vẫn dùng khóa `spirit-isles-save-v1` và định dạng phiên bản 1. Trận đang chơi từ bản cũ được bổ sung kỹ năng khi tải, giữ nguyên HP, năng lượng và tiến trình; dữ liệu kỹ năng đã có nhưng hỏng sẽ bị từ chối khi nhập. Tính năng hoạt động offline trên trình duyệt và Android.



## Linh thú nổi khối · từ 1.3.1



Làm mới ngoại hình theo phong cách **2.5D**: cả 58 linh thú có bề mặt bo tròn bằng ánh sáng từ góc trên trái, chuyển sắc riêng cho từng bộ phận, đôi mắt có độ bóng và bóng tiếp xúc dưới chân. Lông, tai, đuôi, vây, cánh và trang sức giữ nguyên thiết kế của từng loài; độ hiếm vẫn phân biệt qua chi tiết riêng.



- Màn hình xem thú đã sở hữu hoặc chưa kết bạn có bệ trưng bày với mặt trên, thành bệ và bóng đổ. Thẻ sưu tầm, kệ SSR và bệ trứng cũng có thêm độ nổi.

- **Kéo ngang để ngắm:** ở màn hình chi tiết, kéo nhẹ hoặc rê chuột để nghiêng góc nhìn; đầu, mặt, thân và cánh dịch chuyển khác nhau tạo thị sai. Thả tay hoặc rời vùng xem sẽ trở lại giữa. Có thể Tab vào vùng xem rồi dùng phím mũi tên; Home đưa về chính diện. Vẫn vuốt dọc để cuộn hộp thoại trên điện thoại.

- Tắt Chuyển động trong Cài đặt hoặc bật giảm chuyển động của hệ điều hành sẽ giữ góc nhìn tĩnh; ánh sáng và bóng vẫn có hiệu lực.



Đây là hình vector có tạo khối và các lớp có thị sai; chưa có mô hình 3D để xoay 360°. Không cần WebGL, tải thêm dữ liệu hay cấp quyền cảm biến; hình vẽ và tương tác hoạt động offline. Phần ngắm thú chỉ thay đổi giao diện, dùng sự kiện con trỏ, không có vòng vẽ liên tục khi đứng yên. Cấp, sức mạnh, tỷ lệ gacha và định dạng bản lưu được giữ nguyên.



## Muôn sắc linh thú · từ 1.3.0



Thêm **30 loài**, mỗi hệ 5 loài, nâng bộ sưu tập lên **58**: **55 loài gacha** và 3 loài lai đặc biệt. Gacha có 13 N, 12 R, 18 SR và **12 SSR**. Có thêm gấu trúc, rái cá, nhím, cánh cụt, sư tử, cú, bướm, cá đuối, kỳ lân, cá chép bay, ưng sư, khổng tước và linh xà.



- **Độ hiếm thể hiện qua ngoại hình:** N nhỏ nhắn, R có họa tiết và phụ kiện, SR có sắc độ, chi tiết theo loài và ánh sáng; SSR có dáng thần thú, hoa văn vàng và hào quang. Mỗi loài mới có bảng màu, câu chuyện, kỹ năng và nội tại riêng. Sáu SSR cũ và sáu SR cũ cũng được bổ sung chi tiết đặc trưng.

- **Sáu SSR mới:** Quy Thần Vạn Diệp mang cổ thụ trên mai; Côn Ngư Tinh Hải với vây lụa; Kỳ Lân Xích Diệm với sừng thái dương; Thiên Ưng Phong Vũ với cánh lông vũ; Bạch Lộc Thiên Quang với đôi cánh ngọc; Long Thần Hư Không với cánh sao và trăng trước ngực.

- **Ngắm trước khi sưu tầm:** kệ 12 SSR trong Vườn ấp; chạm để xem hình lớn và câu chuyện. Sổ linh thú hiển thị tên và hình của cả những loài chưa sở hữu, đánh dấu “Chưa kết bạn”. Có bộ lọc N/R/SR/SSR, kết hợp hệ và tìm tên; sắp theo độ hiếm cao nhất hoặc tên A → Z.

- **Mốc 30, 45, 58 loài:** nhận vé, ngọc và tinh hoa một lần trong Nhật ký. Thú mới dùng chung cho ăn, tiến hóa, đội hình, lai tạo và nội tại. Giữ nguyên tỷ lệ gacha, chi phí, bảo hiểm và sức mạnh theo bậc hiếm.



Hình vẽ được đóng gói cùng game, dùng được offline; không tải ảnh từ mạng. Hiệu ứng tôn trọng lựa chọn Chuyển động trong Cài đặt và chế độ giảm chuyển động của thiết bị. Khóa lưu, định dạng phiên bản 1 và bản dự phòng Android được giữ nguyên; cài đè 1.2.0 giữ thú, tài nguyên, đội hình, bảo hiểm và các hoạt động đang chơi.



## Phế Tích Cổ · từ 1.2.0



Mở ở cấp đảo 2, vào từ thẻ **Phế Tích Cổ** trên đảo hoặc **Thám hiểm → Phế Tích Cổ**. Một chuyến dùng 12 quả mọng và đội tối đa 3 linh thú. Có 50 tầng qua 5 khu: Sảnh Rễ Xưa, Hành Lang Thủy Kính, Lò Sao Ngủ Quên, Thư Viện Giấc Mơ và Trái Tim Bình Minh.



- **Mỗi lần đi có lựa chọn mới:** đường thường, tinh anh mạnh hơn 30%, kho báu có đối thủ mang khiên, suối hồi 30% sinh lực và thêm 1 năng lượng. Suối không cho phép bổ trợ. Sau trận thắng chọn một phép trong bộ ngẫu nhiên; tinh anh cho đổi lựa chọn một lần.

- **21 phép bổ trợ:** cộng dồn theo bậc, ghép hiệu ứng theo hệ, thú N / R, đội 3 hệ hoặc 3 thú cùng hệ. Phép chỉ tồn tại trong chuyến đi. Sức mạnh thú và bậc di vật được chốt lúc khởi hành, nên chăm thú giữa chuyến không đổi sức mạnh đội đang đi.

- **Thủ vệ mỗi 5 tầng:** đối thủ báo ý định trước lượt đánh. Có dựng khiên, hồi máu, hút năng lượng và đòn dồn sức; phòng thủ giảm 75% sát thương, tuyệt kỹ cần 2 năng lượng để phá khiên và hồi máu. Sát thương đối thủ tăng dần từ lượt 10 để tránh kéo dài trận vô hạn.

- **Bình sương:** hồi 35% sinh lực, không tốn lượt. Bắt đầu với 1 bình; nâng di vật Bình Sương Nhỏ để mang tối đa 4 bình. Thắng thủ vệ hồi 15% sinh lực.

- **Phát triển lâu dài:** bụi cổ được cất ngay sau mỗi tầng; nâng 3 di vật vĩnh viễn, đổi vé ấp/tinh hoa/hành trang. Di vật Đèn Rễ Cổ có 5 bậc sinh lực, La Bàn Bình Minh có 5 bậc sức mạnh, Bình Sương Nhỏ có 3 bậc số bình.

- **10 rương và 5 danh hiệu:** vượt mốc 5 tầng để nhận quà một lần; xong khu 10 tầng mở điểm khởi hành 11, 21, 31 hoặc 41. Tầng đã vượt lần đầu cho nhiều bụi cổ và XP hơn khi chơi lại. Chơi lại từ tầng 1 cho nhiều cơ hội tích phép hơn so với đi thẳng vào khu cao.



Rút lui hoặc thua vẫn giữ bụi cổ, tài nguyên và kỷ lục đã kiếm, kết thúc bộ phép của chuyến. Không có giới hạn lượt theo ngày. Đội chỉ tham gia một chuyến quần đảo hoặc phế tích cùng lúc. Từng lựa chọn, ý định, HP, khiên, bình sương và trạng thái ngẫu nhiên được lưu; mở lại giữ đúng trận và bộ phép đã xuất hiện. Bản lưu cũ tự thêm dữ liệu phế tích; game vẫn dùng khóa lưu và định dạng phiên bản 1.



## Chơi gì trên đảo?



- **Ấp trứng:** 55 loài thuộc 6 hệ Mộc, Thủy, Hỏa, Phong, Quang, Ám; hai loại trứng, quay đơn và quay 10; bảo hiểm SR trong 10 lượt và SSR trong 50 lượt. Tỷ lệ hiển thị ngay trong game. Thú trùng tặng mảnh và tinh hoa.

- **Lai tạo:** mở ở cấp đảo 2, chọn hai thú khác nhau từ cấp 3 và 6 gắn bó. Mộc + Thủy có thể nở Hải Cẩu Lá Sen; Hỏa + Phong có Cáo Khói Mây; Quang + Ám có Thỏ Tinh Vân. Ba loài này chỉ từ lai tạo, nâng tổng số lên 58. Gắn bó và bữa cá tăng cơ hội loài lai; kết quả còn lại thuộc hệ bố mẹ. Trứng đầu 1 phút, sau đó 10 phút, có cá giảm 30%; vẫn ấp khi đóng game. Giữ nguyên thú bố mẹ. Kết quả được quyết định và lưu ngay khi bắt đầu.

- **Câu cá:** vào bến câu từ đảo chính. Canh kim vào vùng xanh, trúng ít nhất 2/3 nhịp để bắt cá; ba nhịp hoàn hảo thưởng thêm vàng, chuỗi ba lượt thành công thưởng tinh hoa. Có 12 loài thủy sinh ở ba bến; cấp câu 3 và 6 mở bến mới, kỹ năng tối đa 20. Nâng cần đến cấp 5 bằng vàng và gỗ để dễ câu và tăng cơ hội cá hiếm. Cá dùng hỗ trợ lai tạo hoặc đổi thức ăn/tinh hoa trong sổ; có quà theo mốc 3, 6, 9, 12 loài. Đổi cá giữ nguyên sưu tầm và kỷ lục cân nặng.

- **Chăm sóc:** cho ăn để tăng cấp đến 30, tăng gắn bó, tiến hóa tối đa 3 sao. Mỗi loài có nội tại hỗ trợ sản xuất hoặc thưởng thám hiểm.

- **Xây đảo:** 5 công trình, nâng cấp bằng vàng và gỗ; tài nguyên tích lũy khi nghỉ chơi, tối đa 8 giờ. Công trình mới xuất hiện trong cảnh đảo.

- **Thám hiểm:** chọn đội tối đa 3 linh thú, mở dần 6 vùng đất, chọn đường và gặp sự kiện. Chiến đấu theo lượt với tấn công, phòng thủ, năng lượng và tuyệt kỹ. Đối thủ báo trước đòn mạnh; trở lại vùng đã khám phá tăng độ khó và phần thưởng.

- **Mục tiêu dài hạn:** cột mốc sưu tầm và tiến hóa, nhiệm vụ mỗi ngày, quà ghé đảo, thử các đội hình và hệ khắc chế.



Đội 3 hệ khác nhau được +12% sức mạnh; 3 linh thú cùng hệ được +20%; các đội còn lại được +5%. Linh thú khắc chế hệ vùng đất được +30% sức mạnh cá nhân. Tuyệt kỹ có thêm sát thương nếu đội có hệ Hỏa, thêm hồi phục nếu có Thủy hoặc Mộc.



## Giữ tiến trình



Game tự lưu sau mỗi hành động và sau mỗi 15 giây. Bản Android ghi ngay một bản dự phòng vào dữ liệu riêng của ứng dụng, chọn bản hợp lệ mới nhất giữa WebView và bản dự phòng khi mở lại. Chuyến thám hiểm đang chơi cũng được lưu sau từng lượt.



Chuyến câu giữ nguyên cá đã chọn và kết quả từng nhịp. Đổi trang, mở hộp thoại hoặc rời ứng dụng sẽ tạm dừng kim; quay lại tiếp tục đúng nhịp đang chơi. Trứng lai không thể nhận trước giờ hoặc nhận hai lần. Các hoạt động mới dùng chung bản lưu và chức năng xuất/nhập sẵn có.



Vào **Cài đặt → Xuất bản lưu** để giữ tệp JSON trước khi đổi máy hoặc gỡ game. **Nhập bản lưu** kiểm tra dữ liệu và yêu cầu xác nhận trước khi thay thế đảo hiện tại. Tiến trình không đồng bộ giữa các thiết bị hoặc giữa APK và trình duyệt.



## Chạy bản trình duyệt trên máy phát triển



Yêu cầu Node.js 22 trở lên:



```powershell

cd D:\App\SpiritIsles

npm ci

npm start

```



Mở `http://localhost:4189`. Có thể đổi cổng bằng biến môi trường `PORT`. Service worker lưu game và font để dùng offline sau lần tải đầu tiên.



## Kiểm thử



```powershell

npm test

npx playwright install chromium

npm run test:ui

```



Kiểm thử luật chơi bao gồm chi phí gacha, cả hai bảo hiểm, thú trùng, cho ăn, tiến hóa, giới hạn tài nguyên offline, nhiệm vụ, điểm danh, chiến đấu, lưu giữa trận, dữ liệu hỏng và chuỗi chơi dài. Kiểm thử giao diện bao gồm cỡ màn hình 360–1440 px, quay 10, lưu sau tải lại, chăm thú, xây dựng, hoàn thành thám hiểm, xuất/nhập bản lưu và chơi khi mất mạng.



Bản 1.1.0 bổ sung kiểm thử di chuyển bản lưu 1.0, điều kiện/công thức lai, cá hỗ trợ, trứng nở offline, kết quả cố định, nhận thưởng một lần, nhịp câu trúng/trượt, tạm dừng/tiếp tục, nâng cần, mở bến, đổi cá và mốc sưu tầm. Kiểm thử trình duyệt thao tác câu cá theo đồng hồ điều khiển, đón thú lai, kiểm tra bản lưu cũ và bố cục màn hình nhỏ.



Ảnh giao diện được tạo trong `dist/screenshots/`. Bản 1.1.0 đã được cài và chạy trên giả lập Android 15 khi tắt Wi-Fi/dữ liệu di động; đã kiểm tra quay 10 trứng, bản lưu dự phòng native, đóng hẳn rồi mở lại giữ nguyên tiến trình. Android Lint không có lỗi. Kết quả nằm trong `dist/ANDROID-SMOKE.json` và `dist/BUILD-INFO.json`. Chưa thử trên điện thoại Android thật.



Bản 1.1.0 qua 31 kiểm thử luật chơi và 15 kiểm thử giao diện. Trên giả lập đã cài đè bản 1.0.0 có 12 thú, 10 lượt gacha và 8 lần cho ăn; xác nhận giữ nguyên tiến trình, câu cá bằng các nút trong WebView, tạm dừng khi về màn hình chính Android, dùng cá cho trứng lai, đón trứng sau khi đóng hẳn game, và mở lại vẫn giữ phần thưởng. Bản cuối được chạy khi không có mạng mặc định; bản lưu native trên đĩa được đối chiếu trước và sau khi đóng cưỡng bức ứng dụng. 18 tệp web trong APK đã được đối chiếu byte với nguồn.



Bản 1.1.1 đã vượt qua 31 kiểm thử luật chơi và 15 kiểm thử giao diện; Android Lint có 0 lỗi, 4 cảnh báo. Đã kiểm tra font thường/nghiêng với ký tự tiếng Việt dựng sẵn và tổ hợp, màn hình rộng 320–1440 px, phóng to 200% và font khi trình duyệt offline. Trên giả lập Android 15 đã cài đè 1.1.0 sau khi cho thú ăn, xác nhận thú, tài nguyên và thống kê giữ nguyên, tiêu đề dùng đúng font Lora khi Wi-Fi/dữ liệu đều tắt và không có mạng mặc định. 21 tệp web trong APK khớp nguồn. Kết quả riêng của bản sửa font nằm trong `dist/TYPOGRAPHY-CHECK.json` và `dist/ANDROID-FONT-SMOKE.json`.



Bản 1.2.0 qua 50 kiểm thử luật chơi và 23 kiểm thử giao diện. Các kiểm thử mới bao gồm toàn bộ hành trình 50 tầng, ý định thủ vệ, chọn/phối phép, điểm khởi hành, bình sương, di vật, rương nhận một lần, trao đổi bụi cổ, đồng nhất kết quả sau khi tải lại và kiểm tra dữ liệu nhập. Giao diện mới được kiểm tra ở 320–1440 px, kể cả khi offline. Android Lint có 0 lỗi, 4 cảnh báo; 27 tệp web trong APK khớp byte với nguồn, chữ ký APK v2 hợp lệ.



Trên giả lập Android 15 đã cài đè 1.1.1 sau 10 lượt gacha và 1 lần cho ăn, giữ nguyên 11 loài, tài nguyên và tiến trình. Khi Wi-Fi/dữ liệu đều tắt và không có mạng mặc định, đã vào phế tích, dùng bình sương, vượt thủ vệ tầng 5 và nhận rương bằng các nút trong game. Đóng cưỡng bức rồi mở lại giữ đúng trận, HP, năng lượng, kết quả ngẫu nhiên và bộ phép đang đợi chọn. Kết quả ở `dist/ANDROID-RUINS-SMOKE.json` và `dist/BUILD-INFO.json`; chưa thử trên điện thoại thật.



Bản 1.3.0 qua **54 kiểm thử luật chơi và 29 kiểm thử giao diện**. Tất cả 55 loài gacha đã được quay ra bằng các vị trí tương ứng trong từng bậc, trên cả hai loại trứng phù hợp; kiểm tra thú SSR mới trùng, chăm sóc/tiến hóa, bản lưu có đủ 28 thú cũ và hoạt động đang chơi, các mốc sưu tầm mới. Toàn bộ 58 SVG được kiểm tra cú pháp, giới hạn khung hình, ID riêng và tham chiếu màu; giao diện lọc/tìm/sắp xếp, quay SSR mới, cài đặt chuyển động và chơi offline được kiểm tra ở 320–1440 px.



Trên giả lập Android 15 đã cài 1.2.0, quay 10 trứng và cho ăn một lần rồi cài đè 1.3.0; giữ nguyên 10 loài, tài nguyên, bảo hiểm, đội và hoạt động. Trong điều kiện Wi-Fi/dữ liệu đều tắt và không có mạng mặc định: mở sổ 58 loài, lọc 12 SSR, ngắm Long Thần Hư Không, quay ra SSR này bằng RNG thử nghiệm cố định qua nút ấp trứng, cho ăn; đóng cưỡng bức rồi mở lại giữ nguyên thú, XP, tài nguyên và thống kê. Android Lint có 0 lỗi, 4 cảnh báo cũ; chữ ký APK v2 hợp lệ, **31 tệp web trong APK khớp byte với nguồn**. Kết quả ở `dist/ANDROID-CREATURES-SMOKE.json`, `dist/BUNDLE-CHECK.json` và `dist/BUILD-INFO.json`. Chưa thử trên điện thoại thật.



Bản 1.3.1 qua **54 kiểm thử luật chơi và 32 kiểm thử giao diện**. Phần ngắm thú được kiểm tra rê chuột, phím mũi tên, kéo chạm thật qua CDP, thả tay về giữa, vuốt dọc để cuộn trên màn hình nhỏ và hai chế độ giảm chuyển động. Tất cả 58 hình SVG vẫn hợp lệ, có ID/tham chiếu màu riêng và nằm trong khung hình.



Trên giả lập Android 15 không có mạng mặc định, đã cài đè 1.3.0 có 13 loài, 10 lượt gacha và một lần cho ăn lên 1.3.1; thú, tài nguyên, bảo hiểm, đội và hoạt động giữ nguyên. Sổ 58 loài hiển thị tạo khối; kiểm tra kéo để ngắm cả Cáo Mầm và Long Thần Hư Không, thả về giữa và xác nhận thao tác ngắm không đổi tiến trình. Cho Cáo Mầm ăn lên cấp 2, đóng cưỡng bức rồi mở lại giữ đúng thú, XP, tài nguyên và thống kê. Android Lint có 0 lỗi, 4 cảnh báo cũ; chữ ký APK v2 hợp lệ, **34 tệp web trong APK khớp byte với nguồn**. Kết quả ở `dist/ANDROID-DEPTH-SMOKE.json`, `dist/BUNDLE-CHECK.json` và `dist/BUILD-INFO.json`. Chưa thử trên điện thoại thật.



Bản 1.4.0 qua **71 kiểm thử luật chơi và 37 kiểm thử giao diện**. Các kiểm thử mới chạy kỹ năng của cả 58 loài trong hai chế độ, hiệu ứng theo lượt, năm combo hệ, phối vai trò, năng lượng mang qua trận, thời gian chờ chính xác, thay đội, khóa đội khi đang đi và kết quả phế tích đồng nhất sau tải lại. Bản lưu trận cũ được kiểm tra nâng cấp; dữ liệu kỹ năng sai bị từ chối. Giao diện ở 320–1440 px và kỹ năng khi offline đều được kiểm tra. Sau khi chỉnh bố cục hàng chọn thú trên điện thoại, cả 5 kiểm thử giao diện kỹ năng được chạy lại và đạt.



APK 1.4.0 có Android Lint 0 lỗi, 4 cảnh báo cũ; chữ ký APK v2 hợp lệ và **38 tệp web trong APK khớp byte với nguồn**. Chi tiết ở `dist/BUNDLE-CHECK-1.4.0.json` và `dist/BUILD-INFO-1.4.0.json`.



Trên giả lập Android 15 tắt Wi-Fi/dữ liệu và không có mạng mặc định, đã cài đè 1.3.1 có 12 loài, 10 lượt gacha, một lần cho ăn và trận quần đảo đang chơi. Toàn bộ tiến trình được đối chiếu sau khi nâng cấp. Qua các nút thật trong WebView: dùng Mầm sống, kiểm tra khóa thay đội khi đang đi, rút lui rồi thay hai vị trí, vào phế tích, vượt bốn tầng và nối Gió dẫn lối → Lá phong xoay tại thủ vệ tầng 5. Combo Tán lá tạo 43 khiên, phối hợp đúng với các phép đang có; từng lượt phế tích khớp kết quả tính từ bản lưu trước lượt. Đóng cưỡng bức rồi mở lại ở cả quần đảo và phế tích giữ nguyên tiến trình, năng lượng, thời gian chờ, dấu ấn và hiệu ứng. Kết quả nằm ở `dist/ANDROID-TACTICS-SMOKE.json` và các bản lưu `dist/tactics-native-*.json`. Chưa thử trên điện thoại thật.



Bản 1.5.0 qua **90 kiểm thử luật chơi và 45 kiểm thử giao diện**. Phần mới kiểm tra cả 58 kỹ năng khi đánh boss, ba giai đoạn, rễ hồi sinh, phòng thủ đòn mạnh, 5 bậc thử thách, thắng/thua/rút lui, thưởng đầu và thưởng lặp, túi đầy, kết quả cố định khi tải lại, toàn bộ công thức/trang bị/nâng/ghép/tái chế và khóa đồ trong cả ba chế độ. Các kiểm thử xác nhận tác động thật lên sát thương, hồi phục và khiên; thao tác bị chặn không tiêu tài nguyên hoặc lượt. Bản cũ đang chiến đấu được nâng cấp và dữ liệu hỏng bị từ chối.



Giao diện boss, xưởng và hộp thoại mới được kiểm tra ở 320–1440 px; hiệu ứng của cả ba chế độ, hai lựa chọn giảm chuyển động, ô diễn biến khi đấu trường ngoài màn hình và chơi offline đều đạt. APK 1.5.0 có Android Lint **0 lỗi, 4 cảnh báo cũ**, chữ ký v2 hợp lệ và **47 tệp web khớp byte với nguồn**. Báo cáo ở `dist/BUNDLE-CHECK-1.5.0.json` và `dist/BUILD-INFO-1.5.0.json`.



Trên giả lập Android 15 đã cài đè 1.4.0 có 11 loài, 10 lượt gacha, một lần cho ăn và trận quần đảo đang chơi; đối chiếu toàn bộ trường tiến trình sau nâng cấp. Khi không có mạng mặc định, dùng các nút trong WebView để mở hòm, chế ba món, trang bị Chim Than Hồng/Kỳ Nhông Mây và ghép Bùa Nanh Rễ lên cấp 2. Đóng cưỡng bức rồi mở lại giữ nguyên trang bị và đồ đã ghép. Đánh thắng Cổ Mộc qua cả ba giai đoạn, kiểm tra khóa đội, tiếp tục giữa giai đoạn 2 sau khi đóng cưỡng bức, nhận đồ/nguyên liệu và mở lại giữ nguyên phần thưởng. Từng lượt được đối chiếu với luật chơi dùng cùng trạng thái ngẫu nhiên. Kết quả ở `dist/ANDROID-GUARDIAN-SMOKE.json`, các bản lưu `dist/guardian-native-*.json` và ảnh Android trong `dist/screenshots/`. Chưa thử trên điện thoại thật.



Bản 1.6.0 qua **102 kiểm thử luật chơi và 54 kiểm thử giao diện**: toàn bộ 53 kiểm thử giao diện chính, cộng kiểm thử riêng cho tín hiệu tạm dừng/tiếp tục Android. Luật mới kiểm tra biên vùng nhịp, lượng tăng sát thương/hồi phục/khiên thật, giảm đòn mạnh, đủ 100 điểm ngắt cả ý định hồi máu/hút năng lượng/dựng khiên, phần dư và sơ hở chỉ dùng một lần. Kiểm tra cả 58 chiêu khi canh hoàn hảo, bản lưu trận cũ, từ chối dữ liệu hỏng, thao tác bị chặn không đổi RNG/lượt, tiếp tục đồng nhất sau tải lại và nhận thưởng đúng một lần.



Giao diện sàn đấu được kiểm tra ở 320×640 đến 1440×1000, chốt bằng phím cách/chạm, đổi chiêu, bỏ canh nhịp, nút quay lại hai bước, tải lại giữa lúc ngắm, chuỗi gồng đòn/va chạm/phản công, hai lựa chọn giảm chuyển động và trận boss hoàn chỉnh qua ba giai đoạn. Kiểm thử offline nâng bản lưu cũ, thao tác chạm, lưu phá thế và không mất tiến độ. APK có Android Lint **0 lỗi, 4 cảnh báo cũ**, chữ ký v2 hợp lệ và **50 tệp web khớp byte với nguồn**. Báo cáo của bản này được giữ ở `dist/BUNDLE-CHECK-1.6.0.json` và `dist/BUILD-INFO-1.6.0.json`.



Trên giả lập Android 15 đã cài đè 1.5.0 có 12 loài, 10 lượt gacha, một lần cho ăn, đồ đã chế/trang bị và trận Cổ Mộc đang chơi; toàn bộ trường tiến trình khớp bản lưu đã di chuyển. Khi Wi-Fi/dữ liệu đều tắt và không có mạng mặc định, dùng các nút thật trên WebView với đồng hồ kiểm thử điều khiển để đỡ hoàn hảo, giữ điểm phá thế sau khi đóng cưỡng bức, hủy phần ngắm chưa chốt khi mở lại, ngắt ý định địch và dùng sơ hở. Thao tác HOME rồi đưa ứng dụng lên lại xác nhận kim giữ nguyên pha, không tính thời gian ngoài app. Trận thắng qua ba giai đoạn; từng lượt và phần thưởng được đối chiếu với cùng trạng thái ngẫu nhiên. Đóng cưỡng bức sau chiến thắng giữ nguyên toàn bộ tiến trình và món đồ rơi ra. Kết quả ở `dist/ANDROID-ACTIVE-COMBAT-SMOKE.json`, các bản lưu `dist/active-combat-native-*.json` và ảnh Android trong `dist/screenshots/`. Chưa thử trên điện thoại thật.



Bản 1.7.0 qua **102 kiểm thử luật chơi và 56 kiểm thử giao diện**. Kiểm tra mới xác nhận tất cả nút HUD, hoạt động, công trình, linh thú và thanh chức năng nằm trong màn hình, chạm được ở 320×720 đến 1440×1000. Quà mỗi ngày, nhiệm vụ hoàn thành và thu hoạch tác động lên tiến trình thật; tải lại không nhận thưởng hai lần. Đội hình thu gọn vẫn đổi được thú, xem phối đội và kỹ năng. Toàn bộ kiểm thử chiến đấu, gacha, câu cá, lai tạo, xây dựng, trang bị và offline tiếp tục đạt.



APK có Android Lint **0 lỗi, 4 cảnh báo cũ**, chữ ký v2 cùng khóa ký với 1.6.0 và **52 tệp web khớp byte với nguồn**. Trên giả lập Android 15, cài đè bản 1.6.0 đã ấp 10 trứng, cho ăn, chế/trang bị đồ và đang đánh Cổ Mộc giữ nguyên tất cả trường tiến trình. Khi Wi-Fi/dữ liệu đều tắt và không có mạng mặc định, thao tác qua sáu màn, bốn lối vào hoạt động, chi tiết thú, cài đặt, sàn đấu và nút quay lại Android. Kiểm tra nhận quà đom đóm, HOME/tiếp tục và đóng cưỡng bức giữ nguyên phần thưởng và tiến trình. Chưa thử trên điện thoại thật.



Báo cáo của 1.7.0 ở `dist/BUILD-INFO-1.7.0.json`, `dist/BUNDLE-CHECK-1.7.0.json`, `dist/GAME-UI-BROWSER-RESULTS.json` và `dist/ANDROID-GAME-UI-SMOKE.json`. Ảnh màn đảo Android: `dist/screenshots/game-ui-native-lobby-1.7.0.png`.



Bản 1.8.0 qua **115 kiểm thử luật chơi và 63 kiểm thử giao diện**; sau khi bổ sung hiển thị thế đã lưu ở lối vào sàn, chạy lại 16 kiểm thử chiến đấu liên quan đều đạt. Kiểm tra mới bao phủ ba thế và phần đánh đổi, năng lượng/rủi ro Lấy đà, điều kiện đỡ hoàn hảo, hai hiệu ứng không cộng dồn và dùng một lần, bảo toàn qua hỗ trợ thuần túy, chặt rễ, di chuyển bản lưu cũ và từ chối dữ liệu hỏng. Kiểm tra xem trước khớp sát thương thật, hồi phục, khiên, lượt kết thúc và các biên ngẫu nhiên; mở xem nhiều lần không đổi bản lưu hoặc nhận thưởng. Cả 58 loài dùng được hiệu ứng mới. Giao diện được kiểm tra trong cả ba chế độ, thao tác chạm/phím cách, Android Back, tải lại, cảnh báo gục, offline và các màn hình từ 320 × 640.



APK 1.8.0 có Android Lint **0 lỗi, 4 cảnh báo cũ**, chữ ký v2 cùng khóa ký với 1.7.0 và **54 tệp web khớp byte với nguồn**. Trên giả lập Android 15, cài đè 1.7.0 có 10 lượt gacha, cho ăn, đồ đã chế/trang bị và trận Cổ Mộc đang chơi giữ nguyên toàn bộ tiến trình. Khi Wi-Fi/dữ liệu đều tắt và không có mạng mặc định, dùng nút trong WebView để đổi thế, xem trước, hủy bằng Back, đỡ hoàn hảo, Lấy đà, kết hợp cả hai hiệu ứng, nhắm rễ và thắng qua ba giai đoạn. Từng lượt khớp xem trước và luật chơi cùng trạng thái ngẫu nhiên. Thực hiện HOME/tiếp tục giữa lúc canh nhịp xác nhận kim giữ nguyên pha; đóng cưỡng bức giữ cả Lấy đà/Phản kích/thế đã chọn và toàn bộ phần thưởng sau chiến thắng. Chưa thử trên điện thoại thật.



Báo cáo 1.8.0: `dist/BUILD-INFO-1.8.0.json`, `dist/BUNDLE-CHECK-1.8.0.json`, `dist/COMBAT-ORDERS-BROWSER-RESULTS.json`, `dist/COMBAT-ENTRY-BROWSER-RESULTS.json` và `dist/ANDROID-COMBAT-ORDERS-SMOKE.json`. Kiểm tra bổ sung hiển thị khiên Rùa Cuội: `dist/COMBAT-SHIELD-PREVIEW-BROWSER-RESULTS.json`. Bản lưu kiểm chứng ở `dist/combat-native-*.json`, ảnh ở `dist/screenshots/combat-*-1.8.0.png`.



Bản 1.9.0 qua **136 kiểm thử luật chơi và 73 kiểm thử giao diện**, thêm 11 lượt kiểm tra tập trung cho boss mới và trận Cổ Mộc. Bao phủ chiến thuật giáp/pháp sư/cuồng nộ ở cả quần đảo và phế tích, đóng băng/tan băng, lõi/tái sinh, di chuyển bản lưu, dữ liệu hỏng, lệnh bị từ chối không đổi trạng thái, phần thưởng riêng và túi đầy. Cả 58 chiêu được kiểm tra trên hai boss mới; xem trước dùng cùng luật thật và không thay đổi bản lưu. Đội khởi đầu thắng cả ba boss bậc 1 với nhiều trạng thái ngẫu nhiên bằng chiến thuật phù hợp. Giao diện và nút chốt được kiểm tra từ 320×640, chơi offline cả hai boss và phục hồi sau tải lại.



APK 1.9.0 có Android Lint **0 lỗi, 4 cảnh báo cũ**, chữ ký v2 cùng khóa với 1.8.0 và **57 tệp web khớp byte với nguồn**. Báo cáo hiện tại: `dist/BUILD-INFO.json`, `dist/BUNDLE-CHECK.json`, `dist/ENGINE-1.9.0.tap`, `dist/ENEMY-BOSSES-BROWSER-RESULTS.json` và `dist/ENEMY-BOSSES-FOCUSED-BROWSER-RESULTS.json`.



Trên giả lập Android 15, cài đè 1.8.0 sau 10 lượt gacha, cho ăn, chế/mang đồ và một lượt Cổ Mộc giữ nguyên toàn bộ tiến trình. Tắt Wi-Fi/dữ liệu và xác nhận không có mạng mặc định. Tiếp tục trận cũ, rồi dùng các tình huống boss được chuẩn bị riêng trong giả lập để thử đóng băng, chiêu Hỏa làm tan/ngắt bão, nhắm/phá lõi, chặn tái sinh và nhận đồ riêng. Từng lượt được đối chiếu với xem trước và luật chơi cùng trạng thái ngẫu nhiên. Đóng cưỡng bức giữ đúng băng, lõi đã phá, lần tái sinh đã dùng và chiến lợi phẩm. Nút Back hủy phần ngắm lõi; HOME/tiếp tục giữ đúng pha kim. APK đang cài trên giả lập có SHA-256 khớp tệp giao cho người dùng. Báo cáo ở `dist/ANDROID-ENEMY-BOSSES-SMOKE.json`, bản lưu `dist/enemy-native-*.json` và ảnh `dist/screenshots/*native*-1.9.0.png`. Chưa thử trên điện thoại thật.



Bản 1.10.0 qua **148 kiểm thử luật chơi và 80 kiểm thử giao diện**, thêm **20 kiểm tra liên quan** sau lần rà cuối hiển thị vai trò. Kiểm tra gồm 1.044 tình huống của cả 116 nhánh ở 3 bậc trong 3 chế độ; chi phí và khóa thao tác, đổi miễn phí, vai trò/phối đội, giữ Lấy đà/Phản kích qua hỗ trợ, giáp/ngắt phép, điều kiện bộ đồ, giới hạn khiên, đốt của đúng người mang, xem trước không đổi tiến trình và tiếp tục sau tải lại. Giao diện chọn nhánh/trang bị vừa từ 320×640, chơi offline và dùng được chế độ giảm chuyển động.



APK 1.10.0 có Android Lint **0 lỗi, 4 cảnh báo cũ**, chữ ký v2 cùng khóa với 1.9.0 và **61 tệp web khớp byte với nguồn**. Trên giả lập Android 15, cài đè 1.9.0 có 10 lượt gacha, cho ăn, đồ đã chế/mang và trận Cổ Mộc giữ nguyên mọi trường tiến trình. Sau đó dùng một tình huống riêng có thú cấp 15 và đồ boss trong giả lập để thao tác mở/nâng bậc 3, đổi nhánh/gốc miễn phí, đổi vai trò Bảo hộ và mang đủ hai bộ qua giao diện. Khi Wi-Fi/dữ liệu đều tắt và không có mạng mặc định, đỡ hoàn hảo tạo khiên Vĩnh Đông, chiêu Hỏa tâm cùng Vũ Hỏa tăng đốt; từng lượt khớp xem trước và luật chơi cùng trạng thái ngẫu nhiên. Đóng cưỡng bức giữ bậc, đồ, khiên, đốt và chiến lợi phẩm sau chiến thắng. Back hủy ngắm; HOME/tiếp tục giữ pha kim. System UI của giả lập được khởi động lại một lần trong kiểm tra nút điều hướng; không thay mã game. APK đang cài có SHA-256 khớp đúng tệp phát hành. Chưa thử trên điện thoại thật.



Báo cáo: `dist/BUILD-INFO.json`, `dist/BUNDLE-CHECK.json`, `dist/ENGINE-1.10.0.tap`, `dist/SKILL-PATHS-BROWSER-RESULTS.json`, `dist/SKILL-PATHS-FINAL-BROWSER-RESULTS.json`, `dist/ANDROID-SKILL-PATHS-SMOKE.json`. Bản lưu ở `dist/skills-native-*.json`, ảnh giao diện trong `dist/screenshots/*1.10.0.png`.



## Biên dịch APK



Cần JDK 17, Android SDK Platform 35 và Build Tools 35.0.0:



```powershell

$env:JAVA_HOME = 'C:\path\to\jdk-17'

npm run build:android

```



Hoặc truyền vị trí cụ thể:



```powershell

.\scripts\build-android.ps1 -JavaHome 'C:\path\to\jdk-17' -SdkRoot 'C:\path\to\Android\Sdk'

```



Kết quả: `dist/DaoLinhThu-1.27.0.apk`. Gradle chép trực tiếp thư mục `web/` vào APK, vì vậy bản Android và bản trình duyệt dùng cùng một mã nguồn. Vỏ Android chỉ nạp tài nguyên đóng gói từ nguồn HTTPS ảo; không phụ thuộc máy chủ game.



## Cấu trúc



- `web/js/engine.js`: luật chơi thuần JavaScript, lưu/khôi phục và kiểm tra dữ liệu.

- `web/js/enemy-tactics.js`: giáp phản kích, tụ/ngắt phép, cuồng nộ và kiểm tra dữ liệu đối thủ.

- `web/js/boss-state.js`, `boss-engine.js`, `boss-ui.js`, `boss-art.js`: ba thủ vệ, tiến trình riêng, cơ chế băng/lõi/tái sinh và hình vẽ.

- `web/js/data.js`: loài, hệ, nhiệm vụ, công trình và vùng đất.

- `web/js/art.js`: hình vẽ SVG riêng cho thú, đảo, trứng và vùng khám phá.

- `web/js/creature-faces.js`: nét mắt, mõm/mỏ, miệng, biểu cảm và dấu mặt của 58 loài.

- `web/js/app.js`: tương tác, các màn chơi, âm thanh và tự lưu.

- `web/js/game-ui.js`, `web/game-ui.css`: sảnh đảo, HUD, thanh chức năng và phong cách giao diện game.

- `web/js/combat-orders.js`, `web/js/combat-preview.js`: thế trận, Lấy đà, Phản kích, mục tiêu và xem trước bằng bản sao của luật chiến đấu thật.

- `web/js/activities-*.js`, `web/activities.css`: dữ liệu, hình SVG và giao diện của bến câu và vườn lai tạo.

- `web/js/ruins-route.js`, `ruins-route-ui.js`, `web/ruins-route.css`: bản đồ có đường nối, cuộc gặp, tinh anh và bộ phước lành chuyến 10 điểm.

- `web/js/ruins-*.js`, `web/ruins.css`: dữ liệu, luật chơi, kiểm tra bản lưu, hình SVG và giao diện Phế Tích Cổ.

- `web/js/skill-paths.js`, `skill-training.js`, `skill-training-ui.js`, `web/skill-paths.css`: nhánh kỹ năng, luyện bậc, lựa chọn và hiển thị bộ đồ.

- `web/js/tactics*.js`, `web/tactics.css`: 58 kỹ năng, vai trò, phối đội, combo, trạng thái chiến đấu và giao diện chọn chiêu.

- `web/js/boss-*.js`: luật chơi, bản lưu và giao diện Săn Thủ Vệ.

- `web/js/forge-*.js`: công thức, vật phẩm, nguyên liệu, quản lý và giao diện trang bị.

- `web/js/guardian-art.js`, `web/js/combat-fx.js`, `web/guardian.css`: hình thủ vệ/trang bị, hiệu ứng ba chế độ và bố cục tương ứng.

- `web/js/combat-rhythm.js`, `web/js/combat-stage.js`, `web/combat-stage.css`: luật canh nhịp/phá thế, sàn đấu chủ động, hoạt cảnh và tạm dừng khi rời ứng dụng.

- `android/`: vỏ Android Java, tích hợp nút quay lại và trình chọn tệp sao lưu.

- `tests/`: kiểm thử luật chơi và các luồng người chơi.



Font Be Vietnam Pro được đóng gói theo SIL Open Font License, xem `web/assets/FONT-LICENSE.txt`. Font Lora lấy từ [Google Fonts](https://github.com/google/fonts/tree/main/ofl/lora), giấy phép trong `web/assets/LORA-LICENSE.txt`. Hình ảnh trong game được vẽ bằng SVG, không tải ảnh từ bên ngoài.



Bản 1.11.0 qua **170 kiểm thử luật chơi và 92 kiểm thử trình duyệt**, cùng 14 kiểm tra tập trung Võ đường/lobby và 3 kiểm tra cuối về danh hiệu/bố cục. Tất cả 8 ải có lời giải đủ 3 sao được chạy qua luật thật và nút giao diện; xem trước khớp từng lượt, mở/xem/hủy không đổi tiến trình. Kiểm tra cả lưu giữa trận, từ chối dữ liệu hỏng/lồng sân tập, tích sao qua nhiều trận, dừng/thua không ghi sao, giới hạn 60 lượt, thưởng một lần, thử nhánh miễn phí, giữ nguyên chuyến đi thật, màn hình 320–1440 px, chuyển động giảm và tải lại offline.

APK 1.11.0 có **66 tệp web khớp byte với nguồn**, chữ ký v2 cùng khóa 1.10.0; Android Lint **0 lỗi, 4 cảnh báo cũ**. Trên giả lập Android 15 đã cài đè bản 1.10.0 sau khi ấp 10 trứng, cho ăn, chế/đeo đồ, luyện nhánh và mở trận Cổ Mộc. Toàn bộ tiến trình được giữ. Khi tắt Wi-Fi/dữ liệu và không có mạng mặc định, đã thử nhánh Phá giáp/Bảo hộ ở phòng tập, Back hủy nước đi, HOME tạm dừng nhịp, khôi phục buổi tập sau force-stop, thắng ải phản kích 3 sao, nhận mốc 3 sao, phá lõi Phượng Hoàng và nhận/bật danh hiệu, hào quang, bia chiến công. Tiến trình 7 ải cuối được tạo bằng bộ dữ liệu kiểm thử chỉ trong giả lập riêng; mọi nước đi, nhận quà và trang trí sau đó thao tác qua giao diện. Giao diện hệ thống giả lập từng báo ANR cho **com.android.systemui**; đóng giao diện hệ thống rồi khôi phục kiểm tra từ bản chụp đã xác nhận, các kiểm tra Back/HOME và lưu tiếp sau đó đều đạt. Không thay mã game vì sự cố này. Chưa thử trên điện thoại thật.

Báo cáo 1.11.0: `dist/BUILD-INFO-1.11.0.json`, `dist/BUNDLE-CHECK-1.11.0.json`, `dist/ENGINE-1.11.0.tap`, `dist/BROWSER-1.11.0.json`, `dist/DOJO-BROWSER-1.11.0.json`, `dist/DOJO-FINAL-VISUAL-BROWSER-1.11.0.json`, `dist/ANDROID-DOJO-SMOKE.json`, `dist/DOJO-NATIVE-FINAL-VISUAL.json` và `dist/INSTALLED-APK-1.11.0.json`. Bản 1.10 được lưu trong `dist/source-1.10.0.zip`, `dist/BUILD-INFO-1.10.0.json`, `dist/BUNDLE-CHECK-1.10.0.json` và APK 1.10.0. Ảnh ở `dist/screenshots/dojo-*-1.11.0.png`.
