# Legal AI 6-Month Build Blueprint

Tài liệu này là bản mở rộng từ roadmap gốc, với mục tiêu biến ý tưởng thành kế hoạch triển khai có thể giao cho team product, engineering, content và growth để thực thi.

---

## 1. Mục tiêu tài liệu

### 1.1 Mục tiêu
Xây dựng một sản phẩm Legal AI cho thị trường Việt Nam, bắt đầu từ nhu cầu tra cứu pháp lý và giải đáp tình huống phổ thông, sau đó mở rộng sang subscription và kết nối luật sư.

### 1.2 Mục tiêu 6 tháng
- Ra mắt một MVP có người dùng thật và có traffic SEO ban đầu.
- Có hệ thống AI Q&A kèm trích dẫn nguồn pháp luật.
- Có nền tảng content đủ rộng để kéo organic traffic.
- Có ít nhất 1 nguồn doanh thu hoạt động thực tế.
- Có nền vận hành đủ an toàn để scale tiếp sau tháng thứ 6.

### 1.3 Kết quả kỳ vọng sau 6 tháng
- 100–200 người dùng Pro đầu tiên.
- 100+ bài content chất lượng.
- Bộ dữ liệu pháp luật được index và cập nhật định kỳ.
- Hệ thống KPI, feedback loop, quality control hoạt động ổn định.
- Quy trình xử lý các câu hỏi nhạy cảm và cơ chế chuyển tiếp sang luật sư thật.

---

## 2. Định vị sản phẩm

### 2.1 Tuyên ngôn sản phẩm
Một trợ lý pháp lý tiếng Việt dành cho người dùng phổ thông và doanh nghiệp nhỏ, giúp:
- hiểu nhanh quy định pháp luật,
- xác định hướng xử lý ban đầu,
- tra cứu căn cứ pháp lý,
- và kết nối luật sư khi vụ việc vượt quá mức tự xử lý.

### 2.2 Vấn đề thị trường đang tồn tại
- Văn bản pháp luật khó đọc, dài, nhiều thuật ngữ.
- Người dùng không biết bắt đầu từ đâu khi gặp vấn đề pháp lý.
- Website pháp lý hiện có thường mạnh về dữ liệu nhưng yếu về UX và ngôn ngữ dễ hiểu.
- Người dùng khó phân biệt đâu là thông tin tham khảo và đâu là tư vấn pháp lý chính thức.
- Nhiều nhu cầu chỉ cần định hướng bước đầu, chưa đến mức phải thuê luật sư ngay.

### 2.3 Định vị khác biệt
- Giao diện và trải nghiệm giống một trợ lý dễ dùng, không giống kho lưu trữ văn bản khô cứng.
- Câu trả lời có trích dẫn nguồn và giải thích bằng ngôn ngữ đời thường.
- Có lớp kiểm soát rủi ro, không khuyến khích người dùng dùng AI như tư vấn pháp lý chính thức.
- Kết hợp 3 lớp giá trị: content SEO + AI Q&A + lawyer referral.

### 2.4 Non-goals trong 6 tháng đầu
Không làm trong giai đoạn đầu:
- Tư vấn pháp lý chính thức có giá trị thay thế luật sư.
- Tự động soạn hồ sơ phức tạp hoặc đại diện tố tụng.
- Hệ thống case management phức tạp cho law firm.
- Hỗ trợ toàn bộ mọi lĩnh vực luật từ ngày đầu.
- Mobile app native.

---

## 3. User persona và JTBD

### 3.1 Persona 1 — Người dân có vấn đề pháp lý phổ thông
**Đặc điểm**
- 24–45 tuổi.
- Không có nền tảng pháp lý.
- Tìm kiếm qua Google hoặc Facebook.

**Nhu cầu**
- Muốn hiểu mình có quyền gì.
- Muốn biết quy trình xử lý và giấy tờ cần chuẩn bị.
- Muốn biết có cần luật sư hay không.

**JTBD**
- “Khi tôi gặp một tình huống pháp lý, tôi muốn có câu trả lời dễ hiểu và có căn cứ để biết nên làm gì tiếp theo.”

**Ví dụ use case**
- Ly hôn thuận tình cần giấy tờ gì.
- Đất chưa có sổ đỏ có chuyển nhượng được không.
- Bị công ty cho nghỉ việc trái luật thì làm gì.

### 3.2 Persona 2 — Chủ doanh nghiệp nhỏ / hộ kinh doanh
**Đặc điểm**
- 26–45 tuổi.
- Tự xử lý nhiều vấn đề doanh nghiệp cơ bản.
- Cần thông tin nhanh, thực dụng.

**Nhu cầu**
- Thành lập công ty, hóa đơn, lao động, hợp đồng cơ bản.
- Cần checklist và mức phạt/rủi ro.

**JTBD**
- “Khi doanh nghiệp của tôi gặp một vấn đề pháp lý-vận hành, tôi muốn tra cứu nhanh nghĩa vụ, quy trình và rủi ro để ra quyết định đúng.”

