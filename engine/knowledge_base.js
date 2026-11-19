/**
 * 2Guide Knowledge Base & Verified Dossiers
 * Kho tri thức chuẩn xác và toàn diện về Di tích Lịch sử Nhà tù Hỏa Lò:
 * 1. 13 Hồ sơ phân khu & hiện vật lịch sử chi tiết.
 * 2. Hồ sơ nghiệp vụ dịch vụ khách hàng (Vé, giờ mở cửa, tiện ích, khiếu nại, trợ năng).
 * 3. Bộ 500 câu hỏi - đáp tham chiếu chuẩn sử học (Ground Truth).
 */

const fs = require('fs');
const path = require('path');
const nlp = require('./nlp_processor');

// 1. HỒ SƠ 13 PHÂN KHU & HIỆN VẬT LỊCH SỬ
const HISTORICAL_EXHIBITS = {
  may_chem: {
    id: 'may_chem',
    name: 'Máy chém (Guillotine)',
    category: 'Máy chém & Công cụ tra tấn',
    keywords: ['may chem', 'guillotine', 'luoi dao', '4m', '50kg', 'nguyen thai hoc', 'yen bai', 'hanh quyet', 'tu hinh', 'toa an de hinh'],
    facts: [
      'Máy chém cao gần 4 mét, cột dựng bằng hai thanh gỗ lim song song.',
      'Lưỡi dao bằng thép vát chéo nặng 50kg, gắn kèm quả tạ chì trượt từ trên đỉnh xuống.',
      'Máy chém được thiết kế cơ động, có thể tháo rời để thực dân Pháp đưa đi hành quyết lưu động khắp Bắc Kỳ.',
      'Sáng ngày 17/6/1930, thực dân Pháp chuyển máy chém từ Hỏa Lò lên thị xã Yên Bái để hành quyết nhà yêu nước Nguyễn Thái Học cùng 12 nghĩa sĩ khởi nghĩa Yên Bái.',
      'Đồng chí Hoàng Văn Thụ không bị xử bằng máy chém mà bị xử bắn tại trường bắn Tương Mai (Hà Nội) ngày 24/5/1944.'
    ],
    directAnswer: 'Cỗ máy chém tại Nhà tù Hỏa Lò cao gần 4 mét với lưỡi dao thép vát chéo nặng 50kg rơi từ trên cao xuống. Thực dân Pháp dùng cỗ máy chém lưu động này để khủng bố phong trào yêu nước, tiêu biểu là việc đưa máy lên Yên Bái hành quyết nhà cách mạng Nguyễn Thái Học và 12 nghĩa sĩ năm 1930.'
  },

  cay_bang: {
    id: 'cay_bang',
    name: 'Cây bàng lịch sử',
    category: 'Sân trại giam & Cây bàng lịch sử',
    keywords: ['cay bang', 'la bang', 'bup bang', 'hat bang', 'canh bang', 'kiet ly', 'chua benh', 'quan but', 'tra bang', 'thach bang'],
    facts: [
      'Cây bàng cổ thụ trong sân trại giam được các cựu tù chính trị coi là người bạn tri kỷ và vị cứu tinh.',
      'Lá bàng bánh tẻ và búp bàng non được dùng để nhai hoặc sắc lấy nước uống chữa bệnh kiết lỵ, tiêu chảy rất hiệu nghiệm.',
      'Vỏ bàng dùng sắc nước rửa sạch các vết thương do tra tấn.',
      'Cành bàng được mài nhọn gọt giũa làm quản bút để viết tài liệu, báo chí bí mật.',
      'Hạt bàng đập lấy nhân giàu dầu và dinh dưỡng bồi dưỡng cho những đồng chí ốm nặng.',
      'Hiện nay trong tour đêm "Đêm thiêng liêng", du khách được thưởng thức các sản phẩm văn hóa ẩm thực tri ân từ cây bàng như trà bàng và thạch bàng.'
    ],
    directAnswer: 'Cây bàng cổ thụ tại sân trại giam Hỏa Lò là người bạn tri kỷ của tù nhân: búp và lá non dùng làm thuốc chữa khỏi bệnh kiết lỵ, cành bàng được mài làm quản bút viết báo bí mật, còn nhân hạt bàng bồi bổ sức khỏe cho tù nhân ốm nặng.'
  },

  vuot_nguc_1945: {
    id: 'vuot_nguc_1945',
    name: 'Cuộc vượt ngục tháng 3/1945 (Thời cơ Nhật đảo chính)',
    category: 'Vượt ngục & Đấu tranh',
    keywords: ['1945', '100 can bo', 'hon 100', 'nhat dao chinh', 'treo tuong', 'thang 3 1945', 'giai thoat hon 100', 'giai thoat hon 100 can bo'],
    facts: [
      'Cuộc vượt ngục giải thoát hơn 100 cán bộ cách mạng diễn ra vào tháng 3/1945 nhân thời cơ Nhật đảo chính Pháp.',
      'Lợi dụng tình hình hỗn loạn giữa quân Nhật và binh lính Pháp, các chiến sĩ cách mạng đã mưu trí trèo tường và cải trang để thoát ngục thành công.',
      'Lực lượng cán bộ vượt ngục này đã kịp thời trở về các địa phương lãnh đạo phong trào, bổ sung cán bộ cốt cán cho Tổng khởi nghĩa Cách mạng Tháng Tám năm 1945.'
    ],
    directAnswer: 'Cuộc vượt ngục giải thoát hơn 100 cán bộ cách mạng diễn ra vào tháng 3/1945 nhân thời cơ Nhật đảo chính Pháp. Các chiến sĩ đã mưu trí trèo tường và cải trang để trở về với phong trào cách mạng, kịp thời bổ sung lực lượng lãnh đạo Tổng khởi nghĩa Cách mạng Tháng Tám 1945.'
  },

  cong_ngam: {
    id: 'cong_ngam',
    name: 'Đường cống ngầm & Vượt ngục 1951',
    category: 'Cống ngầm & Vượt ngục lịch sử',
    keywords: ['cong ngam', 'vuot nguc 1951', 'song sat', 'noel', '24 12 1951', '1951', 'tho nhuom', 'quan su', 'cua song', '16 tu tu', '5 dong chi'],
    facts: [
      'Đêm Noel 24/12/1951: 16 tử tù chính trị đã bí mật cưa song sắt cống ngầm bằng những lưỡi dũa nhỏ giấu kín, chui qua đường cống ngầm bùn lầy chật hẹp thoát ra mặt đường phố Thợ Nhuộm (khu vực Quán Sứ).',
      'Trong vụ vượt ngục đêm Noel 1951, 5 đồng chí đã thoát thành công ra vùng tự do kháng chiến an toàn, số còn lại không may bị địch truy bắt lại.'
    ],
    directAnswer: 'Hệ thống cống ngầm Hỏa Lò ghi dấu vụ vượt ngục huyền thoại đêm Noel 24/12/1951 của 16 tử tù chính trị sau khi cưa song sắt cống ngầm để thoát ra phố Thợ Nhuộm, trong đó có 5 đồng chí đã trở về vùng căn cứ kháng chiến an toàn.'
  },

  cachot: {
    id: 'cachot',
    name: 'Ngục tối (Cachot)',
    category: 'Ngục tối Cachot',
    keywords: ['cachot', 'nguc toi', 'biet giam', 'cum chan', 'be xi mang', 'nghieng', 'mau don', 'phu ne', 'dia nguc'],
    facts: [
      'Cachot là khu ngục tối biệt giam dùng để trừng phạt những tù nhân bị coi là chống đối hoặc nguy hiểm.',
      'Phòng giam chật hẹp, tối đen như mực, không có ánh sáng tự nhiên và cực kỳ thiếu dưỡng khí.',
      'Tù nhân bị cùm chân cả ngày lẫn đêm trên bệ xi măng có độ nghiêng dốc ngược, khiến chân cao hơn đầu.',
      'Tư thế giam cầm dốc ngược khiến máu dồn lên não, gây phù nề mắt, mù lòa, lở loét và hoại tử da thịt.',
      'Cachot được người tù mệnh danh là "địa ngục của địa ngục" chốn trần gian.'
    ],
    directAnswer: 'Ngục tối Cachot được mệnh danh là "địa ngục của địa ngục", nơi tù nhân bị cùm chặt chân trên bệ xi măng nghiêng dốc trong bóng tối hoàn toàn, khiến máu dồn ngược lên não gây phù nề, mù lòa và kiệt quệ thể xác.'
  },

  khu_d_tu_hinh: {
    id: 'khu_d_tu_hinh',
    name: 'Khu D & Xà lim tử hình',
    category: 'Khu D & Xà lim tử hình',
    keywords: ['khu d', 'xa lim tu hinh', 'tu tu', 'buong so 1', 'hoang van thu', 'do nhuan', 'ao len', 'tuong mai', 'an chem'],
    facts: [
      'Khu D là khu vực biệt giam xà lim án chém, nơi giam giữ các tử tù chính trị chờ ngày thi hành án.',
      'Buồng số 1 Khu D từng giam giữ đồng chí Hoàng Văn Thụ - Ủy viên Thường vụ Trung ương Đảng.',
      'Trước khi bị xử bắn sáng 24/5/1944 tại Tương Mai, đồng chí Hoàng Văn Thụ đã để lại khí phách hiên ngang và bài thơ nhắn nhủ đồng chí.',
      'Tại đây diễn ra câu chuyện xúc động về chiếc áo len: nhạc sĩ Đỗ Nhuận nhường áo và bà Phạm Thị Vân bí mật đan áo len gửi tặng đồng chí Hoàng Văn Thụ giữ ấm.'
    ],
    directAnswer: 'Khu D là dãy xà lim giam giữ các chiến sĩ cách mạng bị kết án tử hình. Buồng số 1 từng giam giữ đồng chí Hoàng Văn Thụ với tinh thần bất khuất trước khi hy sinh tại trường bắn Tương Mai năm 1944.'
  },

  phong_giam_tap_the: {
    id: 'phong_giam_tap_the',
    name: 'Phòng giam tập thể',
    category: 'Khu phòng giam tập thể',
    keywords: ['phong giam tap the', 'trai nam', 'trai e', 'trai g', 'be cum chan', 'cap rang', 'song sat mat cao', 'ngot ngat'],
    facts: [
      'Phòng giam tập thể nam (Trại E, G) từng giam giữ hàng trăm tù nhân chen chúc trên hai dãy bệ xi măng.',
      'Chân tù nhân bị khóa cố định vào thanh cùm sắt dài dọc bệ xi măng vào ban đêm.',
      'Cửa sổ được bọc lưới sắt mắt cáo dày đặc nhằm ngăn cách tiếp tế và âm thanh.',
      'Thực dân Pháp sử dụng tù thường phạm làm "cập rằng" để giám sát, đánh đập tù chính trị.',
      'Các chiến sĩ đã biến phòng giam tập thể thành trường học cách mạng, truyền dạy văn hóa và lý luận chính trị.'
    ],
    directAnswer: 'Phòng giam tập thể Hỏa Lò từng giam hàng trăm tù nhân bị khóa chân trên bệ cùm xi măng dài ngột ngạt. Bất chấp đòn roi của cai ngục và cập rằng, các chiến sĩ đã kiên cường biến nơi đây thành trường học cách mạng.'
  },

  trai_nu: {
    id: 'trai_nu',
    name: 'Khu trại giam Nữ',
    category: 'Khu trại giam Nữ & Tù nhi',
    keywords: ['trai nu', 'tu nu', 'nguyen thi minh khai', 'hoang ngan', 'truong thi my', 'tuyet thuc', 'con tho', 'tu nhi'],
    facts: [
      'Khu trại giam Nữ giam giữ các nữ tù nhân chính trị, nhiều người mang theo con thơ hoặc sinh con ngay trong ngục tối.',
      'Nơi đây từng giam giữ các nữ chiến sĩ kiên trung như đồng chí Nguyễn Thị Minh Khai, Hoàng Ngân, Trương Thị Mỹ.',
      'Các nữ tù đã dũng cảm tổ chức nhiều cuộc tuyệt thực kéo dài ngày đòi nước sinh hoạt, sữa cho con nhỏ và chống đánh đập.',
      'Chị em còn tranh thủ học tập văn hóa, thêu thùa và chăm sóc động viên nhau giữ vững niềm tin cách mạng.'
    ],
    directAnswer: 'Khu trại giam Nữ ghi dấu tinh thần quả cảm của các nữ tù chính trị như đồng chí Nguyễn Thị Minh Khai, Hoàng Ngân. Dù bị giam cầm cùng con thơ trong thiếu thốn, các nữ chiến sĩ vẫn đoàn kết tuyệt thực đấu tranh bảo vệ quyền sống.'
  },

  phi_cong: {
    id: 'phi_cong',
    name: 'Khu trưng bày phi công Mỹ ("Hanoi Hilton")',
    category: 'Khu phi công Mỹ (1964–1973)',
    keywords: ['phi cong', 'hanoi hilton', 'john mccain', 'pete peterson', 'ban roi', '1964 1973', 'truc bach', 'trao tra'],
    facts: [
      'Từ năm 1964 đến 1973, Nhà tù Hỏa Lò là nơi tạm giam các phi công Mỹ bị bắn rơi ở miền Bắc.',
      'Các phi công Mỹ gọi nơi đây bằng biệt danh châm biếm là "Hanoi Hilton".',
      'Phi công nổi tiếng có Trung úy Hải quân John McCain (bị bắn rơi tại hồ Trúc Bạch ngày 26/10/1967) và Douglas "Pete" Peterson (sau này là Đại sứ Mỹ đầu tiên tại Việt Nam).',
      'Chính phủ Việt Nam đã thực hiện chính sách đối xử nhân đạo: chăm sóc y tế, bảo đảm dinh dưỡng, cho phép nhận thư gia đình và tổ chức lễ Giáng sinh.',
      'Toàn bộ tù binh phi công Mỹ được trao trả tự do vào đầu năm 1973 sau Hiệp định Paris.'
    ],
    directAnswer: 'Giai đoạn 1964–1973, Hỏa Lò tạm giam các phi công Mỹ bị bắn rơi (được gọi là "Hanoi Hilton"), tiêu biểu có John McCain và Pete Peterson. Họ đã được hưởng chính sách nhân đạo và chăm sóc y tế chu đáo trước khi được trao trả năm 1973.'
  },

  maison_centrale: {
    id: 'maison_centrale',
    name: 'Cổng chính & Kiến trúc Maison Centrale',
    category: 'Cổng chính & Kiến trúc tổng thể',
    keywords: ['maison centrale', '1896', 'cong chinh', 'lang hoa lo', 'phu khanh', 'kien truc', 'tuong bao', 'manh chai', 'so 1 pho hoa lo'],
    facts: [
      'Nhà tù Hỏa Lò được thực dân Pháp xây dựng năm 1896, mang tên tiếng Pháp là "Maison Centrale" (Ngục Trung ương).',
      'Địa điểm xây dựng vốn là đất làng Phụ Khánh (tổng Vĩnh Xương, huyện Thọ Xương, Hà Nội) - làng nghề làm ấm đất và bếp hỏa lò nung gốm đỏ lửa quanh năm, do đó người dân quen gọi là Hỏa Lò.',
      'Hệ thống tường bao bằng đá kiên cố cao khoảng 4m, dày 0.5m, phía trên cắm mảnh chai thủy tinh sắc nhọn và chăng dây thép gai.',
      'Diện tích ban đầu của nhà tù rộng gần 13.000 m2; hiện nay khu di tích bảo tồn có diện tích hơn 2.400 m2.'
    ],
    directAnswer: 'Nhà tù Hỏa Lò do thực dân Pháp xây dựng năm 1896 mang tên Maison Centrale (Ngục Trung ương) trên nền làng nghề nặn bếp lò gốm Phụ Khánh xưa. Công trình có tường bao đá cao 4m cắm mảnh chai sắc nhọn kiên cố bậc nhất Bắc Kỳ.'
  },

  hien_vat_sinh_hoat: {
    id: 'hien_vat_sinh_hoat',
    name: 'Hiện vật sinh hoạt & Báo chí bí mật',
    category: 'Trường học cách mạng & Hiện vật',
    keywords: ['but canh bang', 'gach non', 'muoi than', 'bao chi bi mat', 'lao tu', 'bua liem', 'sinh hoat', 'truong hoc cach mang'],
    facts: [
      'Người tù đã mài cành bàng thành ngòi bút chấm mực.',
      'Dùng bột gạch non màu đỏ hoặc muội than củi hòa với nước để làm mực viết trên giấy vệ sinh hoặc vải vụn.',
      'Các tờ báo cách mạng bí mật như báo "Lao Tù", báo "Búa Liềm" được chép tay cẩn thận và chuyền tay nhau đọc bí mật.',
      'Các đồ dùng sinh hoạt được tái chế khéo léo từ vỏ đồ hộp nhôm, thìa mài sắc làm dao gọt, thể hiện tinh thần biến ngục tù thành trường học cách mạng.'
    ],
    directAnswer: 'Các hiện vật sinh hoạt như ngòi bút cành bàng, mực viết làm từ muội than và bột gạch non, cùng các tờ báo bí mật chép tay là minh chứng phi thường cho ý chí biến ngục tối Hỏa Lò thành trường học cách mạng.'
  },

  dai_tuong_niem: {
    id: 'dai_tuong_niem',
    name: 'Đài tưởng niệm & Bức phù điêu',
    category: 'Đài tưởng niệm & Bức phù điêu',
    keywords: ['dai tuong niem', 'phu dieu', 'le lien', 'dang huong', 'tri an', 'liet si', 'so luu but'],
    facts: [
      'Đài tưởng niệm Hỏa Lò là không gian thiêng liêng để du khách dâng hương tri ân các anh hùng liệt sĩ cách mạng.',
      'Bức phù điêu lớn tạc bằng đá tự nhiên do nhà điêu khắc Lê Liên sáng tác, khắc họa hình ảnh những chiến sĩ kiên trung kề vai sát cánh sau song sắt.',
      'Tại đây có cuốn sổ lưu bút để du khách trong và ngoài nước ghi lại những dòng cảm tưởng xúc động sau chuyến tham quan.'
    ],
    directAnswer: 'Đài tưởng niệm Hỏa Lò với bức phù điêu đá của nhà điêu khắc Lê Liên là không gian trang nghiêm tri ân các liệt sĩ cách mạng, nơi du khách có thể thành kính dâng hương và ghi lại lưu bút cảm tưởng.'
  },

  tour_dem: {
    id: 'tour_dem',
    name: 'Tour đêm "Đêm thiêng liêng"',
    category: 'Tour đêm & Trải nghiệm',
    keywords: ['tour dem', 'dem thieng lieng', 'trai nghiem dem', 'am thanh anh sang', 'tra bang', 'thach bang', 'sang ngoi tinh than viet', 'song nhu nhung doa hoa', 'lua thanh xuan'],
    facts: [
      'Tour đêm "Đêm thiêng liêng" là sản phẩm du lịch trải nghiệm độc đáo vào các tối cuối tuần tại Hỏa Lò.',
      'Có 3 chủ đề: "Đêm thiêng liêng 1 - Sáng ngời tinh thần Việt", "Đêm thiêng liêng 2 - Sống như những đóa hoa", "Đêm thiêng liêng 3 - Lửa thanh xuân".',
      'Chương trình ứng dụng nghệ thuật ánh sáng và âm thanh sống động, diễn hoạt các tình huống lịch sử xúc động.',
      'Kết thúc tour, khách được thưởng thức trà bàng và thạch bàng - món quà đặc trưng mang ý nghĩa tri ân từ cây bàng lịch sử.'
    ],
    directAnswer: 'Tour đêm "Đêm thiêng liêng" tái hiện chân thực cuộc đấu tranh kiên trung của người tù qua nghệ thuật âm thanh, ánh sáng và hoạt cảnh sân khấu xúc động, kết thúc bằng việc thưởng thức trà bàng và thạch bàng tri ân.'
  },

  bao_ton_hien_nay: {
    id: 'bao_ton_hien_nay',
    name: 'Bảo tồn & Dịch vụ hiện nay',
    category: 'Bảo tồn & Dịch vụ tham quan',
    keywords: ['bao ton', 'tuong sap', 'composite', 'audioguide', 'tai nghe', 'quay luu niem', 'tui tote', 'so tay', 'huy hieu'],
    facts: [
      'Di tích bảo tồn nguyên trạng các dãy xà lim, cửa sắt cổ có lớp sơn chống oxy hóa.',
      'Tái hiện không gian chân thực bằng hệ thống tượng tù nhân chế tác bằng composite/sáp.',
      'Hệ thống thuyết minh tự động Audioguide đa ngôn ngữ hỗ trợ du khách nghe giới thiệu chi tiết theo số thứ tự hiện vật.',
      'Khu quầy lưu niệm giới thiệu các ấn phẩm lịch sử, túi tote, sổ tay và quà tặng độc đáo in hình cổng di tích và lá bàng.'
    ],
    directAnswer: 'Di tích hiện nay kết hợp bảo tồn nguyên trạng các dãy xà lim với hệ thống tượng sáp composite chân thực, thiết bị thuyết minh Audioguide đa ngôn ngữ và không gian quầy lưu niệm văn hóa hiện đại.'
  }
};

