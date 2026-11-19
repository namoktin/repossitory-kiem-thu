/**
 * 2Guide Professional Customer Care Scenario Engine v6.0
 * 
 * Quản lý 10 kịch bản Chăm sóc khách hàng, Trợ năng và Tình huống thực tế:
 * 1. COMPLAINT_HANDLING (Khiếu nại: thái độ, dịch vụ, chen chúc, tai nghe rè, hoàn tiền, ban quản lý)
 * 2. LOST_AND_FOUND (Mất tài sản, ví tiền, điện thoại, balo)
 * 3. TICKET_SUPPORT (Vé ban ngày 50k, giảm 50% HSSV/người cao tuổi, tour đêm 399k-499k, vé cũ 30k hết hạn)
 * 4. TOUR_GUIDANCE (Tư vấn theo thời gian 20-30-45-90 phút, theo đoàn, gia đình)
 * 5. FACILITY_ASSISTANCE (Tủ gửi đồ miễn phí, nhà vệ sinh WC, quà lưu niệm, chụp ảnh)
 * 6. ACCESSIBILITY_ASSISTANCE (Xe lăn, dốc thoải, trẻ nhỏ, du khách khiếm thị)
 * 7. EMERGENCY_GUIDANCE (Y tế cấp cứu say nắng/ngất xỉu -> Trạm y tế cổng số 1, gọi 115, BV Việt Đức/Tim; Trẻ lạc)
 * 8. AUDIO_GUIDE_SUPPORT (Thuê 50k, đổi máy mới miễn phí ngay khi rè/hỏng)
 * 9. VISITOR_FEEDBACK (Sổ góp ý cổng số 1, gặp Tổ trưởng lễ tân)
 * 10. GENERAL_ASSISTANCE (Tiếp đón chung, kết nối nhân viên số 1 phố Hỏa Lò)
 */

const fs = require('fs');
const path = require('path');

class CustomerCareScenarioEngine {
  constructor() {
    this.policies = new Map();
    this.loadVerifiedPolicies();
  }

  loadVerifiedPolicies() {
    try {
      const pFile = path.join(__dirname, '..', 'data', 'verified_service_knowledge.json');
      if (fs.existsSync(pFile)) {
        const raw = fs.readFileSync(pFile, 'utf8');
        const data = JSON.parse(raw);
        (data.policies || []).forEach(p => {
          this.policies.set(p.id, p);
        });
      }
    } catch (e) {
      console.warn('[CustomerCareScenarioEngine] Lỗi nạp verified policies:', e.message);
    }
  }

  getPolicy(policyId) {
    return this.policies.get(policyId) || null;
  }

