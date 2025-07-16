import { loadLayout, rootUrl } from '/common/common.js';


let currentPage = 1;
const pageSize = 7;
let totalPages = 1;
let currentPageItems = [];

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

async function fetchAndRenderList() {
  try {
    const res = await axios.get(rootUrl+`/api/reportboards/list`, {
      params: {
        page: currentPage,
        size: pageSize,
        ts: Date.now()
      },
      headers: { 'Cache-Control': 'no-store' }
    });

    const data = res.data;
    currentPageItems = data.content;
    totalPages = data.totalPages;
    currentPage = data.currentPage;

    renderReportList();
    renderPagination();
  } catch (error) {
    console.error('게시글 목록 불러오기 실패:', error);
    alert('제보글을 불러오는 중 문제가 발생했습니다.');
  }
}

document.addEventListener('DOMContentLoaded', fetchAndRenderList);
loadLayout();
// 로그인한 경우만 '새 글쓰기' 버튼 표시
const token = localStorage.getItem('auth');
if (token) {
  try {
    const res = await axios.get(rootUrl + '/api/freeboards/auth/email', {
      headers: {
        Authorization: token
      }
    });
    if (res.data.success) {
      document.getElementById('new-post-btn').style.display = 'inline-block';
    }
  } catch (err) {
    console.warn('인증 확인 실패:', err);
  }
}
function renderReportList() {
  const container = document.querySelector('.article-list');
  container.innerHTML = '';

  if (!currentPageItems || currentPageItems.length === 0) {
    container.innerHTML = '<p>등록된 제보가 없습니다.</p>';
    return;
  }

  currentPageItems.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'article-item';
    article.style.cursor = 'pointer';
    article.onclick = () => {
      window.location.href = `/board/report-detail.html?id=${item.reportBoardId}`;
    };

    const imageUrl = item.thumbnailImage?.trim()
        ? rootUrl + `${item.thumbnailImage}`
        : '/images/board/report/default.png';

    article.innerHTML = `
      <div class="article-thumbnail">
        <img src="${imageUrl}" alt="카페 이미지">
      </div>
      <div class="article-content">
        <h2 class="article-title">${escapeHtml(item.title)}</h2>
        <p class="article-description">
          ${escapeHtml(item.content).substring(0, 100)}...
        </p>
      </div>
      <div class="article-meta">
        <span class="article-author">${item.nickName || '익명제보자'}</span>
        <span class="article-date">${formatDate(item.createdDate)}</span>
      </div>
    `;
    container.appendChild(article);
  });
}

function renderPagination() {
  const pagination = document.querySelector('.pagination');
  pagination.innerHTML = '';

  pagination.appendChild(createPageLink('«', 1, currentPage === 1));
  pagination.appendChild(createPageLink('‹', currentPage - 1, currentPage === 1));

  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageLink = createPageLink(i, i, i === currentPage);
    pagination.appendChild(pageLink);
  }

  pagination.appendChild(createPageLink('›', currentPage + 1, currentPage === totalPages));
  pagination.appendChild(createPageLink('»', totalPages, currentPage === totalPages));
}

function createPageLink(text, page, disabled) {
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = text;

  if (disabled) {
    link.classList.add('disabled');
    link.style.pointerEvents = 'none';
    link.style.opacity = '0.5';
  } else if (page === currentPage) {
    link.classList.add('current');
  }

  link.addEventListener('click', (e) => {
    e.preventDefault();
    if (page !== currentPage && !disabled) {
      currentPage = page;
      fetchAndRenderList();
    }
  });

  return link;
}