### 3.3 Persona 3 — Người lao động / HR cấp cơ bản
**Đặc điểm**
- Cần hiểu quy định lao động, BHXH, nghỉ phép, nghỉ việc.
- Có xu hướng hỏi theo tình huống cụ thể hơn là tra cứu luật.

### 3.4 Persona 4 — Người dùng cần luật sư thật
**Đặc điểm**
- Đã thử tự tìm hiểu nhưng vụ việc phức tạp.
- Muốn kết nối luật sư đúng chuyên môn, nhanh, minh bạch.

**JTBD**
- “Khi vụ việc của tôi vượt quá khả năng tự xử lý, tôi muốn được kết nối với đúng luật sư phù hợp mà không phải mò mẫm.”

### 3.5 Persona ưu tiên trong 90 ngày đầu
Ưu tiên 2 nhóm:
- Người dân có vấn đề pháp lý phổ thông.
- Chủ doanh nghiệp nhỏ / hộ kinh doanh.

Lý do:
- Search demand rõ.
- Nhiều long-tail keyword.
- Dễ bắt đầu bằng content + AI Q&A.
- Có khả năng chuyển đổi sang subscription hoặc referral.

---

## 4. Use case và bài toán ưu tiên

### 4.1 Bài toán ưu tiên P0
- Hỏi đáp pháp lý cơ bản bằng tiếng Việt dễ hiểu.
- Tra cứu điều luật liên quan.
- Đọc bài hướng dẫn thủ tục theo từng tình huống.
- Hiểu các bước tiếp theo và giấy tờ cần chuẩn bị.

### 4.2 Bài toán ưu tiên P1
- Tính nhanh chi phí/thời gian/mức phạt theo rule tương đối rõ.
- Lưu lịch sử câu hỏi.
- Xuất PDF câu trả lời hoặc checklist.
- Cập nhật văn bản pháp luật mới.

### 4.3 Bài toán ưu tiên P2
- Soạn biểu mẫu cơ bản.
- Gợi ý luật sư phù hợp.
- Hỗ trợ B2B light cho doanh nghiệp nhỏ.

---

## 5. Product scope theo giai đoạn

### 5.1 Phân lớp scope

#### P0 — Bắt buộc để ra MVP
- Landing page rõ value proposition.
- Content hub + bài SEO.
- Search văn bản pháp luật cơ bản.
- AI Q&A có citation.
- Đăng nhập cơ bản.
- Rate limiting cho free user.
- Trang disclaimer và chính sách quyền riêng tư.
- Event tracking cơ bản.

#### P1 — Nên có trong 6 tháng
- Chat history.
- Suggested follow-up questions.
- Email capture + newsletter.
- Pricing page + payment.
- Công cụ tính pháp lý.
- Feed văn bản pháp luật mới.
- Export PDF.

#### P2 — Có thể bổ sung nếu đủ lực
- Lawyer marketplace đơn giản.
- Lead routing cho luật sư.
- Affiliate/referral.
- Tiếng Anh cho expat.
- B2B workspace mini.

### 5.2 Nguyên tắc cắt scope
Khi thiếu nguồn lực, ưu tiên theo thứ tự:
1. Citation + safety của AI.
2. Search và content.
3. Tracking và conversion funnel.
4. Payment.
5. Lawyer referral.

---

## 6. Product requirements chi tiết

## 6.1 Module A — Content hub

### Mục tiêu
Tạo organic traffic và cung cấp lớp kiến thức nền trước khi user chat với AI.

### Yêu cầu chức năng
- Danh mục bài viết theo chủ đề.
- Trang bài viết có mục lục, breadcrumb, schema, FAQ.
- Gợi ý bài liên quan.
- CTA dẫn sang AI Q&A hoặc email capture.
- Hiển thị ngày cập nhật gần nhất.
- Gắn tag theo chủ đề, loại thủ tục, mức độ phức tạp, năm hiệu lực luật.

### Output mong muốn
- User đọc xong biết mình đang ở loại vấn đề nào.
- Tăng page depth và số lượt bắt đầu chat.

### Edge cases
- Bài viết cũ nhưng luật đã thay đổi.
- Chủ đề có nhiều văn bản chồng lấn.
- Nội dung AI viết nháp nhưng review chưa kỹ.

### Definition of done
- Bài có title chuẩn SEO.
- Có mục “Căn cứ pháp lý tham khảo”.
- Có FAQ.
- Có CTA rõ ràng.
- Có reviewer sign-off.

## 6.2 Module B — Search văn bản pháp luật

### Mục tiêu
Cho người dùng tìm điều luật và văn bản gốc nhanh hơn cách search truyền thống.

### Yêu cầu chức năng
- Search full-text theo từ khóa.
- Lọc theo loại văn bản, cơ quan ban hành, năm, trạng thái hiệu lực.
- Trang chi tiết văn bản.
- Jump-to-article / điều / khoản.
- Highlight đoạn match.