  /**
   * Xử lý kịch bản Chăm sóc khách hàng chuyên sâu theo ngữ cảnh và sub-intent
   */
  resolveScenario({
    intent,
    subIntent = null,
    urgency = 'NORMAL',
    normQuery = '',
    userProfile = {},
    language = 'vi'
  }) {
    const isEn = language === 'en';

    // 1. KỊCH BẢN KHIẾU NẠI & PHÀN NÀN (COMPLAINT_HANDLING)
    if (intent === 'CUSTOMER_COMPLAINT') {
      const sub = subIntent || 'SERVICE_QUALITY';

      if (sub === 'STAFF_ATTITUDE') {
        const pol = this.getPolicy('POLICY_COMPLAINTS_HANDLING');
        return {
          scenarioId: 'COMPLAINT_STAFF_ATTITUDE',
          response: isEn
            ? 'We sincerely apologize if you experienced impolite behavior from our staff today. Professionalism and respect are our utmost priorities. Could you share where this occurred (e.g., ticket booth or entrance gate)? You may also speak directly to the Duty Supervisor at the main entrance (No. 1 Hoa Lo) or write in our official guest feedback registry so we can promptly address this.'
            : 'Rất tiếc và chân thành cáo lỗi cùng bạn nếu bạn có trải nghiệm chưa trọn vẹn về thái độ phục vụ của nhân viên hôm nay. Ban Quản lý Di tích luôn coi trọng sự tôn trọng và văn minh đón tiếp. Bạn có thể cho mình biết sự việc xảy ra tại khu vực nào (quầy vé hay cửa soát vé) không? Bạn hãy gặp trực tiếp Tổ trưởng tổ đón tiếp tại cổng chính số 1 Hỏa Lò hoặc ghi vào sổ góp ý để Ban Quản lý kiểm tra và chấn chỉnh kịp thời nhé.',
          authorityBoundary: pol?.authority_boundary || 'Tổ trưởng lễ tân và Ban Quản lý trực tiếp xử lý kiểm điểm nhân viên.',
          actionableGuidance: 'Gặp Tổ trưởng tổ đón tiếp tại Cổng số 1 hoặc ghi Sổ góp ý.',
          requiresHuman: true,
          style: 'EMPATHETIC_SUPPORT'
        };
      }

      if (sub === 'AUDIO_DEVICE') {
        const pol = this.getPolicy('POLICY_AUDIOGUIDE_DEVICE');
        return {
          scenarioId: 'COMPLAINT_AUDIO_DEVICE',
          response: isEn
            ? 'We are truly sorry for the technical issue with your audio guide (crackling sound or audio interruption). To continue enjoying your tour, please bring the device back to the ticket counter at the entrance, and our staff will test and IMMEDIATELY REPLACE IT WITH A NEW UNIT FREE OF CHARGE.'
            : 'Rất xin lỗi bạn về sự cố kỹ thuật của tai nghe thuyết minh (bị rè hoặc gián đoạn âm thanh). Để không làm ảnh hưởng hành trình tham quan, bạn hãy mang ngay máy về quầy vé ở cổng chính; các bạn nhân viên sẽ kiểm tra và ĐỔI NGAY MỘT MÁY MỚI HOÀN TOÀN MIỄN PHÍ cho bạn nhé!',
          authorityBoundary: pol?.authority_boundary || 'Nhân viên quầy vé đổi máy mới ngay lập tức.',
          actionableGuidance: 'Mang máy về Quầy vé cổng chính để đổi máy mới miễn phí ngay lập tức.',
          requiresHuman: true,
          style: 'EMPATHETIC_SUPPORT'
        };
      }

      if (sub === 'OVERCROWDING') {
        const pol = this.getPolicy('POLICY_OVERCROWDING_MANAGEMENT');
        return {
          scenarioId: 'COMPLAINT_OVERCROWDING',
          response: isEn
            ? 'We understand that heavy crowds during peak hours can cause discomfort and noise in the narrow historical cells. We recommend taking a relaxing pause in the airy prison courtyard under the shaded banyan tree or near the Memorial Monument, and then revisiting the cells once the crowd thins out.'
            : 'Rất tiếc vì lượng khách tham quan tăng cao hôm nay gây cảm giác đông đúc và ồn ào. Không gian các phòng giam Hỏa Lò mang tính chất di tích lịch sử nguyên trạng nên vào giờ cao điểm có thể hơi ngột ngạt. Gợi ý bạn có thể di chuyển ra sân trại giam dưới bóng mát cây bàng cổ thụ hoặc khu Đài tưởng niệm thoáng đãng để nghỉ chân, sau đó quay lại các buồng giam hẹp khi lượng khách đã giãn bớt nhé.',
          authorityBoundary: pol?.authority_boundary || 'Đội bảo vệ và lễ tân điều tiết giãn luồng.',
          actionableGuidance: 'Nghỉ chân tại Sân cây bàng hoặc Đài tưởng niệm thoáng đãng.',
          requiresHuman: false,
          style: 'EMPATHETIC_SUPPORT'
        };
      }

      if (sub === 'REFUND_REQUEST') {
        const pol = this.getPolicy('POLICY_REFUND_EXCHANGE');
        return {
          scenarioId: 'COMPLAINT_REFUND_REQUEST',
          response: isEn
            ? 'Under the site financial regulations, purchased daytime tickets are non-refundable once issued (except under extraordinary force majeure circumstances decided by management). As an AI guide, I cannot authorize refunds; please present your ticket stub directly to the Chief Cashier at the main entrance (No. 1 Hoa Lo) for official review.'
            : 'Theo quy định quản lý tài chính của Di tích Hỏa Lò, vé tham quan ban ngày đã mua không áp dụng chính sách hoàn trả hoặc đổi tiền mặt sau khi xuất vé (trừ các trường hợp bất khả kháng theo quy định của BQL). Vì mình là trợ lý ảo nên không có thẩm quyền giải quyết tài chính, bạn vui lòng mang cuống vé/hóa đơn đến gặp trực tiếp Trưởng quầy vé tại cổng chính số 1 Hỏa Lò để được nhân viên tiếp nhận và hỗ trợ cụ thể nhé.',
          authorityBoundary: pol?.authority_boundary || 'AI tuyệt đối không tự ý cam kết hoàn tiền. Trưởng quầy vé thụ lý trực tiếp.',
          actionableGuidance: 'Đến gặp Trưởng quầy vé tại Cổng chính số 1 Hỏa Lò.',
          requiresHuman: true,
          style: 'CUSTOMER_CARE'
        };
      }

      if (sub === 'MANAGEMENT_FEEDBACK') {
        const pol = this.getPolicy('POLICY_COMPLAINTS_HANDLING');
        return {
          scenarioId: 'COMPLAINT_MANAGEMENT_FEEDBACK',
          response: isEn
            ? 'The Management Board of Hoa Lo Prison Relic deeply values constructive feedback to continuously improve our services. You can leave your comments in the official Guest Registry at the main entrance, speak with the Duty Reception Team Leader, or contact us via our official hotline and fanpage.'
            : 'Ban Quản lý Di tích Nhà tù Hỏa Lò luôn trân trọng mọi ý kiến phản ánh chân thành của du khách để không ngừng nâng cao chất lượng dịch vụ. Bạn có thể để lại ý kiến vào "Sổ góp ý" đặt tại quầy thông tin cổng số 1 Hỏa Lò, hoặc trao đổi trực tiếp với Tổ trưởng tổ đón tiếp trong ca trực để được ghi nhận đầy đủ nhất.',
          authorityBoundary: pol?.authority_boundary || 'Ban Quản lý và Tổ trưởng tổ đón tiếp tiếp nhận phản hồi.',
          actionableGuidance: 'Ghi ý kiến vào Sổ góp ý tại quầy thông tin cổng số 1 Hỏa Lò.',
          requiresHuman: true,
          style: 'CUSTOMER_CARE'
        };
      }

      // Default complaint
      return {
        scenarioId: 'COMPLAINT_GENERAL',
        response: isEn
          ? 'We are truly sorry that your visit did not meet your expectations today. We sincerely value your feedback to improve our visitor experience. Could you share what caused your dissatisfaction? If this requires immediate assistance, our team at the main gate (No. 1 Hoa Lo) is always ready to support you.'
          : 'Rất tiếc vì trải nghiệm hôm nay chưa đáp ứng được kỳ vọng của bạn. Mình xin chân thành ghi nhận phản hồi này để ban quản lý di tích hoàn thiện chất lượng dịch vụ tốt hơn. Bạn có thể chia sẻ cụ thể điều gì khiến bạn chưa hài lòng không? Nếu vấn đề cần can thiệp trực tiếp ngay lúc này, bạn có thể đến phòng thường trực tại cổng số 1 phố Hỏa Lò để được các anh chị nhân viên hỗ trợ xử lý nhé.',
        authorityBoundary: 'Tổ thường trực cổng chính số 1 Hỏa Lò tiếp nhận.',
        actionableGuidance: 'Liên hệ phòng thường trực Cổng số 1 để được hỗ trợ trực tiếp.',
        requiresHuman: true,
        style: 'EMPATHETIC_SUPPORT'
      };
    }

    // 2. KỊCH BẢN HỖ TRỢ KHẨN CẤP & TÀI SẢN (CUSTOMER_ASSISTANCE)
    if (intent === 'CUSTOMER_ASSISTANCE') {
      const sub = subIntent || 'GENERAL_SUPPORT';

      if (sub === 'LOST_CHILD_URGENT') {
        const pol = this.getPolicy('POLICY_LOST_CHILD_URGENT');
        return {
          scenarioId: 'ASSISTANCE_LOST_CHILD',
          response: isEn
            ? 'URGENT: Please stay calm and immediately alert the nearest security guard or receptionist, or run to the Main Security Office at Gate No. 1. Our security team will broadcast an urgent announcement across the entire site loudspeaker network and coordinate at all exits to find your child immediately!'
            : 'TÌNH HUỐNG KHẨN CẤP: Bạn hãy giữ bình tĩnh và báo ngay cho nhân viên bảo vệ hoặc lễ tân gần nhất, hoặc chạy ngay ra phòng thường trực bảo vệ tại cổng chính số 1 Hỏa Lò. Đội ngũ an ninh di tích sẽ lập tức phát thông báo khẩn cấp trên hệ thống loa truyền thanh toàn di tích và phối hợp chốt chặn các cửa ra vào để tìm bé ngay lập tức!',
          authorityBoundary: pol?.authority_boundary || 'Phát loa khẩn cấp toàn di tích và chốt chặn cửa ra vào.',
          actionableGuidance: 'Báo ngay bảo vệ gần nhất hoặc chạy ra phòng thường trực cổng 1 phát loa.',
          requiresHuman: true,
          style: 'EMPATHETIC_SUPPORT'
        };
      }

      if (sub === 'MEDICAL_EMERGENCY') {
        const pol = this.getPolicy('POLICY_FIRST_AID_MEDICAL');
        return {
          scenarioId: 'ASSISTANCE_MEDICAL',
          response: isEn
            ? 'MEDICAL PRIORITY: Please notify the nearest security guard immediately or head to the First Aid Station at Gate No. 1. Our team is trained for initial first aid and will coordinate an emergency ambulance (115) or transfer to the nearby Hanoi Heart Hospital / Viet Duc Hospital if needed.'
            : 'TÌNH HUỐNG SỨC KHỎE CẦN ƯU TIÊN: Bạn hãy thông báo gấp cho nhân viên bảo vệ gần nhất hoặc đưa người thân đến phòng thường trực y tế tại cổng số 1 Hỏa Lò để được sơ cấp cứu ban đầu. Nếu cần cấp cứu y tế chuyên sâu, nhân viên trực sẽ lập tức điều phối xe cứu thương 115 hoặc chuyển sang Bệnh viện Tim / Việt Đức ngay cạnh di tích.',
          authorityBoundary: pol?.authority_boundary || 'Sơ cấp cứu tại chỗ, điều phối xe cấp cứu 115 hoặc chuyển viện gần nhất.',
          actionableGuidance: 'Báo bảo vệ gần nhất hoặc đưa người bệnh ra phòng y tế cổng số 1.',
          requiresHuman: true,
          style: 'EMPATHETIC_SUPPORT'
        };
      }

      if (sub === 'LOST_ITEM') {
        const pol = this.getPolicy('POLICY_LOST_AND_FOUND');
        return {
          scenarioId: 'ASSISTANCE_LOST_ITEM',
          response: isEn
            ? 'If you have lost personal belongings, please visit the Security Office at the main entrance (No. 1 Hoa Lo Street) to fill in the Lost & Found Registry. Our security team will cross-check items turned in during the day; internal security camera review is conducted by our security personnel according to duty protocols to assist you.'
            : 'Bạn hãy đến ngay phòng thường trực bảo vệ tại cổng chính số 1 Hỏa Lò để khai báo thông tin vào \'Sổ tiếp nhận tài sản thất lạc\'. Đội an ninh sẽ đối chiếu các đồ vật do khách hoặc nhân viên nhặt được bàn giao trong ngày; quy trình trích xuất camera an ninh nội bộ sẽ do Đội bảo vệ thực hiện theo đúng thẩm quyền nghiệp vụ để hỗ trợ bạn.',
          authorityBoundary: pol?.authority_boundary || 'Khai báo sổ tài sản thất lạc. Trích xuất camera do Đội bảo vệ thực hiện theo thẩm quyền nghiệp vụ.',
          actionableGuidance: 'Khai báo tại Phòng thường trực bảo vệ Cổng số 1 Hỏa Lò.',
          requiresHuman: true,
          style: 'CUSTOMER_CARE'
        };
      }

      if (normQuery.includes('huong dan vien') || normQuery.includes('thuyet minh vien')) {
        return {
          scenarioId: 'ASSISTANCE_DOCENT_BOOKING',
          response: isEn
            ? 'To book an on-site tour guide or docent for elderly visitors or large delegations, please register in advance via our official hotline or directly at the ticket booth at Gate No. 1. Our reception and security personnel are also available to support elderly visitors with walking and wheelchair navigation.'
            : 'Để đăng ký thuyết minh viên trực tiếp hỗ trợ cho đoàn tham quan (nhất là đoàn người cao tuổi hoặc đoàn đông), bạn hãy liên hệ qua hotline chính thức hoặc đăng ký tại quầy vé cổng chính số 1 Hỏa Lò. Đội ngũ nhân viên và bảo vệ di tích luôn sẵn lòng hỗ trợ dìu và đẩy xe lăn cho các cụ trong suốt lộ trình tham quan.',
          authorityBoundary: 'Đăng ký tại quầy vé cổng chính hoặc qua hotline chính thức.',
          actionableGuidance: 'Đăng ký tại quầy vé Cổng số 1 hoặc liên hệ hotline BQL.',
          requiresHuman: true,
          style: 'CUSTOMER_CARE'
        };
      }

      return {
        scenarioId: 'ASSISTANCE_GENERAL',
        response: isEn
          ? 'For immediate assistance or special help, please approach our on-site security guards or receptionists located at the entrance and courtyard. They are always on duty to support you.'
          : 'Đối với các vấn đề cần hỗ trợ trực tiếp tại chỗ, bạn hãy liên hệ ngay với các nhân viên bảo vệ hoặc lễ tân túc trực tại sảnh đón tiếp và sân trại giam. Ban quản lý di tích luôn sẵn sàng hỗ trợ bạn nhanh nhất.',
        authorityBoundary: 'Nhân viên lễ tân và bảo vệ tại chỗ.',
        actionableGuidance: 'Gặp nhân viên lễ tân/bảo vệ tại sảnh đón tiếp hoặc sân trại.',
        requiresHuman: true,
        style: 'CUSTOMER_CARE'
      };
    }

    // 3. KỊCH BẢN TRỢ NĂNG & ĐỐI TƯỢNG ĐẶC BIỆT (ACCESSIBILITY_SUPPORT)
    if (intent === 'ACCESSIBILITY_SUPPORT') {
      const isBlind = normQuery.includes('khiem thi') || normQuery.includes('nguoi mu') || normQuery.includes('gay dan duong');
      const isChildren = normQuery.includes('tre em') || normQuery.includes('tre con') || normQuery.includes('em be') || normQuery.includes('con nho') || normQuery.includes('tre nho');

      if (isBlind) {
        return {
          scenarioId: 'ACCESSIBILITY_BLIND',
          response: isEn
            ? 'Visually impaired visitors may bring guide canes inside the relic and use our Audioguide system for detailed commentary at each section. Our security guards and reception staff are always on duty to support and guide your way safely.'
            : 'Du khách khiếm thị hoàn toàn được mang gậy dẫn đường vào tham quan di tích. Bạn có thể sử dụng tai nghe Audioguide để nghe thuyết minh chi tiết từng khu vực, và đội ngũ nhân viên, bảo vệ luôn sẵn sàng đồng hành, hỗ trợ dẫn đường khi bạn cần giúp đỡ.',
          authorityBoundary: 'Nhân viên bảo vệ và lễ tân hỗ trợ trực tiếp.',
          actionableGuidance: 'Thuê tai nghe Audioguide tại quầy vé và yêu cầu hỗ trợ dẫn đường.',
          requiresHuman: false,
          style: 'CUSTOMER_CARE'
        };
      }

      if (isChildren) {
        const pol = this.getPolicy('POLICY_CHILDREN_SAFETY');
        return {
          scenarioId: 'ACCESSIBILITY_CHILDREN',
          response: isEn
            ? 'Children under 15 enjoy free admission but must be accompanied by an adult. Parents are advised to guide children mindfully when passing darker historical cells such as Cachot and the Guillotine room.'
            : 'Trẻ em dưới 15 tuổi được miễn phí vé tham quan nhưng bắt buộc phải có người lớn đi cùng để bảo đảm an toàn. Các khu vực như Ngục tối Cachot và Máy chém có không gian tối và bối cảnh lịch sử chân thực, phụ huynh nên chú ý hướng dẫn phù hợp với tâm lý của các bé.',
          authorityBoundary: pol?.authority_boundary || 'Phụ huynh có trách nhiệm giám sát trẻ nhỏ.',
          actionableGuidance: 'Trẻ em dưới 15 tuổi miễn vé; phụ huynh lưu ý khi qua buồng tối Cachot và máy chém.',
          requiresHuman: false,
          style: 'CUSTOMER_CARE'
        };
      }

      const pol = this.getPolicy('POLICY_ACCESSIBILITY_WHEELCHAIR');
      return {
        scenarioId: 'ACCESSIBILITY_WHEELCHAIR_ELDERLY',
        response: isEn
          ? 'Hoa Lo Prison is a historic building dating back to 1896 with some high stone thresholds. Ramps are equipped along main corridors, and our staff are always glad to assist visitors with wheelchairs or elderly guests.'
          : 'Di tích Nhà tù Hỏa Lò là công trình cổ xây dựng từ năm 1896 nên một số lối đi có bậc tam cấp. Ban quản lý đã bố trí dốc thoải ở các trục chính; nhân viên bảo vệ và lễ tân luôn sẵn lòng hỗ trợ dìu hoặc đẩy xe lăn khi du khách có nhu cầu.',
        authorityBoundary: pol?.authority_boundary || 'Dốc thoải trục chính; nhân viên hỗ trợ đẩy xe lăn.',
        actionableGuidance: 'Đi theo trục dốc thoải; liên hệ bảo vệ khi cần trợ giúp đẩy xe qua bậc đá.',
        requiresHuman: false,
        style: 'CUSTOMER_CARE'
      };
    }

    // 4. KỊCH BẢN THÔNG TIN VÉ & ƯU ĐÃI (TICKET_INFORMATION)
    if (intent === 'TICKET_INFORMATION') {
      if (normQuery.includes('sinh vien') || normQuery.includes('hoc sinh') || normQuery.includes('hssv')) {
        return {
          scenarioId: 'TICKET_STUDENT_DISCOUNT',
          response: isEn
            ? 'Students enjoy a 50% discount on daytime admission, priced at 25,000 VND per ticket (please present a valid student ID card at the ticket booth).'
            : 'Đối với học sinh, sinh viên, giá vé được giảm 50% chỉ còn 25.000 VNĐ/vé khi xuất trình thẻ học sinh, sinh viên hợp lệ tại quầy vé.',
          authorityBoundary: 'Quầy vé kiểm tra thẻ HSSV hợp lệ trước khi xuất vé ưu đãi.',
          actionableGuidance: 'Xuất trình thẻ HSSV tại Quầy vé cổng chính để nhận ưu đãi 25.000 VNĐ/vé.',
          requiresHuman: false,
          style: 'QUICK_ANSWER'
        };
      }

      if (normQuery.includes('tour dem') || normQuery.includes('dem thieng lieng')) {
        const pol = this.getPolicy('POLICY_TICKET_NIGHT_TOUR');
        return {
          scenarioId: 'TICKET_NIGHT_TOUR',
          response: isEn
            ? 'Tickets for the Sacred Night Tour range from 399,000 to 499,000 VND depending on the theme. Due to limited seats, advance booking via the official Hoa Lo Prison fanpage or hotline is required.'
            : 'Vé tour đêm "Đêm thiêng liêng" có giá từ 399.000 đến 499.000 VNĐ tùy chủ đề. Do số lượng chỗ mỗi suất có hạn, vé tour đêm bắt buộc phải đặt trước qua fanpage hoặc hotline chính thức của di tích.',
          authorityBoundary: pol?.authority_boundary || 'Đặt trước qua Fanpage/Hotline chính thức.',
          actionableGuidance: 'Đặt chỗ trước qua Fanpage Di tích Nhà tù Hỏa Lò hoặc hotline.',
          requiresHuman: false,
          style: 'QUICK_ANSWER'
        };
      }

      const pol = this.getPolicy('POLICY_TICKET_DAYTIME');
      return {
        scenarioId: 'TICKET_GENERAL_DAYTIME',
        response: isEn
          ? 'Daytime ticket to Hoa Lo Prison is 50,000 VND for adults. A 50% discount (25,000 VND) applies to students with valid student ID, seniors aged 60+ with ID, and severely disabled visitors. Free entry is granted to children under 15 and revolutionary contributors. Audio guides are available for rent at the ticket booth for around 50,000 VND. For the Sacred Night Tour (399,000 - 499,000 VND), advance booking via the official page is required.'
          : 'Giá vé tham quan ban ngày tại Di tích Hỏa Lò là 50.000 VNĐ/người lớn. Học sinh, sinh viên (xuất trình thẻ HSSV), người cao tuổi từ 60 tuổi trở lên và người khuyết tật nặng được giảm 50% còn 25.000 VNĐ. Miễn phí vé cho trẻ em dưới 15 tuổi và người có công với cách mạng. Bạn có thể thuê tai nghe thuyết minh Audioguide tại quầy vé với phí 50.000 VNĐ/máy. Riêng tour đêm "Đêm thiêng liêng" có giá từ 399.000 - 499.000 VNĐ và cần đặt trước qua fanpage chính thức.',
        authorityBoundary: pol?.authority_boundary || 'Niêm yết tại quầy vé cổng chính số 1 Hỏa Lò.',
        actionableGuidance: 'Mua vé trực tiếp tại Quầy vé cổng chính số 1 Hỏa Lò.',
        requiresHuman: false,
        style: 'CUSTOMER_CARE'
      };
    }

    // 5. KỊCH BẢN GIỜ HOẠT ĐỘNG (OPENING_HOURS)
    if (intent === 'OPENING_HOURS') {
      const pol = this.getPolicy('POLICY_HOURS_DAYTIME');
      return {
        scenarioId: 'HOURS_GENERAL',
        response: isEn
          ? 'Hoa Lo Prison Relic is open daily from 8:00 AM to 5:00 PM without lunch break, including weekends, public holidays, and Tet. The Sacred Night Tour takes place on Friday, Saturday, and Sunday evenings starting at 7:00 PM (booking in advance is mandatory).'
          : 'Di tích Lịch sử Nhà tù Hỏa Lò mở cửa từ 8:00 đến 17:00 tất cả các ngày trong tuần (từ Thứ Hai đến Chủ Nhật, kể cả ngày Lễ và Tết), mở cửa liên tục không nghỉ trưa. Các chương trình tour đêm "Đêm thiêng liêng" đón khách từ 19:00 các tối thứ Sáu, thứ Bảy và Chủ Nhật (cần đặt trước).',
        authorityBoundary: pol?.authority_boundary || 'Cố định 8:00 - 17:00 tất cả các ngày.',
        actionableGuidance: 'Tham quan ban ngày từ 8:00 đến 17:00 không nghỉ trưa.',
        requiresHuman: false,
        style: 'QUICK_ANSWER'
      };
    }

    // 6. KỊCH BẢN TIỆN ÍCH & CƠ SỞ VẬT CHẤT (FACILITY_SUPPORT)
    if (intent === 'FACILITY_SUPPORT') {
      const isRestroom = /vệ sinh|toilet|wc/i.test(normQuery);
      const isStorage = /gửi đồ|để đồ|balo|hành lý/i.test(normQuery);
      const isSouvenir = /lưu niệm|mua quà|quà tặng/i.test(normQuery);
      const isPhoto = /chụp ảnh|quay phim/i.test(normQuery);

      if (isRestroom) {
        return {
          scenarioId: 'FACILITY_WC',
          response: isEn
            ? 'Restrooms are located in the prison courtyard and near the souvenir area close to the exit, clearly marked with directional signs.'
            : 'Khu vệ sinh (WC) của di tích được bố trí tại khu vực sân trại giam và gần quầy lưu niệm ở lối ra, có biển chỉ dẫn rõ ràng và sạch sẽ.',
          authorityBoundary: 'Biển chỉ dẫn tại sân trại và lối ra.',
          actionableGuidance: 'Đi theo biển chỉ dẫn tại sân trại giam hoặc gần lối ra.',
          requiresHuman: false,
          style: 'QUICK_ANSWER'
        };
      }

      if (isStorage) {
        return {
          scenarioId: 'FACILITY_STORAGE',
          response: isEn
            ? 'Free storage lockers are provided near the ticket checkpoint for backpacks and bulky luggage. Please keep your valuables (wallet, phone, documents) with you.'
            : 'Di tích có khu vực tủ gửi đồ cá nhân miễn phí nằm ngay cạnh cổng soát vé cho balo và túi xách lớn. Du khách vui lòng tự giữ các tài sản quý giá như ví tiền và điện thoại bên mình nhé.',
          authorityBoundary: 'Tủ gửi đồ miễn phí cạnh cổng soát vé.',
          actionableGuidance: 'Gửi balo, túi lớn tại tủ đồ cạnh cổng soát vé; tự giữ tư trang quý giá.',
          requiresHuman: false,
          style: 'QUICK_ANSWER'
        };
      }

      if (isSouvenir) {
        return {
          scenarioId: 'FACILITY_SOUVENIR',
          response: isEn
            ? 'The cultural souvenir shop is located near the exit, featuring tote bags, notebooks, badges, and historical documents. During the Sacred Night Tour, visitors can enjoy special banyan tea and banyan jelly.'
            : 'Quầy lưu niệm nằm ở khu vực gần lối ra, giới thiệu nhiều ấn phẩm văn hóa đặc sắc như sổ tay, túi tote, huy hiệu và sách lịch sử. Trong tour đêm, du khách còn được thưởng thức đặc sản trà bàng và thạch bàng tri ân.',
          authorityBoundary: 'Quầy lưu niệm khu vực lối ra.',
          actionableGuidance: 'Ghé quầy lưu niệm tại lối ra để xem các ấn phẩm văn hóa Hỏa Lò.',
          requiresHuman: false,
          style: 'QUICK_ANSWER'
        };
      }

      if (isPhoto) {
        return {
          scenarioId: 'FACILITY_PHOTOGRAPHY',
          response: isEn
            ? 'Regular photo taking is allowed (please turn off camera flash in dark cells to protect relics and maintain solemnity). Commercial filming requires advance permission from the management board.'
            : 'Du khách được phép chụp ảnh lưu niệm thông thường tại di tích. Vui lòng tắt đèn flash tại các phòng giam để bảo quản hiện vật và giữ gìn không gian trang nghiêm; việc quay phim thương mại cần được Ban quản lý chấp thuận trước.',
          authorityBoundary: 'Quy định bảo quản di tích.',
          actionableGuidance: 'Được chụp ảnh lưu niệm, vui lòng tắt đèn flash tại buồng giam.',
          requiresHuman: false,
          style: 'QUICK_ANSWER'
        };
      }

      return {
        scenarioId: 'FACILITY_GENERAL',
        response: isEn
          ? 'Hoa Lo Prison provides free luggage lockers, restrooms in the courtyard, audio guides at the ticket booth, and a souvenir shop near the exit.'
          : 'Di tích Hỏa Lò trang bị đầy đủ tủ gửi đồ miễn phí ở cổng, nhà vệ sinh tại sân trại, quầy cho thuê tai nghe Audioguide và quầy lưu niệm ở lối ra phục vụ du khách.',
        authorityBoundary: 'Tiện ích phục vụ khách tham quan.',
        actionableGuidance: 'Tham khảo biển sơ đồ tiện ích tại cổng vào.',
        requiresHuman: false,
        style: 'CUSTOMER_CARE'
      };
    }

    // 7. KỊCH BẢN TƯ VẤN HÀNH TRÌNH (TOUR_RECOMMENDATION)
    if (intent === 'TOUR_RECOMMENDATION' || intent === 'VISIT_GUIDANCE') {
      const hasSpecificShortConstraint = userProfile?.timeConstraint != null && userProfile.timeConstraint <= 45;
      const isShort = hasSpecificShortConstraint || /ít thời gian|20 phút|30 phút|45 phút|vội|nhanh/i.test(normQuery);

      if (isShort) {
        return {
          scenarioId: 'TOUR_SHORT_HIGHLIGHT',
          response: isEn
            ? 'If you have only 20-45 minutes, focus on these core highlights: Main Gate (Maison Centrale) ➡️ Courtyard & Ancient Banyan Tree ➡️ Cachot Dark Cell ➡️ The Guillotine ➡️ Escape Sewer ➡️ American Pilot Section ("Hanoi Hilton") ➡️ Memorial Monument.'
            : 'Nếu có ít thời gian (khoảng 20 đến 45 phút), bạn nên ưu tiên lộ trình rút gọn qua các điểm dừng cốt lõi: Cổng chính Maison Centrale ➡️ Cây bàng cổ thụ sân trại ➡️ Ngục tối Cachot ➡️ Cỗ máy chém ➡️ Cửa cống ngầm vượt ngục ➡️ Khu trưng bày phi công Mỹ ➡️ Đài tưởng niệm.',
          authorityBoundary: 'Lộ trình tối ưu cho khách thời gian ngắn.',
          actionableGuidance: 'Theo tuyến rút gọn 7 điểm dừng chính.',
          requiresHuman: false,
          style: 'SMART_RECOMMENDATION'
        };
      }

      return {
        scenarioId: 'TOUR_STANDARD_ITINERARY',
        response: isEn
          ? 'A standard visit takes 60 to 90 minutes following the numbered sequence: Main gate ➡️ Collective male cells ➡️ Cachot ➡️ Female cell ➡️ Courtyard & Banyan tree ➡️ Death row Area D ➡️ Guillotine ➡️ Escape sewer ➡️ American pilot section ➡️ Memorial monument. Renting an audio guide will enhance your experience.'
          : 'Chuyến tham quan tiêu chuẩn kéo dài khoảng 60 đến 90 phút theo thứ tự các điểm dừng: Cổng chính Maison Centrale ➡️ Phòng giam tập thể nam ➡️ Ngục tối Cachot ➡️ Trại giam Nữ ➡️ Sân trại giam & Cây bàng cổ thụ ➡️ Xà lim tử hình Khu D ➡️ Cỗ máy chém ➡️ Cửa cống ngầm ➡️ Khu trưng bày phi công Mỹ ➡️ Đài tưởng niệm. Bạn nên thuê thêm tai nghe Audioguide để nghe thuyết minh chi tiết nhé.',
        authorityBoundary: 'Lộ trình chuẩn 10 chặng dừng.',
        actionableGuidance: 'Theo tuyến tham quan đánh số thứ tự 1 đến 10.',
        requiresHuman: false,
        style: 'SMART_RECOMMENDATION'
      };
    }

    return null;
  }
}

module.exports = new CustomerCareScenarioEngine();
