import {rootUrl, loadLayout} from '/common/common.js';

loadLayout();

document.addEventListener("DOMContentLoaded", () => {
  let page = 1;

  const loadReviews = async (page) => {
    const token = localStorage.getItem('auth');

    const res = await axios.get(rootUrl + `/api/account/myReview?page=${page}`, {
      headers: {Authorization: `Bearer ${token}`}
    });

    const {posts, totalCount, totalPages, currentPage} = res.data;

    document.getElementById("review-title").textContent = `내가 쓴 리뷰 총 ${totalCount}개`;
    // 리뷰 테이블 렌더링
    const tbody = document.getElementById("review-table-body");
    tbody.innerHTML = "";

    if (posts.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `<td colspan="3">작성한 리뷰가 없습니다.</td>`;
      tbody.appendChild(emptyRow);
      return;
    }

    posts.forEach(post => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${post.cafeName}</td>
          <td><a href="/cafe/${post.cafeId}">${post.content}</a></td>
          <td>${new Date(post.createdDate).toISOString().slice(0, 10).replace(
          /-/g, '. ')}</td>
        `;
      tbody.appendChild(row);
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
          loadReviews(pageNum);
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

  loadReviews(page);
});