### Kết quả kỳ vọng
- User tìm được văn bản gốc trước khi cần AI giải thích.

### Definition of done
- Search dưới 1–2 giây với tập dữ liệu MVP.
- Có metadata đủ để lọc.
- Có link nguồn gốc hoặc reference nguồn.

## 6.3 Module C — AI Q&A có citation

### Mục tiêu
Trả lời câu hỏi tiếng Việt đơn giản, dễ hiểu, có căn cứ và có hướng hành động tiếp theo.

### Input
- Câu hỏi tự nhiên của user.
- Ngữ cảnh chat trước đó.
- Bộ văn bản pháp luật đã index.

### Output bắt buộc
- Tóm tắt câu trả lời ngắn gọn.
- Giải thích từng ý chính.
- Trích dẫn nguồn theo điều/khoản/văn bản.
- Nêu rõ đây là thông tin tham khảo.
- Gợi ý bước tiếp theo.
- Với tình huống nhạy cảm hoặc phức tạp: khuyến nghị liên hệ luật sư.

### Rule sản phẩm
- Không được trả lời như khẳng định tuyệt đối khi thiếu dữ liệu.
- Không được bịa nguồn.
- Khi retrieval yếu, phải nói rõ giới hạn và mời user tra cứu thêm hoặc hỏi lại.
- Không trả lời dạng dứt khoát về kết quả tố tụng, xác suất thắng kiện, hay hướng lách luật.

### UX yêu cầu
- Citation hiển thị rõ dưới dạng footnote/card.
- User bấm vào citation xem nguồn trích.
- Có nút “Câu trả lời này hữu ích không?”
- Có nút “Gửi cho luật sư” hoặc “Tra cứu thêm”.

### Rate limit đề xuất
- Guest: 1–2 câu/ngày.
- Free registered: 3 câu/ngày.
- Pro: soft cap cao, theo fair usage.

### Những trường hợp phải chặn hoặc giảm độ tự tin
- Thiếu dữ liệu văn bản làm căn cứ.
- Hỏi về vụ việc đang tranh chấp phức tạp.
- Hỏi cách lách luật, trốn tránh nghĩa vụ, che giấu thông tin.
- Hỏi liên quan tố tụng hình sự, tài sản giá trị lớn, tranh chấp nghiêm trọng.

### Definition of done
- Có retrieval log.
- Có prompt template ổn định.
- Có fallback nếu không đủ bằng chứng.
- Có feedback event gửi về analytics.

## 6.4 Module D — Calculators / tools

### Mục tiêu
Tạo use case cụ thể, tăng conversion và khả năng share.

### Công cụ nên ưu tiên
- Tính phí sang tên.
- Tính BHXH 1 lần.
- Tính trợ cấp thôi việc.
- Checklist hồ sơ ly hôn thuận tình.

### Điều kiện chỉ nên build
- Rule đủ rõ, ít nhập nhằng pháp lý.
- Có thể giải thích cách tính và căn cứ.

## 6.5 Module E — Subscription

### Yêu cầu chức năng
- Pricing page rõ Free vs Pro.
- Payment flow đơn giản.
- Kích hoạt quyền truy cập sau thanh toán.
- Quản lý trạng thái gói, renewal, cancellation.
- Email onboarding sau đăng ký.

### Quyền lợi Pro khuyến nghị
- Nâng quota AI.
- Lưu lịch sử đầy đủ.
- Export PDF.
- Ưu tiên support.
- Mở thêm template/checklist nâng cao.

### Điều chưa nên làm ngay
- Quá nhiều tier.
- Enterprise phức tạp.
- White-label.

## 6.6 Module F — Lawyer referral

### Mục tiêu
Chuyển những case phức tạp sang luật sư thật và tạo nguồn doanh thu thứ hai.

### Chức năng tối thiểu
- Danh sách luật sư.
- Hồ sơ luật sư cơ bản.
- Filter theo chuyên môn, khu vực, mức phí dự kiến.
- Form gửi nhu cầu.
- Lead assignment thủ công hoặc bán tự động.

### Không nên làm quá sớm
- Marketplace thời gian thực.
- Booking calendar phức tạp.
- Đấu giá lead.

---

## 7. User flows cốt lõi

## 7.1 Flow 1 — SEO article → AI Q&A → signup
1. User vào từ Google.
2. Đọc bài viết.
3. Bấm CTA hỏi AI thêm.
4. Hỏi 1 câu miễn phí.
5. Hệ thống trả lời có citation.
6. Sau quota, mời đăng ký tài khoản.
7. Sau khi đăng ký, user hỏi tiếp.

## 7.2 Flow 2 — User hỏi trực tiếp tình huống pháp lý
1. User vào trang chat.
2. Nhập câu hỏi.
3. Hệ thống chạy retrieval.
4. Trả câu trả lời + nguồn + disclaimer.
5. User feedback “hữu ích / không hữu ích”.
6. Nếu câu hỏi phức tạp, hiện CTA sang luật sư.

