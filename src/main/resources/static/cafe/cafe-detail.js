import {
  closeModal,
  initializeModal,
  isMine,
  loadLayout,
  openModal,
  rootUrl
} from '/common/common.js';

let isOpen = true;

// 전역에 데이터 저장용 변수
let cafeOverviewData = null;
let cafeMenuData = null;
let cafeReviewData = null;

let reviewPage = 1;
let currentMenuIdToDelete = null; // 삭제할 메뉴 ID 저장

// 현재 브라우저 주소의 쿼리스트링 부분을 가져옴
const params = new URLSearchParams(window.location.search);

// 특정 파라미터 값 가져오기 (예: cafeId)
const cafeId = params.get('cafeId'); // 예: '123'

async function setCafeHeader() {
  try {
    const response = await axios.get(
        rootUrl + `/api/cafe/${cafeId}/cafeHeader`);
    const {
      avgRating,
      cafeName,
      mainImage,
      roundedRating,
      totalCount
    } = response.data.cafeHeaderDTO;

    const owner = await axios.get(rootUrl + `/api/cafe/${cafeId}/cafeDTO`);

    const isOwner = await isMine(owner.data.cafeDTO.email);

    console.log(isOwner);

    if (!isOwner) {
      document.getElementById("editCafe").style.display = 'none';
      document.getElementById('deleteCafe').style.display = 'none';
    }

    const imageResponse = await axios.get(
        rootUrl + '/api/common' + mainImage,
        {responseType: 'blob'}
    );

    const imageUrl = URL.createObjectURL(imageResponse.data);

    document.querySelector(
        '#cafe-header-name').textContent = cafeName;
    setRatingContainer({score: avgRating, totalCount: totalCount})
    document.querySelector('.cafe-image').src = imageUrl;

  } catch (error) {
    console.log(error);
  }
}

function setRatingContainer({score, totalCount}) {
  // 평점 표시
  const ratingScoreEl = document.querySelector('.rating-score');
  if (ratingScoreEl) {
    ratingScoreEl.textContent = score;
  }

  // 별점 표시
  const starsEl = document.querySelector('.stars');
  if (starsEl) {
    starsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const span = document.createElement('span');
      span.className = i <= Math.round(score) ? 'star' : 'star empty';
      span.textContent = '★';
      starsEl.appendChild(span);
    }
  }

  // 리뷰 수 표시
  const reviewCountEl = document.querySelector('.review-count');
  if (reviewCountEl) {
    reviewCountEl.textContent = `(${totalCount})`;
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  // 1. 모든 데이터 한 번에 불러오기
  const [overviewRes, menuRes, reviewRes] = await Promise.all([
    axios.get(rootUrl + `/api/cafe/${cafeId}/cafeDTO`),
    axios.get(rootUrl + `/api/cafe/${cafeId}/menu`),
    axios.get(rootUrl + `/api/cafe/${cafeId}/reviews/0`)
  ]);
  cafeOverviewData = overviewRes.data.cafeDTO;
  cafeMenuData = menuRes.data.menuDTOList;
  cafeReviewData = reviewRes.data.totalReviewDTOList;

  // 2. 첫 화면: 개요 탭 보여주기
  showTab('overview');

  // 3. 탭 버튼 이벤트 등록
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.nav-tab').forEach(
          b => b.classList.remove('active'));
      this.classList.add('active');
      const tab = this.getAttribute('data-tab');
      showTab(tab);
    });
  });
});

async function showTab(tab) {
  // 모든 탭 컨텐츠 숨김
  document.querySelectorAll('.tab-content').forEach(div => {
    div.style.display = 'none';
  });

  if (tab === 'overview') {
    document.getElementById('overviewTab').style.display = 'block';
    const container = document.getElementById('cafeContent');
    if (cafeOverviewData) {
      container.innerHTML = renderOverview(cafeOverviewData);
      updateTodayHours(cafeOverviewData.operationTimes);
      renderOperationTimes(cafeOverviewData.operationTimes);
      setupOverviewEventListeners();
    } else {
      container.innerHTML = '데이터가 없습니다.';
    }
  } else if (tab === 'menu') {
    document.getElementById('menuTab').style.display = 'block';
    const container = document.getElementById('menu-list');
    if (cafeMenuData) {
      renderMenuList(cafeMenuData);
    } else {
      container.innerHTML = '데이터가 없습니다.';
    }
  } else if (tab === 'reviews') {
    reviewPage = 1;
    document.getElementById('reviewTab').style.display = 'block';
    const container = document.getElementById('review-list');
    if (cafeReviewData) {
      container.innerHTML = await renderReviewList(cafeReviewData);
      await setReviewImageBlobs();
      attachMoreButtonEvent();
    } else {
      container.innerHTML = '데이터가 없습니다.';
    }
  }
}

