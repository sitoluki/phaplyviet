export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskDetectionResult {
    riskLevel: RiskLevel;
    reasons: string[];
    requiresLegalDisclaimer: boolean;
    escalationMessage?: string;
}

// High-risk keywords that should trigger safer response mode
const HIGH_RISK_PATTERNS = {
    litigation: /tố tụng|hành động|kiện|tòa|phán quyết|lên tòa/gi,
    divorce: /ly hôn|chia tài sản|nuôi con|asp hôn nhân|chứng thư|hưởng|cấp dưỡng/gi,
    criminal: /hình sự|tội phạm|phạm tội|bị cáo|công tố|tố cáo|kỳ án|lệnh bắt/gi,
    taxes: /thuế|khai báo|nộp thuế|kiểm tra thuế|phạt|không khai báo/gi,
    immigration: /xuất cảnh|nhập cảnh|visa|passport|diện tích|hộ chiếu/gi,
    intellectual_property: /bản quyền|sáng chế|thương hiệu|bồi thường|vi phạm bản quyền/gi,
    labor_dispute: /đơn kinh doanh|đình công|tranh chấp lao động|kỷ luật|sa thải|khiếu nại/gi,
    contract_dispute: /tranh chấp hợp đồng|vi phạm hợp đồng|hủy hợp đồng|phá vỡ|bồi thường/gi,
};

const MEDIUM_RISK_PATTERNS = {
    employment: /lương|quyền lợi|bảo hiểm xã hội|hưởng lương|ký hợp đồng/gi,
    realestate: /bất động sản|đất đai|nhà cửa|môi giới|chuyển nhượng/gi,
    inheritance: /di sản|thừa kế|di chúc|phân chia|người thừa kế/gi,
};

export class RiskDetector {
    detect(queryText: string): RiskDetectionResult {
        const reasons: string[] = [];
        let riskLevel: RiskLevel = 'low';

        // Check high-risk patterns
        for (const [topic, pattern] of Object.entries(HIGH_RISK_PATTERNS)) {
            if (pattern.test(queryText)) {
                reasons.push(`Chứa chủ đề nhạy cảm: ${topic.replace(/_/g, ' ')}`);
                riskLevel = 'high';
                pattern.lastIndex = 0; // Reset regex
                break;
            }
        }

        // Check medium-risk patterns if not already high-risk
        if (riskLevel !== 'high') {
            for (const [topic, pattern] of Object.entries(MEDIUM_RISK_PATTERNS)) {
                if (pattern.test(queryText)) {
                    reasons.push(`Chứa chủ đề yêu cầu cẩn thận: ${topic.replace(/_/g, ' ')}`);
                    riskLevel = 'medium';
                    pattern.lastIndex = 0; // Reset regex
                    break;
                }
            }
        }

        const escalationMessage = this.buildEscalationMessage(riskLevel, queryText);

        return {
            riskLevel,
            reasons,
            requiresLegalDisclaimer: riskLevel === 'high',
            escalationMessage: riskLevel === 'high' ? escalationMessage : undefined,
        };
    }

    private buildEscalationMessage(riskLevel: RiskLevel, queryText: string): string {
        if (riskLevel === 'high') {
            return `⚠️ **THÔNG BÁO QUAN TRỌNG**: Vấn đề này liên quan đến những ngành pháp lý phức tạp và có rủi ro cao. Câu trả lời dưới đây chỉ mang tính chất tham khảo và **KHÔNG phải là tư vấn pháp lý chính thức**. 

Các trường hợp này đòi hỏi hỗ trợ từ một luật sư có thực tiễn. Chúng tôi khuyến cáo bạn liên hệ với một chuyên gia pháp lý để được tư vấn riêng.`;
        }
        return '';
    }
}
