/**
 * 제공 코드
 */
// 기본 작가, 분류, 도서 데이터 (JavaScript Array)
const categories = categoryRawData;
const authors = authorRawData;
const books = bookRawData;

/**
 * 애플리케이션 상태 및 상수
 */
const DEFAULT_COVER_IMAGE = "assets/stack-of-books.png";
const ITEMS_PER_PAGE = 12;
const favoriteBooks = new Set();

const uiState = {
  activeTab: "home", // 'home' | 'create' | 'favorites'
  criteria: "title", // 'title' | 'author' | 'category'
  keyword: "",
  currentPage: 1,
};

/**
 * DOM 요소 참조
 */
const brandNav = document.querySelector("#brand-nav");
const homeNav = document.querySelector("#home-nav");
const createNav = document.querySelector("#create-nav");
const favoritesNav = document.querySelector("#favorites-nav");

const homeContainer = document.querySelector("#home-container");
const createContainer = document.querySelector("#create-container");
const favoritesContainer = document.querySelector("#favorites-container");

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const searchResetBtn = document.querySelector("#search-reset-btn");
const bookListRow = document.querySelector("#book-list-row");
const pagingNav = document.querySelector("#paging-nav");
const paginationList = pagingNav.querySelector(".pagination");

const createForm = document.querySelector("#create-form");
const titleInput = document.querySelector("#title-input");
const authorInput = document.querySelector("#author-input");
const imgInput = document.querySelector("#img-input");
const descInput = document.querySelector("#desc-input");
const categoryInput = document.querySelector("#category-input");
const createBookErrors = document.querySelector("#create-book-errors");

const favoritesListRow = document.querySelector("#favorites-list-row");
const favoritesEmptyMsg = document.querySelector("#favorites-empty-msg");

const modalEl = document.querySelector("#book-details-modal");
const modalBookTitle = document.querySelector("#modal-book-title");
const modalBookCover = document.querySelector("#modal-book-cover");
const modalBookDescription = document.querySelector("#modal-book-description");
const bookDetailsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

/**
 * 유틸리티 함수
 */
function getAuthorName(authorId) {
  const found = authors.find((author) => author.id === authorId);
  return found ? found.name : "작가 미상";
}

function getCategoryName(categoryId) {
  const found = categories.find((category) => category.id === categoryId);
  return found ? found.name : "분류 없음";
}

function getCoverSrc(coverUrl) {
  if (typeof coverUrl === "string" && coverUrl.trim() !== "") {
    return coverUrl.trim();
  }
  return DEFAULT_COVER_IMAGE;
}

function getNextId(items) {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
}

function getFilteredBooks() {
  const keyword = uiState.keyword.trim().toLowerCase();
  if (keyword === "") {
    return books;
  }

  return books.filter((book) => {
    if (uiState.criteria === "title") {
      return book.title.toLowerCase().includes(keyword);
    }
    if (uiState.criteria === "author") {
      return getAuthorName(book.authorId).toLowerCase().includes(keyword);
    }
    if (uiState.criteria === "category") {
      return getCategoryName(book.categoryId).toLowerCase().includes(keyword);
    }
    return false;
  });
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const pages = new Set([1, totalPages]);
  for (let p = currentPage - 2; p <= currentPage + 2; p += 1) {
    if (p >= 1 && p <= totalPages) {
      pages.add(p);
    }
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("...");
    }
    result.push(sorted[i]);
  }
  return result;
}

/**
 * 모달 제어 (F906)
 */
function openBookDetailsModal(book) {
  const authorName = getAuthorName(book.authorId);
  modalBookTitle.textContent = `${book.title} - ${authorName}`;
  modalBookCover.dataset.fallbackApplied = "";
  modalBookCover.src = getCoverSrc(book.cover);
  modalBookCover.alt = book.title;
  modalBookDescription.textContent =
    typeof book.description === "string" && book.description.trim() !== ""
      ? book.description
      : "소개 내용이 없습니다.";

  bookDetailsModal.show();
}

/**
 * DOM 생성 및 렌더링
 */
