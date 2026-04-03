import { describe, it, expect } from 'vitest';
import { RiskDetector } from '../packages/legal-core/src/riskDetector.js';

describe('RiskDetector', () => {
    const detector = new RiskDetector();

    it('should detect high-risk litigation topics', () => {
        const result = detector.detect('Tôi bị kiện ở tòa, phải làm gì?');
        expect(result.riskLevel).toBe('high');
        expect(result.reasons.length).toBeGreaterThan(0);
        expect(result.requiresLegalDisclaimer).toBe(true);
        expect(result.escalationMessage).toBeDefined();
    });

    it('should detect high-risk divorce topics', () => {
        const result = detector.detect('Ly hôn thuận tình cần chuẩn bị giấy tờ gì?');
        expect(result.riskLevel).toBe('high');
        expect(result.requiresLegalDisclaimer).toBe(true);
    });

    it('should detect high-risk criminal law topics', () => {
        const result = detector.detect('Tôi bị tố cáo về hành vi phạm tội, đó là tội gì?');
        expect(result.riskLevel).toBe('high');
        expect(result.requiresLegalDisclaimer).toBe(true);
    });

    it('should detect high-risk tax topics', () => {
        const result = detector.detect('Khai báo thuế không chính xác, sẽ bị phạt bao nhiêu?');
        expect(result.riskLevel).toBe('high');
        expect(result.requiresLegalDisclaimer).toBe(true);
    });

    it('should detect medium-risk employment topics', () => {
        const result = detector.detect('Công ty không trả lương đầy đủ, tôi có quyền gì?');
        expect(result.riskLevel).toBe('medium');
        expect(result.requiresLegalDisclaimer).toBe(false);
        expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should detect medium-risk inheritance topics', () => {
        const result = detector.detect('Chia thừa kế di sản cha mẹ như thế nào?');
        expect(result.riskLevel).toBe('medium');
        expect(result.requiresLegalDisclaimer).toBe(false);
    });

    it('should classify general questions as low-risk', () => {
        const result = detector.detect('Bộ luật Lao động có bao nhiêu điều?');
        expect(result.riskLevel).toBe('low');
        expect(result.reasons).toHaveLength(0);
        expect(result.requiresLegalDisclaimer).toBe(false);
        expect(result.escalationMessage).toBeUndefined();
    });

    it('should include escalation message for high-risk', () => {
        const result = detector.detect('Tôi đang tranh chấp hợp đồng với công ty');
        expect(result.riskLevel).toBe('high');
        expect(result.escalationMessage).toContain('KHÔNG phải là tư vấn pháp lý chính thức');
        expect(result.escalationMessage).toContain('luật sư');
    });

    it('should detect multiple risk patterns in same query', () => {
        const result = detector.detect('Ly hôn và tranh chấp tài sản');
        expect(result.riskLevel).toBe('high');
        expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
        const resultLower = detector.detect('tôi bị kiện');
        const resultUpper = detector.detect('TÔI BỊ KIỆN');
        expect(resultLower.riskLevel).toBe(resultUpper.riskLevel);
    });
});