## 7.3 Flow 3 — User cần luật sư
1. User đọc nội dung / hỏi AI.
2. Hệ thống phát hiện case phức tạp.
3. Gợi ý form kết nối luật sư.
4. User để lại thông tin.
5. Lead vào CRM / inbox admin.
6. Admin phân phối lead cho đối tác phù hợp.

## 7.4 Flow 4 — Free user → Pro
1. User dùng hết quota.
2. Hệ thống hiện paywall.
3. User xem lợi ích Pro.
4. Thanh toán.
5. Kích hoạt gói ngay.
6. Gửi onboarding email.

---

## 8. Data và RAG architecture

## 8.1 Nguồn dữ liệu
### Nguồn chính
- vbpl.vn
- moj.gov.vn
- Các nguồn công khai khác có thể dùng làm tham chiếu bổ sung nếu hợp lệ

### Nguyên tắc nguồn
- Ưu tiên nguồn chính thống.
- Nguồn thứ cấp chỉ dùng để giải thích, không dùng làm căn cứ pháp lý gốc.
- Phải lưu metadata nguồn cho từng đoạn được index.

## 8.2 Entity/data model tối thiểu

### Bảng document
- document_id
- title
- source_url
- issuing_body
- document_type
- document_number
- issue_date
- effective_date
- expiry_date
- legal_status
- topic_tags
- language
- checksum
- fetched_at
- last_reviewed_at

### Bảng document_chunk
- chunk_id
- document_id
- article_number
- clause_number
- point_number
- chunk_text
- normalized_text
- embedding_vector
- token_count
- chunk_order
- citation_label

### Bảng article_content
- article_id
- slug
- title
- category
- primary_keyword
- status_draft_reviewed_published
- reviewed_by
- published_at
- updated_at
- legal_review_cycle_date

### Bảng chat_session / chat_message
- session_id
- user_id
- created_at
- topic_guess
- risk_level
- plan_type
- messages
- retrieval_refs
- model_used
- response_feedback

## 8.3 Chuẩn chunking đề xuất
- Chunk theo đơn vị điều/khoản nếu có cấu trúc rõ.
- Nếu điều dài, cắt tiếp thành chunk nhỏ nhưng vẫn giữ article/clause metadata.
- Kích thước chunk nên tối ưu để vừa retrieval vừa giữ ngữ cảnh pháp lý.
- Không cắt mất tiêu đề, số điều, số khoản.

## 8.4 Retrieval pipeline đề xuất
1. Normalize query tiếng Việt.
2. Classify intent: tra cứu thủ tục / quyền lợi / mức phạt / tranh chấp / doanh nghiệp.
3. Hybrid search: lexical + vector.
4. Rerank top chunks.
5. Prompt model với source snippets.
6. Ép model chỉ sử dụng nguồn đã cấp.
7. Sinh output có citation map.
8. Log kết quả retrieval và feedback.

## 8.5 Guardrails cho RAG
- Nếu confidence retrieval thấp, không trả lời quá tự tin.
- Nếu không có nguồn đủ liên quan, trả lời theo hướng “chưa đủ căn cứ”.
- Tách câu trả lời thành “thông tin tham khảo” và “bước nên làm tiếp theo”.
- Không cho model tự dựng citation.

## 8.6 Versioning văn bản pháp luật
- Mỗi document phải có trạng thái hiệu lực.
- Nếu văn bản bị thay thế/sửa đổi, phải giữ liên kết quan hệ giữa bản cũ và bản mới.
- UI cần hiển thị “cập nhật theo văn bản đang có hiệu lực tại thời điểm X” nếu làm được.

## 8.7 Chiến lược cập nhật dữ liệu
- Daily job kiểm tra nguồn mới.
- Job re-index khi có văn bản mới hoặc nội dung thay đổi.
- Dashboard nội bộ cho số văn bản mới, lỗi ingest, chunk lỗi.
- Mỗi bài content có lịch review 90 ngày hoặc khi có trigger thay đổi luật.

## 8.8 Evaluation framework tối thiểu
### Offline evaluation
- Bộ 100–200 câu hỏi chuẩn theo 4 chủ đề MVP.
- Chấm theo các tiêu chí:
  - đúng intent,
  - đúng căn cứ,
  - không bịa,
  - dễ hiểu,
  - hành động tiếp theo hợp lý.

### Online evaluation
- Like/dislike.
- Tỷ lệ user hỏi lại cùng chủ đề.
- Tỷ lệ click citation.
- Tỷ lệ escalated to lawyer.
- Tỷ lệ câu trả lời bị report.

---

## 9. Legal, privacy, compliance và trust

## 9.1 Disclaimers bắt buộc
- Đây là thông tin tham khảo, không thay thế ý kiến tư vấn pháp lý chính thức.
- Kết quả có thể chưa phản ánh đầy đủ mọi tình tiết cụ thể của vụ việc.
- Với vấn đề phức tạp hoặc tranh chấp thực tế, nên liên hệ luật sư.