// 2. HỒ SƠ NGHIỆP VỤ & CHĂM SÓC KHÁCH THAM QUAN
const CUSTOMER_CARE_DOSSIERS = {
  tickets: {
    title: 'Quy định & Biểu phí vé tham quan',
    facts: [
      'Địa chỉ: Số 1 phố Hỏa Lò, phường Trần Hưng Đạo, quận Hoàn Kiếm, Hà Nội.',
      'Giá vé ban ngày: 50.000 VNĐ / lượt cho người lớn.',
      'Giá vé ưu đãi 50% (25.000 VNĐ / lượt): Áp dụng cho học sinh, sinh viên (xuất trình thẻ HSSV hợp lệ), người cao tuổi (từ 60 tuổi trở lên mang theo CCCD), người khuyết tật nặng.',
      'Miễn phí vé: Trẻ em dưới 15 tuổi, người có công với cách mạng, người khuyết tật đặc biệt nặng.',
      'Vé thuyết minh tự động (Audioguide): Thuê tại quầy vé với phí khoảng 50.000 VNĐ / máy (có nhiều ngôn ngữ: Việt, Anh, Pháp...).',
      'Vé tour đêm "Đêm thiêng liêng": Giá từ 399.000 - 499.000 VNĐ tùy chủ đề, diễn ra tối cuối tuần (thứ 6, 7, CN); PHẢI ĐẶT TRƯỚC qua fanpage hoặc hotline chính thức vì giới hạn số lượng khách.',
      'Chính sách hoàn/đổi vé: Vé ban ngày mua tại quầy có giá trị sử dụng trong ngày và không áp dụng hoàn tiền sau khi đã qua cửa soát vé; với các trường hợp thanh toán nhầm hoặc tour đêm cần đổi lịch, khách hàng liên hệ trực tiếp quầy vé để được nhân viên đối soát theo quy định.'
    ]
  },

  hours: {
    title: 'Khung giờ hoạt động & Mở cửa',
    facts: [
      'Giờ mở cửa ban ngày: Từ 8:00 đến 17:00 tất cả các ngày trong tuần (từ Thứ Hai đến Chủ Nhật).',
      'Di tích mở cửa liên tục không nghỉ trưa.',
      'Các ngày Lễ, Tết trong năm di tích vẫn mở cửa đón khách bình thường.',
      'Tour đêm "Đêm thiêng liêng": Bắt đầu đón khách từ 19:00 các tối Thứ Sáu, Thứ Bảy và Chủ Nhật (thời lượng tour khoảng 90 phút).'
    ]
  },

  facilities: {
    title: 'Cơ sở vật chất & Tiện ích phục vụ khách',
    facts: [
      'Tủ gửi đồ cá nhân: Có khu vực tủ gửi đồ miễn phí gần cổng soát vé dành cho balo, túi xách cồng kềnh. Du khách tự bảo quản tài sản có giá trị (tiền bạc, điện thoại, giấy tờ cá nhân).',
      'Nhà vệ sinh (WC): Bố trí tại khu vực sân trại giam và gần lối ra/quầy lưu niệm, sạch sẽ và có biển chỉ dẫn rõ ràng.',
      'Nước uống & Quầy lưu niệm: Quầy lưu niệm nằm ở gần lối ra, có bán đồ uống đóng chai và các sản phẩm văn hóa (sổ tay, túi tote, huy hiệu, sách tư liệu). Trong tour đêm có phục vụ trà bàng và thạch bàng miễn phí.',
      'Quy định chụp ảnh: Du khách được phép chụp ảnh lưu niệm thông thường (vui lòng tắt đèn flash tại các phòng giam để bảo quản hiện vật và tôn trọng không gian thiêng liêng); cấm quay phim chụp ảnh thương mại khi chưa có sự đồng ý của Ban quản lý.'
    ]
  },

  accessibility: {
    title: 'Chính sách hỗ trợ người cao tuổi, trẻ em & người khuyết tật',
    facts: [
      'Người cao tuổi & Người khuyết tật: Di tích là công trình cổ từ năm 1896 nên có một số bậc tam cấp cao; Ban quản lý có bố trí đường dốc ở các khu vực chính; nhân viên bảo vệ và hướng dẫn viên luôn sẵn lòng hỗ trợ dìu hoặc đẩy xe lăn khi khách cần giúp đỡ.',
      'Trẻ em: Trẻ em dưới 15 tuổi được miễn phí vé nhưng bắt buộc phải có người lớn đi cùng để bảo đảm an toàn. Các khu vực như Ngục tối Cachot và Máy chém có ánh sáng tối và bối cảnh chân thực, phụ huynh nên cân nhắc hướng dẫn phù hợp với tâm lý trẻ nhỏ.',
      'Ghế nghỉ chân: Bố trí tại khu vực sân trại giam dưới bóng mát cây bàng cổ thụ và một số hành lang.'
    ]
  },

  assistance_and_complaint: {
    title: 'Xử lý khiếu nại, phản ánh và hỗ trợ đặc biệt',
    facts: [
      'Khi khách phàn nàn / không hài lòng: Lắng nghe chân thành, ghi nhận phản hồi, xin lỗi vì trải nghiệm chưa trọn vẹn, giải thích nhẹ nhàng và hướng dẫn khách gặp tổ trưởng lễ tân hoặc để lại ý kiến vào sổ góp ý.',
      'Khi khách bị mất đồ / thất lạc tài sản: Hướng dẫn khách đến ngay phòng thường trực bảo vệ hoặc quầy thông tin tại cổng số 1 Hỏa Lò để trích xuất camera giám sát và kiểm tra sổ bàn giao tài sản thất lạc.',
      'Khi khách cần hỗ trợ y tế: Thông báo ngay cho nhân viên bảo vệ hoặc phòng trực y tế của di tích để được sơ cứu kịp thời.'
    ]
  },

  tour_recommendation: {
    title: 'Tư vấn hành trình & Lộ trình tham quan tối ưu',
    facts: [
      'Lộ trình chuẩn (60 - 90 phút): Cổng chính Maison Centrale ➡️ Lịch sử làng gốm Phụ Khánh ➡️ Trại giam tập thể nam (Trại E, G) ➡️ Ngục tối Cachot ➡️ Khu trại giam Nữ ➡️ Sân trại giam & Cây bàng cổ thụ ➡️ Khu D & Xà lim tử hình ➡️ Cỗ máy chém ➡️ Cửa cống ngầm vượt ngục 1951 ➡️ Khu phi công Mỹ ("Hanoi Hilton") ➡️ Đài tưởng niệm & Bức phù điêu ➡️ Quầy lưu niệm.',
      'Lộ trình nhanh (30 - 45 phút cho khách ít thời gian): Cổng chính ➡️ Cây bàng cổ thụ ➡️ Ngục tối Cachot ➡️ Cỗ máy chém ➡️ Cống ngầm vượt ngục ➡️ Khu phi công Mỹ ➡️ Đài tưởng niệm.',
      'Tham quan theo nhóm / đoàn: Nên liên hệ đặt trước thuyết minh viên trực tiếp tại quầy vé hoặc thuê mỗi người một tai nghe Audioguide để có trải nghiệm trọn vẹn nhất.'
    ]
  }
};

