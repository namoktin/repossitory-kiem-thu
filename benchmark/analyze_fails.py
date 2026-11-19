import json
from collections import Counter

with open('benchmark/BENCHMARK_REPORT_500_HOLDOUT.json', encoding='utf-8') as f:
    data = json.load(f)

fails = [d for d in data['results'] if not d['passed']]
print(f"Tổng số ca chưa đạt (chưa đạt pass 8.5 hoặc dính hallucination): {len(fails)}/500")

c = Counter(f['group'] for f in fails)
for grp, cnt in c.items():
    print(f" - {grp}: {cnt} ca")

print("\n--- CHI TIẾT CÁC CA CHƯA ĐẠT ---")
for idx, f in enumerate(fails):
    print(f"{idx+1}. [{f['group']}] Q: '{f['question']}'")
    print(f"    Expected: {f['expected_intent']} | Got: {f['returned_intent']} | Score: {f['score_10']}/10")
    print(f"    Hallucination: {f.get('hallucination_found')} | Notes: {f.get('notes')}")
    print(f"    Reply (snippet): {f['reply'][:120]}...\n")