function createBookCard(book) {
  const col = document.createElement("div");
  col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

  const card = document.createElement("div");
  card.className = "card h-100";

  const img = document.createElement("img");
  img.className = "card-img-top object-fit-contain bg-light";
  img.style.height = "280px";
  img.src = getCoverSrc(book.cover);
  img.alt = book.title;
  img.addEventListener("error", () => {
    if (!img.dataset.fallbackApplied) {
      img.dataset.fallbackApplied = "true";
      img.src = DEFAULT_COVER_IMAGE;
    }
  });

  const cardBody = document.createElement("div");
  cardBody.className = "card-body d-flex flex-column justify-content-between";

  const titleEl = document.createElement("h6");
  titleEl.className = "card-title mb-3";
  titleEl.textContent = book.title;

  const btnGroup = document.createElement("div");
  btnGroup.className = "d-flex gap-2";

  const isFavorite = favoriteBooks.has(book);
  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = isFavorite
    ? "btn btn-sm btn-danger"
    : "btn btn-sm btn-primary";
  favBtn.textContent = isFavorite ? "취소" : "즐겨찾기";
  favBtn.addEventListener("click", () => {
    toggleFavorite(book);
  });

  const detailBtn = document.createElement("button");
  detailBtn.type = "button";
  detailBtn.className = "btn btn-sm btn-outline-secondary";
  detailBtn.textContent = "상세보기";
  detailBtn.addEventListener("click", () => {
    openBookDetailsModal(book);
  });

  btnGroup.append(favBtn, detailBtn);
  cardBody.append(titleEl, btnGroup);
  card.append(img, cardBody);
  col.append(card);

  return col;
}