function renderOverview(data) {
  return `
    <div id="overview" class="tab-content active">
        <div class="info-section">
          <div class="info-item">
            <svg class="info-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clip-rule="evenodd"></path>
            </svg>
            <span class="info-text">${data.fullAddress}</span>
          </div>

          <div class="info-item">
            <svg class="info-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clip-rule="evenodd"></path>
            </svg>
            <div class="info-text">
              <div class="hours-container">
                <button class="status-badge status" id="statusBadge">영업중
                </button>
                <button class="hours-dropdown">
                  <span>08:30에 영업 시작</span>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path
                        d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 01.753 1.659l-4.796 5.48a1 1 0 01-1.506 0z"/>
                  </svg>
                </button>
                <button class="status-badge status today-closed" id="todayClosedBtn">
                오늘 휴무
                </button>

                <div class="hours-detail" id="hoursDetail">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-item">
            <svg class="info-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                  d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
            </svg>
            <span class="info-text">${data.callNumber}</span>
          </div>
        </div>

        <div class="description-section">
          <h2 class="section-title">소개</h2>
          <div class="description-box">
            <p class="description-text">${data.introduction}</p>
          </div>
        </div>
      </div>
  `;
}

function setupOverviewEventListeners() {
  // 영업상태 토글
  const statusBadge = document.getElementById('statusBadge');
  if (statusBadge) {
    statusBadge.addEventListener('click', toggleStatus);
  }

  // 시간 드롭다운 토글
  const hoursDropdown = document.querySelector('.hours-dropdown');
  if (hoursDropdown) {
    hoursDropdown.addEventListener('click', toggleHours);
  }

  // 휴무 토글
  const todayClosedBtn = document.getElementById('todayClosedBtn');
  if (todayClosedBtn) {
    todayClosedBtn.addEventListener('click', toggleTodayClosed);
  }
}

function toggleStatus() {
  const statusBadge = document.getElementById('statusBadge');
  isOpen = !isOpen;

  if (isOpen) {
    statusBadge.textContent = '영업중';
    statusBadge.classList.remove('closed');
  } else {
    statusBadge.textContent = '영업종료';
    statusBadge.classList.add('closed');
  }
}

function toggleHours() {
  const hoursDetail = document.getElementById('hoursDetail');
  hoursDetail.classList.toggle('show');
}

function toggleTodayClosed() {
  const btn = document.getElementById('todayClosedBtn');
  const isCancelled = btn.classList.toggle('cancelled');
  btn.textContent = isCancelled ? '휴무 취소' : '오늘 휴무';
}

// 현재 요일과 시간에 맞게 영업상태를 업데이트하는 함수
function updateTodayHours(operationTimes) {
  // operationTimes가 정의되지 않은 경우 함수 종료
  if (typeof operationTimes === 'undefined' || !operationTimes) {
    console.error('operationTimes 데이터가 정의되지 않았습니다.');
    return;
  }

  const today = new Date().getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  // operationTimes 배열에서 오늘 요일에 해당하는 시간을 찾기
  const todaySchedule = operationTimes.find(time =>
      time.weekday === weekdays[today]
  );

  // HTML 요소들 가져오기
  const todayHoursSpan = document.querySelector('.hours-dropdown span');
  const statusBadge = document.getElementById('statusBadge');
  const todayClosedBtn = document.getElementById('todayClosedBtn');

  if (todaySchedule && todaySchedule.openTime && todaySchedule.closeTime) {
    // 시간에서 초 제거 (HH:MM:SS -> HH:MM)
    const formatTime = (time) => {
      if (time.includes(':')) {
        const parts = time.split(':');
        return `${parts[0]}:${parts[1]}`; // HH:MM만 반환
      }
      return time;
    };

    const openTime = formatTime(todaySchedule.openTime);
    const closeTime = formatTime(todaySchedule.closeTime);

    // 오늘의 영업시간으로 텍스트 업데이트 (전체 시간 표시)
    todayHoursSpan.textContent = `${openTime} - ${closeTime}`;

    // 현재 시간과 비교하여 영업중/영업종료 상태 업데이트
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM 형식

    // 시간을 숫자로 변환 (HH:MM -> HHMM)
    const parseTimeToNumber = (timeStr) => {
      const cleanTime = timeStr.replace(':', '');
      return parseInt(cleanTime);
    };

    const openTimeNum = parseTimeToNumber(openTime);
    const closeTimeNum = parseTimeToNumber(closeTime);

    if (currentTime >= openTimeNum && currentTime < closeTimeNum) {
      // 영업중인 경우
      statusBadge.textContent = '영업중';
      statusBadge.classList.remove('closed');
      statusBadge.style.display = 'inline-block';
      todayClosedBtn.style.display = 'none';
      isOpen = true;
    } else {
      // 영업 종료 (영업 시작 전이거나 영업 종료 후)
      statusBadge.textContent = '영업종료';
      statusBadge.classList.add('closed');
      statusBadge.style.display = 'inline-block';
      todayClosedBtn.style.display = 'none';
      isOpen = false;
    }
  } else {
    // 오늘 휴무인 경우
    todayHoursSpan.textContent = '오늘 휴무';
    statusBadge.style.display = 'none';
    todayClosedBtn.style.display = 'inline-block';
    isOpen = false;
  }
}