## 9.2 Chính sách dữ liệu cá nhân
Cần có tối thiểu:
- Privacy policy.
- Terms of use.
- Cookie/analytics notice nếu cần.
- Cơ chế user yêu cầu xóa lịch sử chat.
- Thời hạn lưu dữ liệu rõ ràng.

## 9.3 Data retention đề xuất
- Guest chat: không lưu hoặc lưu ngắn hạn để chống abuse.
- Free user: lưu lịch sử trong thời hạn giới hạn.
- Pro user: lưu dài hơn nhưng có cơ chế xóa.
- Lead gửi cho luật sư: lưu tối thiểu cần thiết và có consent.

## 9.4 Moderation và risk routing
### Nhóm câu hỏi rủi ro cao
- Hình sự nghiêm trọng.
- Tố tụng đang diễn ra.
- Tranh chấp tài sản lớn.
- Hướng dẫn lách luật, trốn thuế, che giấu giao dịch.

### Cách xử lý
- Không trả lời theo hướng hỗ trợ hành vi sai trái.
- Trả lời ở mức thông tin pháp lý chung, không chỉ cách thực hiện.
- Khuyến nghị luật sư / cơ quan có thẩm quyền.

## 9.5 Human escalation
Cần có rule rõ khi nào chuyển sang luật sư thật:
- Case nhắc đến số tiền lớn.
- Có tranh chấp đang phát sinh.
- Có thời hạn pháp lý ngắn.
- Có nguy cơ xử phạt hoặc kiện tụng.
- User yêu cầu rà soát hồ sơ cụ thể.

## 9.6 Kiểm soát chất lượng content
- AI chỉ được dùng để viết nháp.
- Mỗi bài quan trọng phải có người review.
- Cần checklist editorial/legal review trước khi publish.

---

## 10. Content strategy và content ops

## 10.1 Taxonomy nội dung
Phân loại theo:
- Chủ đề lớn: đất đai, doanh nghiệp, lao động, hôn nhân gia đình.
- Intent: thủ tục, quyền lợi, mức phạt, hồ sơ, timeline, chi phí, mẫu đơn.
- Funnel stage: awareness, consideration, conversion.

## 10.2 Content buckets đề xuất
### Bucket A — Hỏi đáp trực tiếp
Ví dụ: “Ly hôn thuận tình cần giấy tờ gì?”

### Bucket B — Checklist / thủ tục
Ví dụ: “Checklist sang tên sổ đỏ năm 2026”.

### Bucket C — So sánh / phân biệt
Ví dụ: “Công ty TNHH 1 thành viên khác gì công ty cổ phần?”

### Bucket D — Công cụ tính / mẫu biểu
Ví dụ: “Tính BHXH 1 lần”.

### Bucket E — Cập nhật luật mới
Ví dụ: “Điểm mới của quy định X ảnh hưởng ai?”

## 10.3 Editorial workflow
1. Chọn keyword và intent.
2. Brief bài viết.
3. AI tạo outline + draft.
4. Editor chỉnh ngôn ngữ.
5. Reviewer pháp lý rà căn cứ.
6. Publish.
7. Theo dõi ranking/click/conversion.
8. Refresh khi cần.

## 10.4 Tiêu chuẩn một bài content tốt
- Trả lời đúng intent ngay phần đầu.
- Có mục “Tóm tắt nhanh”.
- Có căn cứ pháp lý tham khảo.
- Có FAQ.
- Có CTA sang AI hoặc checklist.
- Có date updated.

## 10.5 Lịch sản xuất đề xuất
### Giai đoạn 1: 8 tuần đầu
- 4–5 bài/tuần.
- 70% long-tail practical keywords.
- 20% so sánh/phân biệt.
- 10% cập nhật luật mới.

### Giai đoạn 2: tuần 9–24
- 3–4 bài mới/tuần.
- 1–2 bài refresh/tuần.
- 1 nội dung shareable/tool/FAQ hub mỗi tuần.

## 10.6 KPI content
- Organic sessions.
- Click-through rate từ Google.
- Time on page.
- Scroll depth.
- AI chat starts per article.
- Email signups per article.
- Conversion to paid per article cluster.

---

## 11. GTM, SEO và phân phối

## 11.1 Acquisition channels ưu tiên
- SEO Google.
- Community seeding trong group liên quan.
- Newsletter.
- Facebook/TikTok short explainer nếu đủ lực.
- Referral từ lawyer/network.

## 11.2 SEO strategy cụ thể
### Giai đoạn 1
- Chọn 30–50 long-tail keywords ít cạnh tranh.
- Tập trung những query có intent rõ ràng.
- Build topical clusters quanh 4 chủ đề MVP.

### Giai đoạn 2
- Dùng Search Console để tìm keyword impression cao nhưng CTR thấp.
- Tạo hub pages / category pages.
- Tạo FAQ index pages.

## 11.3 Landing pages nên có
- /dat-dai
- /lao-dong
- /doanh-nghiep
- /hon-nhan-gia-dinh
- /hoi-dap
- /van-ban-moi
- /tim-luat-su
- /pricing