function renderBookGrid(targetRow, targetBooks, emptyMessage) {
  targetRow.innerHTML = "";

  if (targetBooks.length === 0) {
    if (emptyMessage) {
      const emptyCol = document.createElement("div");
      emptyCol.className = "col-12";
      const msg = document.createElement("p");
      msg.className = "text-muted my-3";
      msg.textContent = emptyMessage;
      emptyCol.append(msg);
      targetRow.append(emptyCol);
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  targetBooks.forEach((book) => {
    fragment.append(createBookCard(book));
  });
  targetRow.append(fragment);
}

function createPageItem(
  label,
  { active = false, disabled = false, onClick = null } = {},
) {
  const li = document.createElement("li");
  li.className = "page-item";
  if (active) li.classList.add("active");
  if (disabled) li.classList.add("disabled");

  if (disabled || !onClick) {
    const span = document.createElement("span");
    span.className = "page-link";
    span.textContent = label;
    li.append(span);
    return li;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "page-link";
  button.textContent = label;
  button.addEventListener("click", onClick);
  li.append(button);
  return li;
}

function renderPagination(totalItems) {
  paginationList.innerHTML = "";

  if (uiState.keyword.trim() !== "" || totalItems < ITEMS_PER_PAGE) {
    pagingNav.classList.add("d-none");
    return;
  }

  pagingNav.classList.remove("d-none");
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentPage = uiState.currentPage;

  const fragment = document.createDocumentFragment();

  // 이전 버튼
  fragment.append(
    createPageItem("이전", {
      disabled: currentPage <= 1,
      onClick:
        currentPage > 1
          ? () => {
              goToPage(currentPage - 1);
            }
          : null,
    }),
  );

  // 페이지 번호
  const pageItems = getPaginationItems(currentPage, totalPages);
  pageItems.forEach((item) => {
    if (item === "...") {
      fragment.append(createPageItem("...", { disabled: true }));
      return;
    }

    fragment.append(
      createPageItem(String(item), {
        active: item === currentPage,
        onClick:
          item !== currentPage
            ? () => {
                goToPage(item);
              }
            : null,
      }),
    );
  });

  // 다음 버튼
  fragment.append(
    createPageItem("다음", {
      disabled: currentPage >= totalPages,
      onClick:
        currentPage < totalPages
          ? () => {
              goToPage(currentPage + 1);
            }
          : null,
    }),
  );

  paginationList.append(fragment);
}

function goToPage(page) {
  uiState.currentPage = page;
  renderHomeBooks();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHomeBooks() {
  const filteredBooks = getFilteredBooks();
  const isFullListPaginated =
    uiState.keyword.trim() === "" && filteredBooks.length >= ITEMS_PER_PAGE;

  if (isFullListPaginated) {
    const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
    if (uiState.currentPage > totalPages) uiState.currentPage = totalPages;
    if (uiState.currentPage < 1) uiState.currentPage = 1;

    const startIdx = (uiState.currentPage - 1) * ITEMS_PER_PAGE;
    const pageBooks = filteredBooks.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    renderBookGrid(bookListRow, pageBooks, "등록된 도서가 없습니다.");
    renderPagination(filteredBooks.length);
    return;
  }

  renderBookGrid(bookListRow, filteredBooks, "검색 결과가 없습니다.");
  renderPagination(0);
}

function renderFavorites() {
  const favList = Array.from(favoriteBooks);
  if (favList.length === 0) {
    favoritesListRow.innerHTML = "";
    favoritesEmptyMsg.classList.remove("d-none");
    return;
  }

  favoritesEmptyMsg.classList.add("d-none");
  renderBookGrid(favoritesListRow, favList, "");
}

/**
 * 탭 전환 & 사용자 동작
 */
function switchTab(tabName) {
  uiState.activeTab = tabName;

  homeContainer.classList.toggle("d-none", tabName !== "home");
  createContainer.classList.toggle("d-none", tabName !== "create");
  favoritesContainer.classList.toggle("d-none", tabName !== "favorites");

  homeNav.classList.toggle("active", tabName === "home");
  createNav.classList.toggle("active", tabName === "create");
  favoritesNav.classList.toggle("active", tabName === "favorites");

  if (tabName === "home") {
    renderHomeBooks();
  } else if (tabName === "favorites") {
    renderFavorites();
  }
}

function toggleFavorite(book) {
  if (favoriteBooks.has(book)) {
    favoriteBooks.delete(book);
  } else {
    favoriteBooks.add(book);
  }

  if (uiState.activeTab === "favorites" && favoriteBooks.size === 0) {
    switchTab("home");
    return;
  }

  if (uiState.activeTab === "home") {
    renderHomeBooks();
  } else if (uiState.activeTab === "favorites") {
    renderFavorites();
  }
}

function resetSearch() {
  uiState.criteria = "title";
  uiState.keyword = "";
  uiState.currentPage = 1;
  searchInput.value = "";
  const titleRadio = document.querySelector("#criteria-title");
  if (titleRadio) {
    titleRadio.checked = true;
  }
  renderHomeBooks();
}

/**
 * 이벤트 리스너 등록
 */
modalBookCover.addEventListener("error", () => {
  if (!modalBookCover.dataset.fallbackApplied) {
    modalBookCover.dataset.fallbackApplied = "true";
    modalBookCover.src = DEFAULT_COVER_IMAGE;
  }
});

brandNav.addEventListener("click", (event) => {
  event.preventDefault();
  switchTab("home");
});

homeNav.addEventListener("click", () => {
  switchTab("home");
});

createNav.addEventListener("click", () => {
  switchTab("create");
});

favoritesNav.addEventListener("click", () => {
  switchTab("favorites");
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const keyword = searchInput.value.trim();
  if (keyword === "") {
    alert("검색어를 입력하세요.");
    return;
  }

  const checkedCriteria = document.querySelector(
    'input[name="search-criteria"]:checked',
  );
  uiState.criteria = checkedCriteria ? checkedCriteria.value : "title";
  uiState.keyword = keyword;
  uiState.currentPage = 1;
  renderHomeBooks();
});

searchResetBtn.addEventListener("click", () => {
  resetSearch();
});

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createBookErrors.innerHTML = "";

  const title = titleInput.value.trim();
  const authorName = authorInput.value.trim();
  const rawImgUrl = imgInput.value.trim();
  const description = descInput.value.trim();
  const categoryName = categoryInput.value.trim();

  const errors = [];
  if (title === "") errors.push("제목을 입력하세요.");
  if (authorName === "") errors.push("작가를 입력하세요.");
  if (description === "") errors.push("소개를 입력하세요.");
  if (categoryName === "") errors.push("분류를 입력하세요.");

  if (errors.length > 0) {
    errors.forEach((message) => {
      const li = document.createElement("li");
      li.className = "text-danger mb-1";
      li.textContent = message;
      createBookErrors.append(li);
    });
    return;
  }

  const cover = rawImgUrl.startsWith("http") ? rawImgUrl : "";

  let author = authors.find((item) => item.name === authorName);
  if (!author) {
    author = { id: getNextId(authors), name: authorName };
    authors.push(author);
  }

  let category = categories.find((item) => item.name === categoryName);
  if (!category) {
    category = { id: getNextId(categories), name: categoryName };
    categories.push(category);
  }

  const newBook = {
    title,
    description,
    cover,
    authorId: author.id,
    categoryId: category.id,
  };

  books.unshift(newBook);
  createForm.reset();
  resetSearch();
  switchTab("home");
});

/**
 * 초기 렌더링
 */
renderHomeBooks();