// Close hours dropdown when clicking outside
document.addEventListener('click', function (event) {
  const hoursContainer = document.querySelector('.hours-container');
  const hoursDetail = document.getElementById('hoursDetail');

  if (!hoursContainer.contains(event.target)) {
    hoursDetail.classList.remove('show');
  }
});

function formatPrice(price) {
  return price.toLocaleString('ko-kr') + "원";
}

// renderMenuList 함수에서 메뉴 수정/삭제 버튼 부분 수정
async function renderMenuList(menuInfoList) {
  const menuListEl = document.getElementById('menu-list');
  menuListEl.innerHTML = ''; // 기존 내용 제거

  const owner = await axios.get(rootUrl + `/api/cafe/${cafeId}/cafeDTO`);
  const isOwner = await isMine(owner.data.cafeDTO.email);

  // 메뉴 추가 헤더 표시/숨김
  if (!isOwner) {
    document.getElementById("addMenuHeader").style.display = 'none';
  } else {
    // ✅ 메뉴 추가 버튼에 add-menu.html로 이동하는 이벤트 추가
    const addMenuBtn = document.getElementById('addMenuBtn');
    if (addMenuBtn) {
      addMenuBtn.addEventListener('click', () => {
        window.location.href = `/cafe/add-menu.html?cafeId=${cafeId}`;
      });
    }
  }

  for (const menu of menuInfoList) {
    // 이미지가 없으면 기본 이미지 사용
    const imageSrc = menu.image ? menu.image : '/images/common/default.png';

    // 메뉴 설명이 있으면 추가
    const descriptionHtml = (menu.description && menu.description.trim() !== "")
        ? `<div class="menu-description">${menu.description}</div>`
        : '';

    // ✅ 소유자일 때만 편집/삭제 버튼 표시 (삭제 버튼을 모달로 변경)
    const menuActionsHtml = isOwner ? `
      <div class="menu-actions">
        <button class="edit-btn" data-menu-id="${menu.menuId}" title="메뉴수정" type="button">✏️</button>
        <button class="delete-btn" data-menu-id="${menu.menuId}" title="메뉴삭제" type="button">🗑️</button>
      </div>
    ` : '';

    // 메뉴 아이템 HTML 생성
    const menuItemHtml = `
      <div class="menu-item">
        <div class="menu-info">
          <div class="menu-header">
            <div class="menu-name">${menu.menuName}</div>
            ${menuActionsHtml}
          </div>
          ${descriptionHtml}
          <div class="menu-price">${formatPrice(menu.price)}</div>
        </div>
        <img class="menu-image" alt="${menu.menuName}"/>
      </div>
    `;

    // DOM에 추가
    menuListEl.insertAdjacentHTML('beforeend', menuItemHtml);

    // 새로 추가된 마지막 menu-item의 img 요소 선택
    const menuItemEl = menuListEl.lastElementChild;
    const imgEl = menuItemEl.querySelector('.menu-image');

    try {
      // 이미지 blob 받아오기
      const imageResponse = await axios.get(
          rootUrl + '/api/common' + imageSrc,
          {responseType: 'blob'}
      );
      const imageUrl = URL.createObjectURL(imageResponse.data);
      imgEl.src = imageUrl;
    } catch (e) {
      // 이미지 로드 실패 시 기본 이미지 사용
      imgEl.src = '/images/cafe/menuDefault.png';
    }
  }

  // ✅ 메뉴 수정/삭제 버튼들에 이벤트 리스너 추가
  if (isOwner) {
    // 수정 버튼 이벤트
    const editButtons = menuListEl.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const menuId = button.getAttribute('data-menu-id');
        // cafeId와 menuId를 쿼리 파라미터로 전달하여 add-menu.html로 이동
        window.location.href = `/cafe/add-menu.html?cafeId=${cafeId}&menuId=${menuId}`;
      });
    });

    // 삭제 버튼 이벤트
    const deleteButtons = menuListEl.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const menuId = button.getAttribute('data-menu-id');
        currentMenuIdToDelete = menuId;
        // 메뉴 삭제 모달 열기
        openModal('/cafe/menu-delete-modal.html');
      });
    });
  }
}

