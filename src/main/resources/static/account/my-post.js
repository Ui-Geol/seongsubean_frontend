import {rootUrl, loadLayout} from '/common/common.js';

loadLayout();

document.addEventListener("DOMContentLoaded", () => {
  let page = 1;

  const loadPosts = async (page) => {
    const token = localStorage.getItem('auth');

    const res = await axios.get(`${rootUrl}/api/account/myPost?page=${page}`, {
      headers: {Authorization: `Bearer ${token}`}
    });

    const {posts, currentPage, totalPages, totalCount} = res.data;
    // 제목 업데이트
    document.getElementById("page-title").textContent = `내가 쓴 글 총 ${totalCount}개`;

    // 테이블 렌더링
    const tbody = document.getElementById("post-table-body");
    tbody.innerHTML = "";

    if (posts.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `<td colspan="3">작성한 게시글이 없습니다.</td>`;
      tbody.appendChild(emptyRow);
      return;
    }

    posts.forEach(post => {
      const row = document.createElement("tr");
      const link = post.boardType === '자유'
          ? `/free/detail?id=${post.boardId}`
          : `/report/detail?id=${post.boardId}`;

      row.innerHTML = `
          <td>${post.boardType}</td>
          <td><a class="post-title" href="${link}">${post.title}</a></td>
          <td>${new Date(post.created_date).toISOString().slice(0, 10).replace(
          /-/g, '. ')}</td>
        `;
      tbody.appendChild(row);
    });

    renderPagination(currentPage, totalPages);
  };

  const renderPagination = (currentPage, totalPages) => {
    const paginationEl = document.getElementById("pagination");
    paginationEl.innerHTML = "";

    const createPageItem = (pageNum, label = null, isActive = false,
        isDisabled = false) => {
      const li = document.createElement("li");
      li.className = `page-item ${isActive ? "active" : ""} ${isDisabled
          ? "disabled" : ""}`;

      const a = document.createElement("a");
      a.className = "page-link";
      a.href = "#";
      a.textContent = label || pageNum;

      if (!isDisabled) {
        a.addEventListener("click", e => {
          e.preventDefault();
          loadPosts(pageNum);
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

  loadPosts(page);
});
