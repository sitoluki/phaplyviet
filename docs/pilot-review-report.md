# VBPL Labor-Law Pilot: Review Report Template

This document is a template for reviewing the 5-document VBPL official labor-law pilot after ingestion.

## Executive Summary

- **Pilot Size**: 5 documents (1994, 2012, 2019, 2020, 2024)
- **Time Span**: 30 years of labor law evolution
- **Status**: [To be filled after real ingestion]
- **Corpus Readiness**: [Ready / Needs Fixes]

## Document-by-Document Review

### Document 1: 1994 Labor Law

- **VBPL ItemID**: 10427
- **Code**: BLLD-1994
- **Title**: Bộ luật Không số
- **Official Source URL**: https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=10427

**Parse Results** (from `inspect-documents.ts`):
- Parse Status: [pending/parsed/needs_review/failed]
- Parse Confidence: [value] %
- Parser Warnings: [count]
- Sections Extracted: [count]
- Chunks Created: [count]
- Raw Snapshot Stored: [yes/no]

**Validation**:
- [ ] Parse confidence >= 0.7
- [ ] Citation traceability complete
- [ ] No missing sections
- [ ] No orphaned chunks
- [ ] Raw snapshot accessible

**Review Notes**:
- [Engineer notes on document quality]
- [Parser specific issues]
- [Recommendation: ready / needs manual fix / skip]

**Legal Reviewer Sign-off**:
- [ ] Document correctly identified
- [ ] Official source verified
- [ ] Content integrity confirmed
- Status: [Approved / Rejected]

---

### Document 2: 2012 Labor Law Amendment

- **VBPL ItemID**: 27615
- **Code**: 10/2012/QH13
- **Title**: Bộ luật 10/2012/QH13 Lao động
- **Official Source URL**: https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=27615

**Parse Results**:
- Parse Status: [pending/parsed/needs_review/failed]
- Parse Confidence: [value] %
- Parser Warnings: [count]
- Sections Extracted: [count]
- Chunks Created: [count]
- Raw Snapshot Stored: [yes/no]

**Validation**:
- [ ] Parse confidence >= 0.7
- [ ] Citation traceability complete
- [ ] No missing sections
- [ ] No orphaned chunks
- [ ] Raw snapshot accessible

**Review Notes**:
- [Engineer notes]
- [Legal reviewer notes]
- Status: [Approved / Rejected]

---

### Document 3: 2019 Current Labor Law

- **VBPL ItemID**: 139264
- **Code**: 45/2019/QH14
- **Title**: Bộ luật 45/2019/QH14
- **Official Source URL**: https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264

**Parse Results**:
- Parse Status: [pending/parsed/needs_review/failed]
- Parse Confidence: [value] %
- Parser Warnings: [count]
- Sections Extracted: [count]
- Chunks Created: [count]
- Raw Snapshot Stored: [yes/no]

**Validation**:
- [ ] Parse confidence >= 0.7
- [ ] Citation traceability complete
- [ ] No missing sections
- [ ] No orphaned chunks
- [ ] Raw snapshot accessible

**Review Notes**:
- [Engineer notes]
- [Most recent law - highest priority]
- Status: [Approved / Rejected]

---

### Document 4: 2020 Workers Abroad Amendment

- **VBPL ItemID**: 146643
- **Code**: 69/2020/QH14
- **Title**: Luật 69/2020/QH14
- **Official Source URL**: https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=146643

**Parse Results**:
- Parse Status: [pending/parsed/needs_review/failed]
- Parse Confidence: [value] %
- Parser Warnings: [count]
- Sections Extracted: [count]
- Chunks Created: [count]
- Raw Snapshot Stored: [yes/no]

**Validation**:
- [ ] Parse confidence >= 0.7
- [ ] Citation traceability complete
- [ ] No missing sections
- [ ] No orphaned chunks
- [ ] Raw snapshot accessible

**Review Notes**:
- [Engineer notes]
- [Specialized amendment - review for scope]
- Status: [Approved / Rejected]

---

### Document 5: 2024 Union Law

- **VBPL ItemID**: 172553
- **Code**: 50/2024/QH15
- **Title**: Luật 50/2024/QH15
- **Official Source URL**: https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=172553

**Parse Results**:
- Parse Status: [pending/parsed/needs_review/failed]
- Parse Confidence: [value] %
- Parser Warnings: [count]
- Sections Extracted: [count]
- Chunks Created: [count]
- Raw Snapshot Stored: [yes/no]

**Validation**:
- [ ] Parse confidence >= 0.7
- [ ] Citation traceability complete
- [ ] No missing sections
- [ ] No orphaned chunks
- [ ] Raw snapshot accessible

**Review Notes**:
- [Engineer notes]
- [Newest law - latest regulations]
- Status: [Approved / Rejected]

---

## Aggregate Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Documents Ingested | 5 | [value] | [✅/❌] |
| Avg Parse Confidence | >= 0.75 | [value] | [✅/⚠️/❌] |
| Low Confidence Docs | <= 1 | [value] | [✅/⚠️/❌] |
| Total Sections | >= 40 | [value] | [✅/❌] |
| Total Chunks | >= 100 | [value] | [✅/❌] |
| Citation Traceability | 100% | [value]% | [✅/❌] |
| Snapshots Stored | 5/5 | [value]/5 | [✅/❌] |

## Issue Summary

### Critical Issues (Block Release)
- [ ] No critical issues found
- [ ] [List any critical issues]

### High Priority Issues (Review Needed)
- [ ] No high priority issues
- [ ] [List any high priority issues]

### Low Priority Issues (Can Fix Later)
- [ ] No low priority issues
- [ ] [List any low priority issues]

## Recommendations

### For Engineering
- [ ] All documents ready for Phase 4 (embedding)
- [ ] [List any parser improvements needed]
- [ ] [List any data quality fixes needed]
- [ ] [List any infrastructure changes needed]

### For Legal Team
- [ ] All documents legally reviewed and approved
- [ ] [List any legal concerns]
- [ ] [List any source validity concerns]

### For Product
- [ ] Corpus is ready for retrieval implementation
- [ ] [List any scope changes needed]
- [ ] [List any priority changes]

## Sign-Offs

### Engineering Review
- Reviewed by: [Name] on [Date]
- Status: [Approved / Approved with Conditions / Rejected]
- Notes: [Brief summary]

### Legal Review
- Reviewed by: [Name] on [Date]
- Status: [Approved / Approved with Conditions / Rejected]
- Notes: [Brief summary]

### Product Review
- Reviewed by: [Name] on [Date]
- Status: [Approved / Approved with Conditions / Rejected]
- Notes: [Brief summary]

## Next Steps

- [ ] Deploy to staging
- [ ] Enable retrieval search (Phase 4)
- [ ] Run legal QA tests
- [ ] Launch answer generation (Phase 6)

## Appendix: Database Verification

To generate this report programmatically:

```bash
# Inspect all ingested documents
tsx scripts/inspect-documents.ts

# Validate idempotency
tsx scripts/validate-idempotency.ts

# Query raw data
psql postgresql://localhost:5432/phaplyviet_legal
> SELECT legal_document_id, title, parse_confidence, parser_warnings_json
  FROM legal_documents ld
  JOIN legal_document_versions ldv ON ld.current_version_id = ldv.legal_document_version_id
  ORDER BY ld.created_at;
```