function renderOperationTimes(operationTimes) {
  const container = document.getElementById('hoursDetail');
  container.innerHTML = ''; // 기존 내용 초기화

  operationTimes.forEach(time => {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'hours-day';

    const weekdaySpan = document.createElement('span');
    weekdaySpan.textContent = time.weekday;

    const timeSpan = document.createElement('span');
    timeSpan.textContent = `${time.openTime} - ${time.closeTime}`;

    dayDiv.appendChild(weekdaySpan);
    dayDiv.appendChild(timeSpan);

    container.appendChild(dayDiv);
  });
}

async function renderReviewList(totalReviewDTOList) {
  function renderStars(score) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="star${i <= score ? '' : ' empty'}">★</span>`;
    }
    return stars;
  }

  function formatDate(isoString) {
    return isoString ? isoString.slice(0, 10) : '';
  }

  return totalReviewDTOList.map(review => {
        // 프로필 이미지
        const userImg = review.userImage
            ? (review.userImage.startsWith('/api/common')
                ? '/images/common/loading.gif' // 로딩 이미지
                : review.userImage)
            : '/images/cafe/SampleProfile.png';
        const userImgDataSrc = review.userImage && review.userImage.startsWith(
            '/api/common')
            ? `data-src="${review.userImage}"`
            : '';

        // 리뷰 이미지들
        let reviewImagesHtml = '';
        if (Array.isArray(review.reviewImage) && review.reviewImage.length > 0) {
          reviewImagesHtml =
              `<div class="review-images">` +
              review.reviewImage.map(img =>
                  img.image && img.image.startsWith('/images/cafe')
                      ? `<img class="review-image" src="/images/common/loading.gif" data-src="${img.image}" alt="${img.reviewImageId}">`
                      : `<img class="review-image" src="/images/cafe/menuDefault.png" alt="${img.reviewImageId}">`
              ).join('') +
              `</div>`;
        }

        return `
      <div class="review-item">
        <a class="review-delete-btn"
           href="/cafe-detail?deleteReviewId=${review.reviewDTO.reviewId}"
           alt="리뷰삭제">🗑️</a>
        <div class="review-header">
          <img class="reviewer-avatar"
               src="${userImg}" ${userImgDataSrc}
               alt="${review.userNickname}">
          <div class="reviewer-info">
            <div class="reviewer-name">${review.userNickname}</div>
            <div class="review-rating">
              ${renderStars(review.reviewDTO.starScore)}
            </div>
          </div>
          <div class="review-date">
            ${formatDate(review.reviewDTO.reviewDate)}
          </div>
        </div>
        <div class="review-text">${review.reviewDTO.reviewContents}</div>
        ${reviewImagesHtml}
      </div>
    `;
      }).join('') +
      `<button class="more-button">더보기</button>`;
}

async function setReviewImageBlobs() {
  const images = document.querySelectorAll('.review-image, .reviewer-avatar');
  for (const img of images) {
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc && dataSrc.startsWith('/images')) {
      try {
        const response = await axios.get(rootUrl + dataSrc,
            {responseType: 'blob'});
        const blobUrl = URL.createObjectURL(response.data);
        img.src = blobUrl;
        img.removeAttribute('data-src');
      } catch (e) {
        // 실패 시 대체 이미지로 교체
        img.src = '/images/cafe/SampleProfile.png';
      }
    }
  }
}

// 더보기 버튼 이벤트 등록 함수
function attachMoreButtonEvent() {
  const moreButton = document.querySelector('.more-button');
  if (moreButton && !moreButton.hasAttribute('data-event-added')) {
    moreButton.setAttribute('data-event-added', 'true');
    moreButton.addEventListener('click', handleMoreButtonClick);
  }
}

// 더보기 버튼 클릭 핸들러
async function handleMoreButtonClick(e) {
  const button = e.target;
  try {
    const response = await axios.get(
        rootUrl + `/api/cafe/${cafeId}/reviews/` + reviewPage);
    const reviewData = response.data;

    // 기존 더보기 버튼 제거
    button.remove();
    console.log("더보기 버튼 실행");

    // 새 리뷰 추가 (더보기 버튼 제외)
    const container = document.getElementById('review-list');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderReviewList(reviewData.totalReviewDTOList);
    const newButton = tempDiv.querySelector('.more-button');
    if (newButton) {
      newButton.remove();
    }

    container.insertAdjacentHTML('beforeend', tempDiv.innerHTML);

    // 새 더보기 버튼 추가 및 이벤트 재등록
    container.insertAdjacentHTML('beforeend',
        '<button class="more-button">더보기</button>');
    attachMoreButtonEvent(); // 재귀 호출

    await setReviewImageBlobs();
    reviewPage++;

  } catch (error) {
    console.error('리뷰 더보기 실패:', error);
  }
}

// 삭제 버튼 이벤트 설정
function setupDeleteButton() {
  const deleteButton = document.getElementById('deleteCafe');

  if (deleteButton) {
    deleteButton.addEventListener('click', function () {
      // 카페 삭제 모달 열기
      openModal('/cafe/cafe-delete-modal.html');
    });
  } else {
    console.warn('삭제 버튼을 찾을 수 없습니다.');
  }
}

// 수정 버튼 이벤트 설정
function setupEditButton() {
  const editButton = document.getElementById('editCafe');

  editButton.addEventListener('click', function () {
    location.href = `/cafe/cafe-registration.html?cafeId=` + cafeId;
  });

}

function setupModalEventHandlers() {
  // 모달 확인 버튼 클릭 시 처리
  document.addEventListener('modalConfirm', function (event) {
    const {buttonType} = event.detail;

    console.log('모달 확인 버튼 클릭됨:', buttonType);

    // 더 구체적인 클래스를 먼저 체크
    if (buttonType.includes('menu-delete-btn')) {
      console.log('메뉴 삭제 실행');
      handleMenuDelete();
    } else if (buttonType.includes('cafe-delete-btn')) {
      console.log('카페 삭제 실행');
      handleCafeDelete();
    } else if (buttonType.includes('delete-btn')) {
      console.log('일반 삭제 버튼 - 카페 삭제로 처리');
      handleCafeDelete();
    } else {
      console.warn('알 수 없는 버튼 타입:', buttonType);
    }
  });
}

// 카페 삭제 처리
async function handleCafeDelete() {
  try {
    // 로딩 표시 (선택사항)
    showLoadingInModal();

    const response = await axios.delete(rootUrl + `/api/cafe/` + cafeId);
    console.log(cafeId);

    if (response.status === 204) {
      // 목록 페이지로 이동
      window.location.href = '/';
    } else {
      throw new Error('삭제 요청이 실패했습니다.');
    }

  } catch (error) {
    console.error('카페 삭제 실패:', error);

    // 에러 메시지 표시
    alert('카페 삭제 중 오류가 발생했습니다.\n다시 시도해주세요.');

  } finally {
    closeModal();
  }
}

// 메뉴 삭제 처리
async function handleMenuDelete() {
  if (!currentMenuIdToDelete) {
    console.error('삭제할 메뉴 ID가 없습니다.');
    return;
  }

  try {
    // 로딩 표시
    showLoadingInModal();

    const response = await axios.delete(
        rootUrl + `/api/cafe/${cafeId}/menu/${currentMenuIdToDelete}`);
    console.log('메뉴 삭제 ID:', currentMenuIdToDelete);

    if (response.status === 204) {
      // 메뉴 목록 다시 로드하여 실시간 업데이트
      const menuRes = await axios.get(rootUrl + `/api/cafe/${cafeId}/menu`);
      cafeMenuData = menuRes.data.menuDTOList;

      // 메뉴 탭이 현재 활성화되어 있다면 다시 렌더링
      const menuTab = document.getElementById('menuTab');
      if (menuTab && menuTab.style.display !== 'none') {
        renderMenuList(cafeMenuData);
      }

      closeModal();
      alert('메뉴가 성공적으로 삭제되었습니다.');
    } else {
      throw new Error('메뉴 삭제 요청이 실패했습니다.');
    }

  } catch (error) {
    console.error('메뉴 삭제 실패:', error);

    let errorMessage = '메뉴 삭제 중 오류가 발생했습니다.';
    if (error.response) {
      errorMessage = error.response.data.message ||
          error.response.data.error ||
          `HTTP ${error.response.status} 에러가 발생했습니다.`;
    }

    alert(errorMessage);
    closeModal();

  } finally {
    currentMenuIdToDelete = null; // 초기화
  }
}

// 모달에 로딩 표시 (선택사항)
function showLoadingInModal() {
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    modalContainer.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <div style="margin-bottom: 20px;">⏳</div>
                <p>삭제하는 중...</p>
            </div>
        `;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();

  setCafeHeader();

  await initializeModal();

  setupModalEventHandlers();
});