## 11.4 Email capture plan
- Form nhận bản tin pháp lý.
- Lead magnet: checklist miễn phí, mẫu hồ sơ, tóm tắt luật mới.
- Welcome sequence 3 email.

## 11.5 Kế hoạch có 100 user đầu tiên
- Chọn 10 bài giải quyết vấn đề thật phổ biến.
- Seed vào 10–20 group/cộng đồng liên quan một cách chọn lọc.
- Tặng free quota rộng hơn cho 30 user đầu tiên để lấy feedback.
- Phỏng vấn 10 user đã dùng chat ít nhất 3 lần.

---

## 12. Monetization và pricing

## 12.1 Thesis monetization
Nguồn doanh thu nên đi theo thứ tự:
1. Ads để kiếm đồng đầu tiên.
2. Subscription để kiểm chứng willingness to pay.
3. Lawyer referral để monetize case phức tạp.
4. B2B light nếu thấy demand thật.

## 12.2 Pricing hypothesis
### Free
- Đọc bài không giới hạn.
- Search cơ bản.
- 1–3 câu AI/ngày.

### Pro đề xuất
- 99k/tháng hoặc 799k/năm.
- Nên test thêm 149k/tháng nếu bổ sung giá trị mạnh hơn.

### Pro value proposition
- Nhiều câu AI hơn.
- Lịch sử chat.
- Export PDF/checklist.
- Ưu tiên support.
- Gợi ý bước làm cụ thể hơn.

## 12.3 Các thí nghiệm pricing
- Test paywall sau câu hỏi thứ 1 vs thứ 3.
- Test monthly vs yearly default.
- Test free trial vs freemium trực tiếp.
- Test CTA “hỏi thêm với Pro” vs “mở lịch sử + PDF”.

## 12.4 KPI monetization
- Free → signup rate.
- Signup → paid conversion.
- Paid retention tháng 1 và tháng 3.
- Revenue per active user.
- Cost per paid conversion.

---

## 13. Lawyer partner ops

## 13.1 Mục tiêu
Tạo lớp giải quyết nhu cầu phức tạp mà AI không nên hoặc không thể xử lý trọn vẹn.

## 13.2 Tiêu chí tuyển luật sư đối tác
- Có chuyên môn rõ theo lĩnh vực.
- Có hồ sơ nghề nghiệp đáng tin cậy.
- Có khả năng phản hồi trong SLA cam kết.
- Có thái độ làm việc phù hợp với kênh online.

## 13.3 Dữ liệu hồ sơ luật sư cần có
- Tên.
- Ảnh/hồ sơ ngắn.
- Khu vực.
- Chuyên môn.
- Kinh nghiệm.
- Phí tư vấn tham khảo.
- Kênh liên hệ.
- Tỷ lệ phản hồi.
- Review nội bộ.

## 13.4 Luồng lead ops tối thiểu
1. User gửi yêu cầu.
2. Admin review lead.
3. Gắn tag lĩnh vực + độ khẩn.
4. Chuyển luật sư phù hợp.
5. Theo dõi trạng thái: new / assigned / contacted / converted / closed.

## 13.5 SLA đề xuất
- Lead khẩn: phản hồi trong 2 giờ làm việc.
- Lead thường: phản hồi trong 24 giờ.

## 13.6 Rủi ro partner ops
- Luật sư phản hồi chậm.
- Chất lượng lead thấp.
- Tranh chấp phí/refund.
- Không đồng nhất trải nghiệm user.

## 13.7 Cách giảm rủi ro
- Bắt đầu thủ công với ít đối tác.
- Theo dõi conversion theo từng luật sư.
- Dùng NDA/thoả thuận hợp tác đơn giản.
- Có quy tắc xử lý khiếu nại.

---

## 14. Analytics và KPI framework

## 14.1 North star metric đề xuất
**Số phiên giải quyết vấn đề thành công**

Có thể định nghĩa là: user nhận được câu trả lời/citation hữu ích hoặc được chuyển đúng sang luật sư/nguồn phù hợp.

## 14.2 Funnel KPI
### Top of funnel
- Organic impressions.
- Organic clicks.
- Sessions.
- Returning visitors.

### Mid funnel
- Article to chat start rate.
- Search success rate.
- Citation click rate.
- Email signup rate.

### Conversion
- Signup rate.
- Free to paid conversion.
- Lawyer lead submit rate.
- Paid ARPU.

### Retention / quality
- D1 / D7 / D30 retention.
- Session depth.
- Helpfulness score.
- Reported unsafe/inaccurate answer rate.
- Repeat question rate.

## 14.3 Product instrumentation events cần track
- article_view
- article_cta_click
- search_query_submitted
- search_result_clicked
- chat_started
- chat_answer_rendered
- citation_clicked
- chat_feedback_positive
- chat_feedback_negative
- signup_started
- signup_completed
- paywall_viewed
- checkout_started
- subscription_activated
- lawyer_lead_submitted

