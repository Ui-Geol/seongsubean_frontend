import {rootUrl, loadLayout} from '/common/common.js';

loadLayout();

document.addEventListener("DOMContentLoaded", () => {
  let page = 1;

  const loadCafes = async (page) => {
    const token = localStorage.getItem('auth');

    const res = await axios.get(rootUrl + `/api/account/myCafe?page=${page}`, {
      headers: {Authorization: `Bearer ${token}`}
    });

    const {cafes, totalCount, totalPages, currentPage} = res.data;

    document.getElementById("page-title").textContent = `내 카페 총 ${totalCount}개`;
    // 리뷰 테이블 렌더링
    const grid = document.getElementById("cafe-grid");
    grid.innerHTML = "";

    if (cafes.length === 0) {
      grid.innerHTML = "<p class='text-center'>등록 한 카페가 없습니다.</p>";
      return;
    }

    cafes.forEach(cafe => {
      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = `
        <a href="/cafe/${cafe.cafeId}" class="text-decoration-none text-dark">
          <div class="cafe-card card h-100">
            <img src="${cafe.mainImage || '/images/common/logo.png'}" class="card-img-top cafe-image" alt="카페 이미지">
            <div class="card-body cafe-info">
              <h5 class="card-title cafe-name">${cafe.cafeName}</h5>
              <p class="card-text cafe-address">${cafe.address}</p>
              <div class="cafe-rating">
                <span class="rating-score">${cafe.avgStar.toFixed(1)}</span>
                <div class="stars">
                  ${'★'.repeat(Math.floor(cafe.avgStar))}${'☆'.repeat(5 - Math.floor(cafe.avgStar))}
                </div>
                <span class="review-count">리뷰 ${cafe.reviewCount}개</span>
              </div>
            </div>
          </div>
        </a>
      `;
      grid.appendChild(col);
    });
    // 페이지네이션 렌더링
    renderPagination(currentPage, totalPages);
  };

  const renderPagination = (currentPage, totalPages) => {
    const paginationEl = document.getElementById("pagination");
    paginationEl.innerHTML = "";

    const createPageItem = (pageNum, label = null, isActive = false, isDisabled = false) => {
      const li = document.createElement("li");
      li.className = `page-item ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`;

      const a = document.createElement("a");
      a.className = "page-link";
      a.href = "#";
      a.textContent = label || pageNum;

      if (!isDisabled) {
        a.addEventListener("click", e => {
          e.preventDefault();
          loadCafes(pageNum);
        });
      }

      li.appendChild(a);
      return li;
    };


    // 이전 버튼
    paginationEl.appendChild(
        createPageItem(currentPage - 1, "«", false, currentPage === 1)
    );
    // 숫자 페이지 버튼 (최대 5개)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    // 5개가 안되면 앞/뒤를 보정
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4);
      }
    }
    // 페이지 번호
    for (let i = startPage; i <= endPage; i++) {
      paginationEl.appendChild(createPageItem(i, null, i === currentPage));
    }
    // 다음 버튼
    paginationEl.appendChild(
        createPageItem(currentPage + 1, "»", false, currentPage === totalPages)
    );
  };

  loadCafes(page);
});
