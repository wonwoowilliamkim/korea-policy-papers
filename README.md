# 한국 정책평가 연구 지도 · Korea Policy Papers

> 한국 정책 평가에 핵심적인 탑 저널 논문들을 온톨로지 기반 인터랙티브 그래프로 정리한 웹사이트.
> Obsidian 그래프 뷰처럼 — 정책 영역 → 세부 주제 → 논문 → 연구자가 연결된 탐색 가능한 맵.

**Live site:** [wonwoowilliamkim.github.io/korea-policy-papers](https://wonwoowilliamkim.github.io/korea-policy-papers)

---

## 왜 이 프로젝트인가?

한국의 정책 평가 연구자들은 두 개의 세계를 동시에 알아야 한다:
- **한국 특수성**: 전세 제도, 수능, 기초생활보장, 사교육 규제 등 한국만의 정책 맥락
- **글로벌 방법론**: DiD, RDD, IV, Matching 등 국제 탑 저널의 인과추론 기준

이 지도는 두 세계를 연결한다. 한국 정책 맥락과 해외 방법론 템플릿을 하나의 그래프로 시각화해서, **"이 정책 평가에는 어떤 논문을 참고해야 하나?"**를 클릭 몇 번으로 파악할 수 있게 한다.

---

## 논문 분류 기준

| 태그 | 의미 |
|------|------|
| 🇰🇷 | 한국 데이터·정책 직접 분석 논문 |
| 🌐 | 한국과 직접 비교 가능한 유사 정책 평가 (방법론 템플릿) |
| 📐 | 한국 정책 평가에 핵심적인 방법론 논문 |

**타겟 저널:** AER, QJE, JPE, REStud, Econometrica, AEJ Applied, AEJ Econ Policy, JPubE, JEEA, REStat

---

## 커버리지

| 정책 영역 | 핵심 질문 | 대표 논문 |
|---|---|---|
| **저출생 대응** | 출산장려금·아동수당이 출생률에 미치는 효과 | Milligan (2005 JPE), Cohen et al. (2013 REStud) |
| **교육 정책** | 학급 규모·교사 질·사교육 규제의 효과 | Angrist & Lavy (1999 QJE), Chetty et al. (2014 AER) |
| **부동산·주거** | 임대차 3법·종부세·전세 제도 효과 | Diamond et al. (2019 AER), Autor et al. (2014 JPE) |
| **노동시장** | 최저임금·고용보호법·근로시간 단축 | Card & Krueger (1994 AER), Autor et al. (2007 QJE) |
| **사회보험·복지** | 건강보험·실업급여·기초생활보장 효과 | Currie & Gruber (1996 QJE), Chetty (2008 JPE) |
| **지역·지방** | 혁신도시·세종시 이전·지방소멸 대응 | Kline & Moretti (2014 QJE) |
| **방법론** | DiD, RDD, IV, 충분통계량 접근법 | Callaway & Sant'Anna (2021), Calonico et al. (2014) |

**26편 논문 · 30명 연구자 · 7개 정책 영역 · 22개 세부 주제 · 200+ 연결**

---

## 프로젝트 구조

```
korea-policy-papers/
├── data/
│   └── ontology/
│       ├── topics.yaml        # 7개 정책 영역 + 22개 세부 주제 (한국어 설명 포함)
│       ├── papers.yaml        # 26편 논문 (🇰🇷/🌐/📐 태그 분류)
│       └── researchers.yaml   # 30명 연구자 프로파일
├── scripts/
│   └── build_graph.py         # YAML → site/graph.json 변환
├── site/                      # GitHub Pages 배포 대상
│   ├── index.html
│   ├── style.css              # 다크 테마 · Noto Sans KR · 한국 레드 액센트
│   ├── graph.js               # D3 v7 · 툴팁 · 키보드 단축키
│   ├── search.js              # 클라이언트사이드 검색
│   └── graph.json             # 자동 생성
└── .github/workflows/
    └── deploy.yml             # Push → GitHub Actions 자동 배포
```

---

## 로컬 실행

```bash
pip install pyyaml
python scripts/build_graph.py
python -m http.server 8080 --directory site
# → http://localhost:8080
```

---

## UI 사용법

| 기능 | 방법 |
|------|------|
| **탐색** | 노드 클릭 → 연결 하이라이트 + 상세 패널 |
| **검색** | `⌘K` / `Ctrl+K` → 논문·연구자·토픽 검색 |
| **필터** | 헤더 버튼으로 토픽/논문/연구자만 표시 |
| **줌·패닝** | 스크롤 줌 · 드래그 패닝 |
| **닫기** | `Esc` 또는 패널 ✕ 버튼 |

---

## 논문 추가 방법

`data/ontology/papers.yaml`에 아래 형식으로 추가 후 커밋하면 GitHub Actions가 자동 배포:

```yaml
- id: author_year
  title: "논문 제목"
  authors: [성1, 성2]
  year: 2024
  journal: AER
  topics: [minimum_wage, labor_policy]
  tag: "🌐"
  url: https://doi.org/...
  summary: >
    2-3문장 요약. 한국 정책과의 연관성 포함.
```

---

## 관련 프로젝트

- **[Behavioral Public Economics Map](https://wonwoowilliamkim.github.io/behavioral-econ-map)** — 행동공공경제학 연구 지도
- **[Korea Policy Eval (APE-KR)](https://github.com/wonwoowilliamkim/korea-policy-eval)** — 한국 정책 자동 평가 파이프라인