## 14.4 Dashboard tối thiểu cho founder
- Traffic dashboard.
- Content dashboard.
- Chat quality dashboard.
- Revenue dashboard.
- Partner lead dashboard.

---

## 15. Technical architecture đề xuất

## 15.1 Stack đề xuất kế thừa từ roadmap gốc
- Frontend: Next.js.
- DB/Auth/Vector: Supabase PostgreSQL + pgvector.
- UI: Tailwind + shadcn/ui.
- Hosting: Vercel.
- AI model: 1 model chính + khả năng fallback model rẻ hơn cho câu đơn giản.
- Email: Resend.
- Analytics: Plausible/Umami hoặc tương đương.

## 15.2 Services logical architecture
- Web app.
- Content pipeline.
- Legal source ingest pipeline.
- Search service.
- Chat/RAG orchestration.
- Payment service.
- Partner ops/admin.

## 15.3 Môi trường
- local
- staging
- production

## 15.4 Những thứ kỹ thuật bắt buộc phải có sớm
- Logging.
- Error monitoring.
- Rate limiting.
- Abuse protection.
- Secrets management.
- Backup DB.

## 15.5 Admin tools tối thiểu
- Review content.
- Review failed chat / flagged answers.
- Xem lead luật sư.
- Xem ingest jobs.
- Re-index 1 document.

---

## 16. Tổ chức thực thi và nguồn lực tối thiểu

## 16.1 Nếu solo founder + freelancer
### Vai trò bắt buộc
- Founder/product owner.
- 1 dev full-stack.
- 1 reviewer pháp lý part-time.
- 1 content editor part-time.

## 16.2 Nếu team nhỏ 3–5 người
- Product/Growth lead.
- Full-stack engineer.
- Data/content pipeline engineer hoặc backend hỗ trợ.
- Legal reviewer/editor.
- Content/SEO operator.

## 16.3 Responsibility matrix gợi ý
- Product scope: Founder/Product.
- AI prompt/RAG: Eng + Product.
- Content brief: SEO/Content.
- Legal review: Reviewer pháp lý.
- Publishing & refresh: Content ops.
- Revenue/experiment: Founder/Growth.

---

## 17. Budget ước tính 6 tháng

## 17.1 Nhóm chi phí
- Domain.
- Hosting/infra.
- AI usage.
- Content production.
- Legal review.
- Design/dev freelance.
- Tools analytics/email.

## 17.2 Khung ngân sách nên kiểm soát
### Tối giản
- Chủ yếu free tier + chi phí AI thấp.
- Legal review theo bài trọng điểm.

### Khuyến nghị thực tế
- Dành ngân sách riêng cho legal review và content refresh.
- Đừng chỉ tính chi phí code và model; chi phí vận hành nội dung mới là phần dễ phát sinh lâu dài.

---

## 18. Roadmap 6 tháng dạng execution plan

## Tháng 1 — Foundation
### Mục tiêu tháng
- Có skeleton sản phẩm.
- Có pipeline ingest MVP.
- Có 10–15 bài đầu tiên.

### Deliverables
- Brand/domain/basic site.
- Auth cơ bản.
- Content model.
- Ingest 1 bộ nguồn pháp luật đầu tiên.
- Search page cơ bản.
- Analytics setup.
- Privacy + disclaimer pages.

### Exit criteria
- Search hoạt động với dữ liệu thật.
- Có ít nhất 10 bài published.
- Event tracking có dữ liệu.

## Tháng 2 — MVP launch
### Mục tiêu tháng
- Ra mắt AI Q&A bản đầu.
- Bắt đầu có traffic và feedback.

### Deliverables
- Chat UI bản đầu.
- Citation rendering.
- Guest/free quota.
- Email capture.
- 25–40 bài published tổng cộng.
- QA checklist cho câu trả lời AI.

### Exit criteria
- Có user thật dùng chat.
- Tỷ lệ answer có citation đạt mục tiêu nội bộ.
- Có feedback loop hoạt động.

## Tháng 3 — SEO and quality hardening
### Mục tiêu tháng
- Tăng traffic.
- Cải thiện chất lượng retrieval và content.

### Deliverables
- Hybrid search/rerank tốt hơn.
- /hoi-dap hub.
- Refresh content theo Search Console.
- 1–2 legal calculators.
- Quality dashboard cho chat.

### Exit criteria
- Organic traffic tăng đều.
- Tỷ lệ feedback tích cực cải thiện.
- Có ít nhất 1 tool chuyển đổi tốt.

## Tháng 4 — Monetization beta
### Mục tiêu tháng
- Kiểm chứng willingness to pay.

### Deliverables
- Pricing page.
- Payment integration.
- Pro entitlements.
- Chat history.
- Export PDF.
- 20–30 user beta.

### Exit criteria
- Có user trả tiền đầu tiên.
- Biết được paywall placement nào tốt hơn.

## Tháng 5 — Subscription launch + partner beta
### Mục tiêu tháng
- Chính thức mở Pro.
- Thử referral luật sư.