const STOPWORDS = new Set([
  'nha', 'tu', 'hoa', 'lo', 'la', 'gi', 'o', 'va', 'cua', 'trong', 'co', 'duoc', 'cac',
  'nhung', 'nay', 'do', 'tai', 'sao', 'bao', 'nhieu', 'the', 'nao', 'khong', 'cho',
  'toi', 'biet', 'thac', 'mac', 'dung', 'ngay', 'truoc', 'phai', 'a', 'da', 'dang',
  've', 'voi', 'mot', 'hai', 'nhieu', 'nhu', 'khi', 'nao', 'ai', 'dau', 'chiec', 'cai',
  'che', 'tao', 'che tao', 'nhu the nao', 'ra sao'
]);

class KnowledgeBase {
  constructor() {
    this.groundTruth500 = [];
    this.groundTruthMap = new Map();
    this.invertedIndex500 = new Map();
    this.load500GroundTruth();
  }

  load500GroundTruth() {
    try {
      const file = path.join(__dirname, '..', 'data', '500_cau_hoi_chuan_lich_su.json');
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8');
        const items = JSON.parse(raw);
        this.groundTruth500 = items.map((item, idx) => {
          const normQ = nlp.normalize(item.question);
          const tokens = nlp.tokenize(item.question);
          this.groundTruthMap.set(normQ, item);

          tokens.forEach(t => {
            if (t.length > 2 && !STOPWORDS.has(t)) {
              if (!this.invertedIndex500.has(t)) this.invertedIndex500.set(t, []);
              this.invertedIndex500.get(t).push(idx);
            }
          });

          return {
            ...item,
            normQ,
            tokens: new Set(tokens)
          };
        });
      }
    } catch (e) {
      console.warn('[KnowledgeBase] Không nạp được 500 ground truth:', e.message);
    }
  }

  /**
   * Tìm kiếm trong kho 500 câu hỏi chuẩn sử học (Có lọc chủ đề & Stopwords)
   */
  findGroundTruthMatch(question) {
    if (!this.groundTruth500.length) return null;
    const norm = nlp.normalize(question);

    // 1. Exact Match 100%
    if (this.groundTruthMap.has(norm)) {
      const item = this.groundTruthMap.get(norm);
      return { item, score: 1.0, type: 'EXACT' };
    }

    // 2. TF-IDF Token Inverted Index Match trên Content Words
    const qTokens = nlp.tokenize(question);
    const contentTokens = qTokens.filter(t => t.length > 2 && !STOPWORDS.has(t));
    if (contentTokens.length === 0) return null;

    const scores = new Map();
    contentTokens.forEach(token => {
      const indices = this.invertedIndex500.get(token);
      if (indices) {
        const idf = Math.log(1 + this.groundTruth500.length / indices.length);
        indices.forEach(idx => {
          scores.set(idx, (scores.get(idx) || 0) + idf);
        });
      }
    });

    // Nhận diện chủ đề của câu hỏi để tránh match chéo phân khu
    const qHasGuillotine = norm.includes('may chem') || norm.includes('guillotine');
    const qHasBanyan = norm.includes('cay bang') || norm.includes('la bang') || norm.includes('hat bang');
    const qHasSewer = norm.includes('cong ngam') || norm.includes('vuot nguc');
    const qHasPilot = norm.includes('phi cong') || norm.includes('mccain') || norm.includes('peterson') || norm.includes('hanoi hilton');
    const qHasMcCain = norm.includes('mccain');
    const qHasPeterson = norm.includes('peterson');
    const qHasCachot = norm.includes('cachot') || norm.includes('nguc toi');
    const qHasDeathRow = norm.includes('xa lim') || norm.includes('tu hinh') || norm.includes('hoang van thu');
    const qHas1951 = norm.includes('1951') || norm.includes('noel') || norm.includes('24 12') || norm.includes('16 tu tu') || norm.includes('5 dong chi');
    const qHas1945 = norm.includes('1945') || norm.includes('hon 100') || norm.includes('100 can bo') || norm.includes('nhat dao chinh');
    const qHasPenInk = norm.includes('muc viet') || norm.includes('but') || norm.includes('bao chi') || norm.includes('viet bao');
    const qHasNguyenThaiHoc = norm.includes('nguyen thai hoc');

    let bestScore = 0;
    let bestIdx = -1;

    for (const [idx, score] of scores.entries()) {
      const candidate = this.groundTruth500[idx];
      const candNorm = candidate.normQ;

      // Kiểm tra tính nhất quán về chủ đề (Topic Consistency)
      if (qHasGuillotine && !candNorm.includes('may chem') && !candNorm.includes('guillotine')) continue;
      if (qHasBanyan && !candNorm.includes('bang')) continue;
      if (qHasSewer && !candNorm.includes('cong') && !candNorm.includes('vuot nguc')) continue;
      if (qHasPilot && !candNorm.includes('phi cong') && !candNorm.includes('mccain') && !candNorm.includes('peterson') && !candNorm.includes('hilton')) continue;
      if (qHasMcCain && !candNorm.includes('mccain')) continue;
      if (qHasPeterson && !candNorm.includes('peterson')) continue;
      if (qHas1951 && candNorm.includes('1945') && !candNorm.includes('1951')) continue;
      if (qHas1945 && candNorm.includes('1951') && !candNorm.includes('1945')) continue;
      if (qHasPenInk && candNorm.includes('may chem')) continue;
      if (qHasNguyenThaiHoc && !candNorm.includes('nguyen thai hoc')) continue;
      if (qHasCachot && !candNorm.includes('cachot') && !candNorm.includes('nguc toi')) continue;
      if (qHasDeathRow && !candNorm.includes('xa lim') && !candNorm.includes('tu hinh') && !candNorm.includes('hoang van thu')) continue;

      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }

    if (bestScore >= 2.0 && bestIdx >= 0) {
      const item = this.groundTruth500[bestIdx];
      const itemTokens = item.tokens;
      let intersect = 0;
      contentTokens.forEach(t => { if (itemTokens.has(t)) intersect++; });
      const ratio = intersect / Math.max(1, contentTokens.length);

      if (ratio >= 0.4) {
        return { item, score: bestScore, ratio, type: 'SEMANTIC' };
      }
    }

    return null;
  }

  /**
   * Khớp hiện vật / phân khu lịch sử
   */
  findHistoricalExhibit(question) {
    const norm = ' ' + nlp.normalize(question) + ' ';
    let bestExhibit = null;
    let maxMatch = 0;

    for (const [key, exhibit] of Object.entries(HISTORICAL_EXHIBITS)) {
      let matchCount = 0;
      for (const kw of exhibit.keywords) {
        if (norm.includes(' ' + kw + ' ') || norm.includes(kw)) {
          matchCount += (kw.includes(' ') ? 3 : 1);
        }
      }

      // Luật ưu tiên phân biệt đặc thù
      if (key === 'cay_bang' && norm.includes('cay bang')) matchCount += 10;
      if (key === 'hien_vat_sinh_hoat' && (norm.includes('muc viet') || norm.includes('but') || norm.includes('bao chi') || norm.includes('gach non') || norm.includes('muoi than'))) matchCount += 15;
      if (key === 'vuot_nguc_1945' && (norm.includes('1945') || norm.includes('hon 100') || norm.includes('100 can bo') || norm.includes('nhat dao chinh'))) matchCount += 15;
      if (key === 'may_chem' && (norm.includes('may chem') || norm.includes('guillotine'))) matchCount += 10;
      if (key === 'cong_ngam' && (norm.includes('cong ngam') || (norm.includes('vuot nguc') && !norm.includes('1945') && !norm.includes('100')))) matchCount += 10;
      if (key === 'phi_cong' && (norm.includes('phi cong') || norm.includes('mccain') || norm.includes('hilton'))) matchCount += 10;
      if (key === 'cachot' && (norm.includes('cachot') || norm.includes('nguc toi'))) matchCount += 10;
      if (key === 'khu_d_tu_hinh' && (norm.includes('tu hinh') || norm.includes('hoang van thu'))) matchCount += 10;
      if (key === 'tour_dem' && (norm.includes('tour dem') || norm.includes('dem thieng lieng'))) matchCount += 10;
      if (key === 'maison_centrale' && (norm.includes('maison centrale') || norm.includes('phu khanh') || norm.includes('cong so 1'))) matchCount += 10;

      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        bestExhibit = exhibit;
      }
    }

    if (maxMatch >= 2 && bestExhibit) {
      return { exhibit: bestExhibit, matchScore: maxMatch };
    }
    return null;
  }

  /**
   * Lấy ngữ cảnh dịch vụ khách hàng (Customer Care)
   */
  getCustomerCareContext(intent) {
    switch (intent) {
      case 'TICKET_INFORMATION':
        return CUSTOMER_CARE_DOSSIERS.tickets;
      case 'OPENING_HOURS':
        return CUSTOMER_CARE_DOSSIERS.hours;
      case 'FACILITY_SUPPORT':
        return CUSTOMER_CARE_DOSSIERS.facilities;
      case 'ACCESSIBILITY_SUPPORT':
        return CUSTOMER_CARE_DOSSIERS.accessibility;
      case 'CUSTOMER_COMPLAINT':
      case 'CUSTOMER_ASSISTANCE':
        return CUSTOMER_CARE_DOSSIERS.assistance_and_complaint;
      case 'TOUR_RECOMMENDATION':
      case 'VISIT_GUIDANCE':
        return CUSTOMER_CARE_DOSSIERS.tour_recommendation;
      default:
        return null;
    }
  }
}

module.exports = {
  HISTORICAL_EXHIBITS,
  CUSTOMER_CARE_DOSSIERS,
  knowledgeBase: new KnowledgeBase()
};
