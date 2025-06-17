import common from '/common/common.js';
import { loadLayout } from '/common/common.js';

let currentPage = 1;
const pageSize = 12;
let searchKeyword = null;
let searchType = null;

document.addEventListener("DOMContentLoaded", () => {
    loadLayout(); // ✅ header/footer 삽입
    const searchBtn = document.querySelector("#searchButton");
    const dropdownBtn = document.querySelector(".dropdown-toggle");
    const searchInput = document.querySelector("#searchInput");

    document.querySelector(".dropdown-menu").addEventListener("click", (e) => {
        if (e.target.classList.contains("dropdown-item")) {
            const selected = e.target.textContent.trim();
            dropdownBtn.textContent = selected;
            switch (selected) {
                case "제목": searchType = "title"; break;
                case "본문": searchType = "content"; break;
                case "작성자": searchType = "writer"; break;
                case "제목 + 본문": searchType = "title_content"; break;
                default: searchType = "title_content";
            }
        }
    });

    searchBtn.addEventListener("click", () => {
        const keyword = searchInput.value.trim();
        if (!keyword) {
            alert("검색어를 입력해주세요.");
            return;
        }
        searchKeyword = keyword;
        currentPage = 1;
        fetchPosts(currentPage);
    });

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            searchBtn.click();
        }
    });

    fetchPosts(currentPage);
});

async function fetchPosts(page) {
    let url = `/api/freeboards/list?page=${page}&size=${pageSize}`;
    if (searchKeyword && searchType) {
        url = `/api/freeboards/search?page=${page}&size=${pageSize}&type=${searchType}&keyword=${encodeURIComponent(searchKeyword)}`;
    }

    try {
        const res = await common.get(url);
        const data = res.data;
        const row = document.getElementById("card-row");
        row.innerHTML = "";

        const posts = data.content || data;
        if (!posts || posts.length === 0) {
            row.innerHTML = `<div class="col-12 text-center mt-4"><p class="text-muted">검색 결과가 없습니다.</p></div>`;
            document.querySelector(".pagination").innerHTML = "";
            return;
        }

        // ✅ 모든 이미지 요청을 병렬로 처리
        const imageUrls = await Promise.all(posts.map(async (item) => {
            if (!item.thumbnailImage) {
                return '/images/board/free/default.png';
            }

            const imagePath = `http://127.0.0.1:8881/api/common${item.thumbnailImage}`;
            try {
                const imageRes = await axios.get(imagePath, { responseType: 'blob' });
                return URL.createObjectURL(imageRes.data);
            } catch (e) {
                console.warn(`이미지 불러오기 실패: ${item.thumbnailImage}`, e);
                return '/images/board/free/default.png';
            }
        }));

        // ✅ 이미지 URL과 함께 카드 렌더링
        posts.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "col-md-4";

            const authorName = item.nickName || '익명';
            const imageUrl = imageUrls[index];

            card.innerHTML = `
                <div class="card" style="cursor: pointer;" onclick="location.href='/board/free-detail.html?id=${item.freeBoardId}'">
                  <img src="${imageUrl}" class="card-img-top" alt="게시글 이미지">
                  <div class="card-body px-0">
                    <h5 class="card-title">${item.title}</h5>
                    <div class="d-flex justify-content-between">
                      <span class="card-text">${authorName}</span>
                      <span class="card-text">${formatDate(item.createdDate)}</span>
                    </div>
                  </div>
                </div>
            `;
            row.appendChild(card);
        });

        const totalPages = data.totalPages || 1;
        renderPagination(totalPages, page);

    } catch (err) {
        console.error("불러오기 실패", err);
        alert("데이터를 불러오지 못했습니다.");
    }
}

function renderPagination(totalPages, currentPageLocal) {
    const pagination = document.querySelector(".pagination");
    pagination.innerHTML = '';
    const createPageItem = (page, label, disabled = false, active = false) => {
        const li = document.createElement("li");
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.textContent = label;
        a.addEventListener("click", (e) => {
            e.preventDefault();
            if (!disabled && page !== currentPageLocal) {
                currentPage = page;
                fetchPosts(currentPage);
            }
        });
        li.appendChild(a);
        return li;
    };
    pagination.appendChild(createPageItem(currentPageLocal - 1, '«', currentPageLocal === 1));
    for (let i = 1; i <= totalPages; i++) {
        pagination.appendChild(createPageItem(i, i, false, i === currentPageLocal));
    }
    pagination.appendChild(createPageItem(currentPageLocal + 1, '»', currentPageLocal === totalPages));
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
}
