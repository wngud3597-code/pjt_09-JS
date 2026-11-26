# 09-pjt 아키텍처 및 구현 설계서

## 1. 프로젝트 개요
- **프로젝트명**: `09-pjt` (DOM 조작 PJT)
- **목표**: 제공된 도서·작가·분류 데이터를 기반으로 Vanilla JavaScript DOM API를 활용해 조회, 검색, 추가, 즐겨찾기, 상세 모달, 페이지네이션을 제공하는 정적 웹 서비스 구현
- **기술 스택**: HTML5, Bootstrap 5.3 (CDN), Vanilla JavaScript (ES6+)

---

## 2. 디렉터리 구조

```text
09-pjt/
├── .gitignore
├── README.md
├── index.html                  # 진입점 (루트 고정)
├── assets/
│   └── stack-of-books.png      # 기본 커버 이미지
├── data/
│   ├── authors.js              # 작가 로우데이터 (읽기 전용)
│   ├── books.js                # 도서 로우데이터 (읽기 전용)
│   └── categories.js           # 분류 로우데이터 (읽기 전용)
├── js/
│   └── script.js               # DOM 조작 메인 스크립트
└── docs/
    ├── ARCHITECTURE.md
    └── screenshots/            # 실행 결과 및 GitLab 커밋 캡처
```

---

## 3. 데이터 스키마 및 핵심 설계 원칙

### 3.1 제공 데이터 구조
- `data/categories.js` (`categoryRawData` → `categories`): `{ id: number, name: string }`
- `data/authors.js` (`authorRawData` → `authors`): `{ id: number, name: string }`
- `data/books.js` (`bookRawData` → `books`):
  ```js
  {
    title: string,
    description: string,
    cover: string,       // URL 또는 빈 문자열
    authorId: number,    // authors[].id 참조
    categoryId: number,  // categories[].id 참조
  }
  ```

### 3.2 핵심 구현 원칙
1. **원본 데이터 보존**: `data/` 하위 3개 데이터 파일은 수정하지 않는다.
2. **DOM 생성 규칙**: HTML 요소를 추가할 때 `Element.innerHTML` 사용을 금지하고 `document.createElement`, `textContent`, `append`, `DocumentFragment`를 사용한다. (내용 비우기 용도의 `el.innerHTML = ''`만 허용)
3. **객체 참조 기반 즐겨찾기**: `books` 항목에 `id`가 없고 `unshift`로 맨 앞 추가가 발생하므로, 배열 인덱스 대신 **도서 객체 참조를 `Set`(`favoriteBooks`)으로 관리**한다.
4. **이미지 경로 및 폴백 처리**: 브라우저에서 `<img src>`는 `index.html` 기준으로 해석되므로 기본 이미지는 `assets/stack-of-books.png`를 사용하고, 외부 이미지 로드 실패(`error` 이벤트) 시에도 기본 이미지로 폴백한다.

---

## 4. 상태 및 UI 구조 (`js/script.js`)

### 4.1 애플리케이션 상태
- `favoriteBooks`: `Set<Book>` — 즐겨찾기 등록 도서 객체 참조 집합
- `uiState`:
  - `activeTab`: `'home' | 'create' | 'favorites'`
  - `criteria`: `'title' | 'author' | 'category'`
  - `keyword`: `string`
  - `currentPage`: `number` (기본값 `1`, `ITEMS_PER_PAGE = 12`)

### 4.2 화면 구성 및 기능 매핑
- **Navbar**: `Books`, `Home`, `Create`, `Favorites` 탭 전환
- **Home (`#home-container`)**: 검색 폼(`#search-form`), 도서 카드 그리드(`#book-list-row`), 페이지네이션(`#paging-nav`)
- **Create (`#create-container`)**: 도서 추가 폼(`#create-form`), 필수 입력 에러 출력(`#create-book-errors`)
- **Favorites (`#favorites-container`)**: 즐겨찾기 카드 목록(`#favorites-list-row`), 빈 상태 안내(`#favorites-empty-msg`, 마지막 도서 해제 시 `Home` 자동 이동)
- **Modal (`#book-details-modal`)**: 도서 상세(`제목 - 작가`, 커버 이미지, 줄거리) 동적 바인딩