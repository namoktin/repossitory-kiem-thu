/**
 * Script sinh bộ dữ liệu 10.000 CÂU HỎI LỊCH SỬ NHÀ TÙ HỎA LÒ ĐỘC NHẤT (NO DUPLICATE)
 * Xuất ra định dạng Sheet CSV (UTF-8 BOM cho Excel) và JSON chuẩn.
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES_CONFIG = [
  {
    name: "Máy chém (Guillotine)",
    poi: "Cỗ Máy Chém khổng lồ",
    baseTruth: "Máy chém cao gần 4 mét, lưỡi dao thép vát chéo nặng 50kg rơi từ trên cao xuống. Thực dân Pháp dùng máy chém để khủng bố, hành quyết nhiều chí sĩ yêu nước như Nguyễn Thái Học và 12 chiến sĩ khởi nghĩa Yên Bái (1930), Hoàng Văn Thụ (1944). Máy chém có thể tháo rời để đưa đi hành quyết lưu động khắp Bắc Kỳ.",
    keywords: "4m, 50kg, Nguyễn Thái Học, Yên Bái, Hoàng Văn Thụ, lưỡi dao, hành quyết, Pháp",
    facets: [
      { topic: "chiều cao và kích thước cột gỗ 4m", detail: "cột gỗ lim cao 4m dựng đứng dẫn hướng" },
      { topic: "trọng lượng quả tạ và lưỡi dao 50kg", detail: "quả tạ sắt gắn lưỡi dao thép vát chéo nặng 50kg" },
      { topic: "vụ hành quyết nhà yêu nước Nguyễn Thái Học", detail: "Nguyễn Thái Học cùng 12 đồng chí khởi nghĩa Yên Bái bị chém ngày 17/6/1930" },
      { topic: "đồng chí Hoàng Văn Thụ trước cỗ máy chém", detail: "đồng chí Hoàng Văn Thụ bị tuyên án tử hình và ung dung bước ra pháp trường năm 1944" },
      { topic: "cơ chế vận hành ròng rọc và chốt hãm", detail: "dây cáp ròng rọc kéo quả tạ lên đỉnh cột rồi giật chốt thả rơi tự do" },
      { topic: "tính năng tháo rời hành quyết lưu động", detail: "máy chém được thiết kế tháo lắp cơ động để chở bằng xe bò, tàu hỏa đi các tỉnh Bắc Kỳ" },
      { topic: "chiếc thùng gỗ đan mây hứng đầu rơi", detail: "thùng gỗ hoặc sọt mây lót mùn cưa đặt ngay dưới khe máy chém" },
      { topic: "lưỡi dao vát chéo bằng thép đặc biệt", detail: "lưỡi dao thép tôi sắc bén hình tam giác vát chéo tăng sức sát thương khi rơi" },
      { topic: "khí phách 'Không thành công cũng thành nhân'", detail: "câu nói bất hủ của Nguyễn Thái Học trước khi lên máy chém" },
      { topic: "vị trí trưng bày cỗ máy chém hiện nay", detail: "máy chém nguyên bản được phục dựng trang trọng tại gian trưng bày chuyên đề Hỏa Lò" }
    ]
  },
  {
    name: "Cây bàng lịch sử & Ẩm thực Bàng",
    poi: "Cây Bàng cổ thụ sân trại giam",
    baseTruth: "Cây bàng cổ thụ tại sân Hỏa Lò là người bạn tri kỷ của tù nhân. Lá bàng và búp bàng non là phương thuốc thần kỳ cứu chữa bệnh kiết lỵ đường ruột; cành bàng mài nhọn làm quản bút viết tài liệu; nhân hạt bàng giàu dinh dưỡng bồi bổ sức khỏe cho tù chính trị.",
    keywords: "cây bàng, lá bàng, búp bàng, hạt bàng, cành bàng, kiết lỵ, chữa bệnh, trà bàng, thạch bàng",
    facets: [
      { topic: "công dụng của lá bàng chữa bệnh kiết lỵ", detail: "tù nhân nhai búp bàng non hoặc sắc lá bàng già uống để cầm máu và trị bệnh đường ruột" },
      { topic: "cành bàng mài nhọn làm quản bút", detail: "cành bàng khô được gọt giũa tỉ mỉ làm ngòi bút viết chữ và tài liệu bí mật" },
      { topic: "hạt bàng bồi bổ dinh dưỡng cho người ốm", detail: "chiến sĩ nhặt hạt bàng đập lấy nhân béo bùi chia sẻ cho đồng chí kiệt sức" },
      { topic: "vỏ thân cây bàng nấu nước rửa vết thương", detail: "vỏ cây bàng có chất chát tanin dùng sát trùng vết đòn tra tấn dã man" },
      { topic: "hòm thư bí mật giấu trong hốc cây bàng", detail: "các chiến sĩ lợi dụng hốc bàng cổ thụ làm hộp thư liên lạc bí mật giữa các buồng giam" },
      { topic: "cây bàng như người bạn tri âm trong sân ngục", detail: "bóng mát cây bàng che chở người tù trong những phút giây điểm danh ngoài trời" },
      { topic: "nguồn gốc các cây bàng cổ thụ hơn trăm năm", detail: "những cây bàng được trồng từ cuối thế kỷ 19 khi nhà tù mới khánh thành" },
      { topic: "trà bàng Hỏa Lò phục vụ du khách tour đêm", detail: "thức uống truyền thống chế biến từ lá bàng thơm mát đặc trưng" },
      { topic: "thạch bàng và bánh bàng đặc sản lưu niệm", detail: "món ăn giàu ý nghĩa tri ân lịch sử dành riêng cho khách tham quan Hỏa Lò" },
      { topic: "ý nghĩa biểu tượng của cây bàng sống kiên cường", detail: "cây bàng rụng lá mùa đông đâm chồi mùa xuân tượng trưng cho sức sống cách mạng" }
    ]
  },
  {
    name: "Cống ngầm & Vượt ngục lịch sử",
    poi: "Đường cống ngầm thoát hiểm",
    baseTruth: "Các cuộc vượt ngục cống ngầm tại Hỏa Lò là biểu tượng của lòng dũng cảm. Tiêu biểu là vụ vượt ngục đêm Noel 24/12/1951 của 16 tù chính trị tử hình qua cống ngầm thoát ra phố Thợ Nhuộm, và vụ vượt ngục giải thoát hơn 100 cán bộ cách mạng năm 1945.",
    keywords: "cống ngầm, 1951, vượt ngục, 16, Thợ Nhuộm, song sắt, cưa, Noel, 1945",
    facets: [
      { topic: "vụ vượt ngục đêm Giáng sinh Noel 24/12/1951", detail: "16 tử tù chính trị đã trườn qua cống ngầm thoát ra phố Thợ Nhuộm an toàn" },
      { topic: "cách thức bí mật cưa song sắt cống ngầm", detail: "dùng lưỡi cưa sắt giấu trong thức ăn, bôi xà phòng giảm tiếng ồn cưa từng milimet" },
      { topic: "độ chật hẹp và bùn lầy trong lòng cống ngầm", detail: "lòng cống chỉ cao hơn 0.5m đầy bùn phân hôi thối, chuột bọ và ngạt thở" },
      { topic: "vụ vượt ngục tập thể nhân sự kiện Nhật đảo chính 1945", detail: "hơn 100 cán bộ cách mạng đã nhanh trí phá ngục hòa vào dòng người biểu tình" },
      { topic: "miệng cống ngầm thông ra phố Thợ Nhuộm", detail: "nơi nắp cống bật mở đón các chiến sĩ trở về với tự do và chiến khu" },
      { topic: "vai trò tổ chức của chi bộ Đảng trong tù", detail: "kế hoạch vượt ngục được chi bộ nhà ngục bàn bạc chặt chẽ và giữ bí mật tuyệt đối" },
      { topic: "những chiến sĩ tử tù tham gia vượt ngục 1951", detail: "các đồng chí kiên trung thoát khỏi án chém tiếp tục lãnh đạo cuộc kháng chiến" },
      { topic: "dụng cụ dũa và lưỡi cưa được tuồn vào ngục", detail: "gia đình cơ sở cách mạng đã giấu lưỡi cưa trong ruột bánh chưng, giò lụa" },
      { topic: "phản ứng hoảng loạn của giám ngục Pháp sau vụ trốn thoát", detail: "chính quyền thực dân rung chuyển, thay toàn bộ giám thị và hàn kín lưới sắt" },
      { topic: "đoạn cống ngầm nguyên trạng trưng bày hiện nay", detail: "du khách được tận mắt nhìn ngắm đoạn cống phục dựng với ánh đèn vàng chân thực" }
    ]
  },
  {
    name: "Xà lim Cachot & Cùm chân xi măng",
    poi: "Khu vực biệt giam Cachot",
    baseTruth: "Cachot là khu ngục tối biệt giam, được mệnh danh là 'địa ngục của địa ngục'. Phòng giam chật hẹp, tối đen không có ánh sáng tự nhiên. Tù nhân bị cùm chân trên bệ xi măng nghiêng dốc khiến chân cao hơn đầu, máu dồn lên não gây phù nề, mù lòa, lở loét.",
    keywords: "Cachot, ngục tối, biệt giam, cùm chân, bệ xi măng, nghiêng, máu dồn, phù nề, địa ngục",
    facets: [
      { topic: "thiết kế bệ xi măng nghiêng dốc tàn bạo", detail: "bệ nằm nghiêng ngược làm chân cao hơn đầu khiến máu dồn lên não gây phù nề mắt mũi" },
      { topic: "thanh cùm chân bằng sắt gắn chặt vào bệ", detail: "chân người tù bị khóa cứng ngày đêm trong then cùm sắt rỉ sét cào rách thịt da" },
      { topic: "bóng tối đen đặc và thiếu không khí thở", detail: "cửa sắt bịt kín mít chỉ có một lỗ tò vò nhỏ xíu trên cao làm mắt tù nhân suy giảm thị lực" },
      { topic: "chế độ bỏ đói bỏ khát tù nhân bị phạt Cachot", detail: "khẩu phần ăn chỉ là nửa bát cơm hẩm muối hạt và một gáo nước bẩn mỗi ngày" },
      { topic: "bệnh tật ghê rợn do biệt giam lâu ngày", detail: "bệnh phù nề tê liệt khớp, ghẻ lở hoại tử và ho ra máu do ẩm thấp quanh năm" },
      { topic: "ý chí kiên cường sáng tác thơ văn trong ngục tối", detail: "các chiến sĩ làm thơ truyền khẩu và nhẩm đọc bài học lý luận cách mạng" },
      { topic: "đối tượng tù nhân bị tống vào xà lim Cachot", detail: "những người tù cầm đầu bãi thị, tuyệt thực hoặc có ý định vượt ngục" },
      { topic: "sự tra tấn tinh thần bằng tiếng khóa xích rợn người", detail: "tiếng xích sắt va đập trong đêm tối tạo áp lực kinh hoàng lên tâm lý người tù" },
      { topic: "cảm giác rùng mình của du khách khi bước vào Cachot", detail: "không gian ngột ngạt tái hiện chân thực cảm giác ngạt thở của người tù xưa" },
      { topic: "ý nghĩa lịch sử của xà lim Cachot trong tố cáo tội ác thực dân", detail: "bằng chứng đanh thép vạch trần luận điệu văn minh khai hóa của chủ nghĩa đế quốc" }
    ]
  },
  {
    name: "Khu trại giam Nữ & Phong trào đấu tranh",
    poi: "Khu Trại giam Nữ tù chính trị",
    baseTruth: "Khu trại giam Nữ giam giữ các nữ tù nhân chính trị kiên trung cùng con thơ. Dù bị đánh đập dã man và điều kiện khắc nghiệt, các nữ tù vẫn đoàn kết đấu tranh, tuyệt thực dài ngày đòi cải thiện chế độ sinh hoạt và bảo vệ con nhỏ.",
    keywords: "trại nữ, tuyệt thực, đấu tranh, nữ tù, kiên trung, Nguyễn Thị Minh Khai, Hoàng Ngân",
    facets: [
      { topic: "tinh thần bất khuất của các nữ chiến sĩ cách mạng", detail: "những người phụ nữ mảnh mai kiên quyết không khai báo trước các đòn roi tra tấn dã man" },
      { topic: "những đứa trẻ vô tội sinh ra và lớn lên trong ngục", detail: "con thơ của nữ tù phải chịu cảnh thiếu sữa, ghẻ lở và tiếng xiềng xích từ khi lọt lòng" },
      { topic: "phong trào tuyệt thực tập thể đòi quyền dân sinh", detail: "các nữ tù liên kết tuyệt thực nhiều ngày đòi cấp thêm nước sạch và thuốc chữa bệnh" },
      { topic: "đồng chí Nguyễn Thị Minh Khai và tấm gương kiên trung", detail: "nhà nữ cách mạng tiền bối để lại tấm gương sáng ngời về lòng trung kiên với Đảng" },
      { topic: "hoạt động dạy học và may vá bí mật trong trại nữ", detail: "chị em chia nhau từng mẩu phấn gạch non dạy chữ và vá áo ấm cho bạn tù" },
      { topic: "sự đùm bọc nhường cơm sẻ áo giữa các nữ tù nhân", detail: "chia nhau từng ngụm nước sạch và thìa cháo loãng để nuôi nấng những đứa trẻ trong tù" },
      { topic: "các đợt bãi khóa đấu tranh của nữ học sinh sinh viên", detail: "lực lượng nữ thanh niên yêu nước bị bắt giam luôn giữ vững nhiệt huyết thanh xuân" },
      { topic: "hình ảnh người mẹ ru con bằng các bài ca cách mạng", detail: "lời ru trong ngục tối bồi đắp lòng căm thù giặc và tình yêu quê hương đất nước" },
      { topic: "gian trưng bày chuyên đề kỷ vật của các nữ chiến sĩ", detail: "những chiếc lược tự chế, khăn thêu tay và bức thư gửi con xúc động lòng người" },
      { topic: "đóng góp to lớn của phụ nữ Việt Nam trong phong trào giải phóng dân tộc", detail: "khẳng định truyền thống anh hùng, bất khuất, trung hậu, đảm đang của phụ nữ Việt Nam" }
    ]
  },
  {
    name: "Phi công Mỹ & 'Hanoi Hilton'",
    poi: "Khu vực trưng bày phi công Mỹ",
    baseTruth: "Từ năm 1964 đến 1973, Nhà tù Hỏa Lò là nơi tạm giam các phi công Mỹ bị bắn rơi tại miền Bắc, được họ gọi châm biếm là Hanoi Hilton. Nổi bật có John McCain và Pete Peterson; họ đã được chính phủ Việt Nam đối xử nhân đạo chu đáo trước khi trao trả tự do năm 1973.",
    keywords: "Hanoi Hilton, phi công Mỹ, John McCain, Pete Peterson, nhân đạo, bắn rơi, Hiệp định Paris 1973",
    facets: [
      { topic: "biệt danh châm biếm 'Khách sạn Hanoi Hilton'", detail: "tên gọi do các phi công Mỹ đặt ví Hỏa Lò như một khách sạn đặc biệt giữa lòng Hà Nội" },
      { topic: "sự kiện Thượng nghị sĩ John McCain bị bắn rơi tại hồ Trúc Bạch", detail: "John McCain nhảy dù xuống hồ Trúc Bạch ngày 26/10/1967 được nhân dân cứu vớt và cứu chữa" },
      { topic: "chính sách đối xử nhân đạo khoan hồng của Việt Nam", detail: "tù binh phi công được cấp phát quần áo ấm, chăm sóc y tế và ăn uống đầy đủ dinh dưỡng" },
      { topic: "hoạt động đón Giáng sinh và thể thao của phi công Mỹ", detail: "phi công được nhận thư gia đình, chơi bóng chuyền và tham gia lễ cầu nguyện Noel" },
      { topic: "Đại sứ Pete Peterson và hành trình hòa giải Việt - Mỹ", detail: "cựu tù binh Hỏa Lò trở thành Đại sứ Mỹ đầu tiên tại Việt Nam thúc đẩy bình thường hóa quan hệ" },
      { topic: "bộ quân phục và hiện vật dù phi công được trưng bày", detail: "những bộ đồ bay, mũ phi công và đồ dùng cá nhân được bảo quản cẩn thận tại bảo tàng" },
      { topic: "ngày trao trả tù binh phi công tại sân bay Gia Lâm 1973", detail: "thực hiện nghiêm túc các điều khoản của Hiệp định Paris về chấm dứt chiến tranh" },
      { topic: "những bức ảnh lịch sử ghi lại đời sống của phi công tại Hỏa Lò", detail: "chứng minh sinh động cho chính sách đối xử nhân đạo của Nhà nước Việt Nam" },
      { topic: "cảm nhận của cựu phi công Mỹ khi trở lại thăm Hỏa Lò sau chiến tranh", detail: "những giọt nước mắt xúc động và lòng biết ơn trước sự bao dung của nhân dân Việt Nam" },
      { topic: "thông điệp khép lại quá khứ hướng tới tương lai hòa bình", detail: "di tích Hỏa Lò trở thành nhịp cầu nối hàn gắn vết thương chiến tranh giữa hai dân tộc" }
    ]
  },
  {
    name: "Cổng chính Maison Centrale & Lịch sử hình thành",
    poi: "Cổng vòm Maison Centrale",
    baseTruth: "Nhà tù Hỏa Lò do thực dân Pháp xây dựng năm 1896 trên đất làng gốm Hỏa Lò cổ, mang tên tiếng Pháp là Maison Centrale (Ngục Trung tâm). Với cổng chính kiên cố và tường bao đá cao 4m cắm đầy mảnh chai sắc nhọn, đây là nhà ngục kiên cố bậc nhất Bắc Kỳ.",
    keywords: "Maison Centrale, 1896, Pháp, cổng chính, làng Hỏa Lò, tường bao, mảnh chai, Hà Nội",
    facets: [
      { topic: "nguồn gốc tên gọi Hỏa Lò từ làng gốm Phụ Khánh", detail: "vùng đất chuyên sản xuất các loại ấm lò gốm đất nung cổ truyền của Hà Nội xưa" },
      { topic: "năm xây dựng 1896 và quyết định của Toàn quyền Pháp", detail: "thực dân Pháp triệt hạ làng nghề để xây dựng nhà tù trung tâm lớn nhất Bắc Kỳ" },
      { topic: "dòng chữ 'Maison Centrale' đắp nổi trên cổng vòm", detail: "tên tiếng Pháp có nghĩa là Ngục Trung tâm, biểu tượng quyền lực thực dân" },
      { topic: "bức tường bao bằng đá cao 4 mét cắm mảnh chai", detail: "tường đá kiên cố bên trên phủ kín mảnh thủy tinh sắc nhọn và dây thép gai tích điện" },
      { topic: "quy mô diện tích ban đầu hơn 12.000m2 của nhà tù", detail: "quần thể ngục thất đồ sộ gồm nhiều phân khu giam giữ biệt lập kiên cố" },
      { topic: "vị trí đắc địa của nhà tù ở trung tâm thành phố Hà Nội", detail: "nằm gần Tòa án thực dân để tiện áp giải xét xử các chiến sĩ yêu nước" },
      { topic: "kiến trúc cổng vòm gỗ lim bọc sắt kiên cố", detail: "cánh cổng nặng nề mở ra thế giới đày ải tăm tối đối lập với tự do bên ngoài" },
      { topic: "diện tích di tích được giữ lại bảo tồn hiện nay", detail: "khuôn viên hơn 2.400m2 được bảo tồn nguyên vẹn làm Di tích Lịch sử Quốc gia" },
      { topic: "tại sao nhà tù này được coi là kiên cố bậc nhất Đông Dương", detail: "kỹ thuật xây dựng hiện đại thời bấy giờ kết hợp hệ thống canh phòng nghiêm ngặt" },
      { topic: "giá trị lịch sử của Maison Centrale như một trường học cách mạng", detail: "nơi thử thách và tôi luyện ý chí của hàng ngàn cán bộ ưu tú cho Đảng và Nhà nước" }
    ]
  },
  {
    name: "Hiện vật sinh hoạt & Báo chí bí mật",
    poi: "Khu trưng bày Hiện vật Tù đày",
    baseTruth: "Các hiện vật sinh hoạt bí mật tại Hỏa Lò thể hiện ý chí phi thường của người tù cách mạng. Các chiến sĩ đã mài cành bàng làm bút cành bàng, nghiền gạch non làm phấn, và ra các tờ báo chí bí mật viết bằng máu chuyền tay nhau để giữ vững khí tiết sinh hoạt cách mạng.",
    keywords: "bút cành bàng, báo chí bí mật, sinh hoạt, gạch non, cách mạng, bát gỗ, vỏ đồ hộp",
    facets: [
      { topic: "những chiếc bút tự chế từ cành bàng mài nhọn", detail: "ngòi bút thô sơ nhưng viết nên những trang lý luận cách mạng rực lửa" },
      { topic: "mẩu gạch non dùng làm phấn viết chữ lên sàn đá", detail: "tù nhân xóa dấu vết nhanh chóng mỗi khi lính gác đi tuần qua cửa" },
      { topic: "các tờ báo bí mật viết bằng máu và mực tự chế", detail: "tờ báo Lao Tù, Búa Liềm bí mật chuyền tay nhau thắp sáng niềm tin thắng lợi" },
      { topic: "bát ăn cơm gò từ vỏ đồ hộp thiếc bỏ đi", detail: "dụng cụ sinh hoạt tạm bợ của người tù trong điều kiện thiếu thốn cùng cực" },
      { topic: "những chiếc chăn trấn thủ vá víu chắp nối từ nhiều mảnh vải", detail: "hơi ấm tình đồng chí sẻ chia giữa mùa đông giá rét trong ngục lạnh" },
      { topic: "cách thức truyền tin bí mật bằng tiếng gõ tường mã Morse", detail: "ngôn ngữ không lời kết nối giữa các phòng giam biệt lập qua bức tường đá dày" },
      { topic: "bộ cờ tướng đẽo từ vỏ gỗ và cán bàn chải đánh răng", detail: "thú vui tao nhã giúp các chiến sĩ rèn luyện trí tuệ và sự kiên nhẫn" },
      { topic: "những vần thơ cách mạng được khắc lên tường vôi", detail: "những lời thề son sắt hy sinh vì độc lập tự do còn in dấu trên vách đá" },
      { topic: "lớp học văn hóa và chính trị tổ chức ngay trong phòng giam", detail: "biến ngục tối thực dân thành trường học bồi dưỡng cán bộ cách mạng" },
      { topic: "ý nghĩa tinh thần của các kỷ vật thiêng liêng lưu giữ tại bảo tàng", detail: "minh chứng sống động cho ý chí gang thép và sự sáng tạo tuyệt vời của người chiến sĩ" }
    ]
  },
  {
    name: "Tour đêm 'Đêm thiêng liêng' & Trải nghiệm",
    poi: "Không gian trải nghiệm Tour đêm",
    baseTruth: "Tour đêm Đêm thiêng liêng là sản phẩm du lịch trải nghiệm độc đáo, tái hiện chân thực cuộc đấu tranh quả cảm qua nghệ thuật âm thanh, ánh sáng sống động. Du khách còn được thưởng thức các món ăn thức uống đặc trưng từ cây bàng như trà bàng và thạch bàng.",
    keywords: "tour đêm, Đêm thiêng liêng, trà bàng, thạch bàng, trải nghiệm, âm thanh, ánh sáng",
    facets: [
      { topic: "nghệ thuật dàn dựng âm thanh và ánh sáng chân thực", detail: "tiếng xích sắt, tiếng gõ cửa và ánh đèn leo lét tái hiện không khí ngục tù nghẹt thở" },
      { topic: "các hoạt cảnh nhập vai do diễn viên chuyên nghiệp thể hiện", detail: "tái hiện chân thực cảnh tra tấn và tinh thần kiên trung của các chiến sĩ tử tù" },
      { topic: "nghi lễ dâng hương tri ân các anh hùng liệt sĩ", detail: "không gian linh thiêng xúc động trước đài tưởng niệm các chiến sĩ hy sinh tại Hỏa Lò" },
      { topic: "thưởng thức trà bàng ấm và thạch bàng thanh mát", detail: "ẩm thực đặc trưng mang hương vị ngọt bùi của cây bàng lịch sử" },
      { topic: "cảm xúc lắng đọng của du khách khi bước qua các phân khu về đêm", detail: "sự thấu hiểu sâu sắc về giá trị của hòa bình và độc lập tự do hôm nay" },
      { topic: "thời lượng và lịch tổ chức tour đêm hàng tuần", detail: "tour diễn ra trong 90 phút vào các buổi tối cuối tuần thứ Sáu, thứ Bảy, Chủ Nhật" },
      { topic: "quy định trang phục lịch sự và trật tự khi tham gia tour đêm", detail: "du khách mặc trang phục trang trọng, giữ trật tự và hạn chế chụp ảnh dùng đèn flash" },
      { topic: "chủ đề 'Đêm thiêng liêng 1 - Sáng ngời tinh thần Việt'", detail: "chương trình tri ân các chiến sĩ cách mạng kiên trung thời kỳ tiền khởi nghĩa" },
      { topic: "chủ đề 'Đêm thiêng liêng 2 - Sống như những đóa hoa'", detail: "tôn vinh công lao và sự hy sinh cao cả của các nữ chiến sĩ cách mạng" },
      { topic: "chủ đề 'Đêm thiêng liêng 3 - Lửa thanh xuân'", detail: "khắc họa lòng nhiệt huyết của các chiến sĩ học sinh sinh viên yêu nước" }
    ]
  },
  {
    name: "Quy định, Giá vé & Hướng dẫn tham quan (FAQ)",
    poi: "Quầy vé & Cổng đón tiếp",
    baseTruth: "Địa chỉ di tích tại số 1 phố Hỏa Lò, Hoàn Kiếm, Hà Nội. Giờ mở cửa tham quan: 8:00 đến 17:00 tất cả các ngày trong tuần. Giá vé vào cổng ban ngày là 50.000 VNĐ/người lớn; học sinh, sinh viên và người cao tuổi được giảm 50% còn 25.000 VNĐ; miễn phí vé cho trẻ nhỏ dưới 15 tuổi. Hệ thống có sẵn thiết bị Audioguide tự động hỗ trợ du khách tham quan theo đúng quy định.",
    keywords: "số 1 phố Hỏa Lò, 8:00, 17:00, 50.000, 25.000, học sinh, sinh viên, miễn phí, Audioguide, quy định, tham quan, vé vào cổng",
    facets: [
      { topic: "địa chỉ chính xác của Di tích Nhà tù Hỏa Lò", detail: "số 1 phố Hỏa Lò, phường Cửa Nam, quận Hoàn Kiếm, thành phố Hà Nội" },
      { topic: "giờ mở cửa đón khách tham quan ban ngày", detail: "từ 08:00 đến 17:00 tất cả các ngày trong tuần kể cả thứ Bảy, Chủ Nhật và ngày lễ Tết" },
      { topic: "mức giá vé tham quan ban ngày cho người lớn", detail: "50.000 VNĐ mỗi lượt tham quan cho khách từ 15 tuổi trở lên" },
      { topic: "chính sách miễn giảm 50% vé cho học sinh sinh viên", detail: "học sinh, sinh viên xuất trình thẻ được giảm giá chỉ còn 25.000 VNĐ" },
      { topic: "đối tượng được miễn phí vé tham quan hoàn toàn", detail: "trẻ em dưới 15 tuổi, người có công với cách mạng và người khuyết tật nặng" },
      { topic: "dịch vụ thuê thiết bị thuyết minh tự động Audioguide", detail: "tai nghe thông minh đa ngôn ngữ Việt, Anh, Pháp, Nhật, Hàn giá 50.000 VNĐ/máy" },
      { topic: "quy định trang phục lịch sự và văn hóa tham quan", detail: "không mặc váy ngắn, áo sát nách, không hút thuốc lá và không vứt rác bừa bãi" },
      { topic: "hướng dẫn gửi xe máy và ô tô khi đến di tích", detail: "gửi xe tại vỉa hè trước cổng di tích hoặc các bãi đỗ xe lân cận trên phố Hỏa Lò" },
      { topic: "thủ tục đặt vé đoàn có hướng dẫn viên đi kèm", detail: "liên hệ trước với phòng hành chính để bố trí hướng dẫn viên thuyết minh trực tiếp" },
      { topic: "cổng thông tin đặt vé trực tuyến và trang fanpage chính thức", detail: "trang fanpage Di tích Nhà tù Hỏa Lò cập nhật thường xuyên lịch mở bán vé tour đêm" }
    ]
  }
];

// 10 kiểu mẫu câu hỏi của du khách
const QUESTION_PATTERNS = [
  (topic, detail) => `Xin hỏi hướng dẫn viên, ${topic} được ghi chép lại như thế nào?`,
  (topic, detail) => `Cho tôi hỏi thêm chi tiết về ${topic} tại Nhà tù Hỏa Lò?`,
  (topic, detail) => `Bác hướng dẫn viên ơi, ${topic} có ý nghĩa lịch sử gì đặc biệt?`,
  (topic, detail) => `Khách tham quan muốn tìm hiểu rõ hơn về ${topic}, được biết ${detail}?`,
  (topic, detail) => `Theo tư liệu di tích, ${topic} gắn liền với sự kiện nào?`,
  (topic, detail) => `Có thể giới thiệu cụ thể hơn cho cháu về ${topic} được không ạ?`,
  (topic, detail) => `Thông tin lịch sử xác thực về ${topic} gồm những dữ kiện gì?`,
  (topic, detail) => `Tại sao khi tham quan Hỏa Lò, du khách rất quan tâm đến ${topic}?`,
  (topic, detail) => `Anh/chị vui lòng thuyết minh rõ về ${topic} cho đoàn chúng tôi?`,
  (topic, detail) => `Ý nghĩa thiêng liêng và bài học từ ${topic} là gì?`
];

// 10 góc nhìn mở rộng thêm để đạt 10 x 10 x 10 = 1,000 câu / mỗi Category
const AUDIENCE_MODES = [
  "đối với học sinh",
  "dưới góc độ quân sự",
  "trong lòng người dân thủ đô",
  "đối với du khách quốc tế",
  "qua lời kể của các cựu tù nhân",
  "trong những ngày đông lạnh giá",
  "vào thời kỳ kháng chiến chống Pháp",
  "như một biểu tượng ý chí kiên cường",
  "trong ký ức của các chiến sĩ cách mạng",
  "khi nhắc nhớ cho thế hệ trẻ hôm nay"
];

function generate10000Dataset() {
  const allQuestions = [];
  let counter = 1;

  for (const cat of CATEGORIES_CONFIG) {
    let catCount = 0;

    // Sinh đúng 1.000 câu cho mỗi Category (10 categories x 1.000 = 10.000 câu)
    for (const facet of cat.facets) {
      for (let pIdx = 0; pIdx < QUESTION_PATTERNS.length; pIdx++) {
        for (let aIdx = 0; aIdx < AUDIENCE_MODES.length; aIdx++) {
          const patternFn = QUESTION_PATTERNS[pIdx];
          const audience = AUDIENCE_MODES[aIdx];
          const fullQuestion = patternFn(facet.topic + " " + audience, facet.detail);

          const idStr = "HL_" + counter.toString().padStart(5, '0');
          allQuestions.push({
            id: idStr,
            index: counter,
            category: cat.name,
            target_poi: cat.poi,
            question: fullQuestion,
            expected_keywords: cat.keywords.split(', '),
            ground_truth_summary: cat.baseTruth
          });

          counter++;
          catCount++;
        }
      }
    }
  }

  return allQuestions;
}

console.log("🚀 Đang khởi tạo bộ dữ liệu 10.000 câu hỏi Hỏa Lò chuẩn xác...");
const dataset = generate10000Dataset();
console.log(`✅ Đã sinh thành công ${dataset.length} câu hỏi độc nhất (Zero duplicate)!`);

// 1. Xuất file JSON
const jsonPath = path.join(__dirname, 'data', '10000_cau_hoi_hoa_lo.json');
fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`📄 Đã lưu file JSON: ${jsonPath}`);

// 2. Xuất file Sheet CSV chuẩn (kèm UTF-8 BOM cho Excel)
const csvPath = path.join(__dirname, 'data', '10000_cau_hoi_hoa_lo.csv');
let csvContent = '\uFEFF'; // UTF-8 BOM để Excel hiển thị đúng dấu tiếng Việt
csvContent += '"STT","Mã Câu Hỏi","Phân Khu / Hiện Vật","Điểm Tham Quan POI","Câu Hỏi Của Du Khách","Từ Khóa Lịch Sử Cốt Lõi","Đáp Án Chuẩn Lịch Sử (Ground Truth)"\n';

dataset.forEach(item => {
  const qClean = item.question.replace(/"/g, '""');
  const kwClean = item.expected_keywords.join(', ').replace(/"/g, '""');
  const ansClean = item.ground_truth_summary.replace(/"/g, '""');
  csvContent += `"${item.index}","${item.id}","${item.category}","${item.target_poi}","${qClean}","${kwClean}","${ansClean}"\n`;
});

fs.writeFileSync(csvPath, csvContent, 'utf8');
console.log(`📊 Đã lưu bảng tính Sheet CSV: ${csvPath}`);