### Deliverables
- Subscription launch.
- Onboarding emails.
- Lawyer partner directory.
- Lead form + CRM ops đơn giản.
- Content > 80 bài.

### Exit criteria
- Có paid conversion ổn định.
- Có lead luật sư đầu tiên được xử lý.

## Tháng 6 — Scale and review
### Mục tiêu tháng
- Tối ưu mô hình tăng trưởng và doanh thu.

### Deliverables
- A/B test pricing.
- Mở thêm 1–2 chủ đề.
- Review unit economics.
- Quyết định tiếp tục scale / narrow niche / pivot.

### Exit criteria
- Có kết luận rõ về 3 câu hỏi:
  1. SEO có kéo user đủ không?
  2. AI có tạo giá trị đủ để trả tiền không?
  3. Lawyer referral có đáng đầu tư tiếp không?

---

## 19. Release checklist trước khi public

### Product
- CTA rõ.
- Trải nghiệm mobile ổn.
- Không có bug chặn flow chính.

### AI quality
- Có citation.
- Có fallback khi không chắc.
- Có disclaimer.
- Không bịa nguồn trong test set.

### Legal/compliance
- Terms.
- Privacy.
- Consent cho lead form.
- Chính sách xóa dữ liệu.

### Tracking
- Events hoạt động.
- Dashboard xem được.
- Error monitoring bật.

### Ops
- Có người review feedback.
- Có nơi xử lý leads.
- Có lịch content tuần kế tiếp.

---

## 20. Risk register mở rộng

| Rủi ro | Mức độ | Ảnh hưởng | Cách giảm thiểu |
|---|---|---|---|
| AI trả lời sai hoặc bịa citation | Rất cao | Mất trust, rủi ro pháp lý | Guardrail, evaluation set, reviewer loop, fallback |
| Luật thay đổi khiến content lỗi thời | Cao | SEO và trust giảm | Review cycle, update job, content freshness tagging |
| Traffic thấp hơn kỳ vọng | Cao | Không có demand đầu vào | Tập trung long-tail, niche rõ, community seeding |
| Chi phí model cao | Trung bình | Unit economics xấu | Cache, routing model, quota, monitor cost |
| Paid conversion thấp | Trung bình | Monetization chậm | Test paywall, refine value prop, improve use cases |
| Lawyer partner vận hành kém | Trung bình | User experience xấu | Manual ops, ít partner trước, SLA rõ |
| Thiếu legal review | Cao | Sai nội dung, giảm trust | Chọn topic ưu tiên, checklist review, flag bài quan trọng |
| Founder/team quá tải | Cao | Delay delivery | Cắt scope quyết liệt, ưu tiên P0/P1 |

---

## 21. Quyết định chiến lược nên chốt sớm

### Quyết định 1
Bắt đầu rộng 4 chủ đề hay tập trung 1 niche sâu trước?

**Khuyến nghị:** vẫn giữ 4 chủ đề như roadmap gốc ở mức discovery, nhưng trong SEO và AI nên chọn 1–2 cụm thắng nhanh để đào sâu trước, ví dụ đất đai + lao động.

### Quyết định 2
Content-first hay AI-first?

**Khuyến nghị:** content-first + AI-assisted. SEO tạo demand bền hơn, còn AI là lớp chuyển đổi và khác biệt hóa.

### Quyết định 3
Subscription hay referral là revenue chính?

**Khuyến nghị:** subscription là bài test sản phẩm; referral là lớp doanh thu bổ sung cho case phức tạp. Không nên phụ thuộc hoàn toàn referral quá sớm.

---

## 22. Kế hoạch 30 ngày đầu tiên nên làm ngay

### Tuần 1
- Chốt niche ưu tiên.
- Chốt taxonomy content.
- Setup repo, deploy, auth, analytics.
- Thiết kế data model ingest.

### Tuần 2
- Crawl/index nguồn đầu tiên.
- Build article template.
- Viết 5–7 bài đầu.
- Build search base.

### Tuần 3
- Build chat base + citation UI.
- Test 30 câu hỏi mẫu.
- Viết thêm 5–8 bài.

### Tuần 4
- Launch closed beta.
- Thu feedback.
- Fix retrieval/prompt issues.
- Chuẩn bị launch public nhỏ.

---

## 23. Kết luận

Roadmap gốc đủ tốt để định hướng, nhưng để xây dựng thật thì cần thêm 8 lớp vận hành: persona, scope ưu tiên, feature spec, RAG/data, compliance, KPI, content ops và partner ops. Bản blueprint này được thiết kế để lấp đúng các chỗ đó.

Nếu chỉ được giữ một nguyên tắc xuyên suốt trong 6 tháng đầu, thì đó là:

**Đừng xây một chatbot pháp lý chung chung; hãy xây một hệ thống giải quyết câu hỏi pháp lý phổ thông có nguồn, có kiểm soát rủi ro và có đường chuyển tiếp sang con người khi cần.**
