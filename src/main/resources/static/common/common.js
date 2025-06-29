import {updateAuthDisplay} from '/common/header.js';

const rootUrl = 'http://127.0.0.1:8881';

const common = axios.create({
  baseURL: rootUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function loadLayout() {
  await checkToken();
  // Header와 Footer를 순차적으로 로드
  await loadFragment('header-container', '/common/header.html');
  await loadFragment('footer-container', '/common/footer.html');

  // HTML 로드 완료 후 인증 상태 업데이트
  updateAuthDisplay();

  // 로그아웃 버튼 이벤트 리스너 추가
  document.getElementById('btn-logout').addEventListener('click', () => {
    console.log('토큰 삭제')
    localStorage.removeItem('auth');
  });
}

async function loadFragment(containerId, filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`${filePath} 파일을 불러올 수 없습니다.`);
    }
    const html = await response.text();
    document.getElementById(containerId).innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

async function checkToken() {
  const token = localStorage.getItem('auth');
  // POST 요청
  if (token == 'null') {
    return;
  }

  axios.post(rootUrl + '/api/jwt/validate-token', {}, {
    headers: {
      'Authorization': `${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.data === '만료') {
      localStorage.removeItem('auth');
    }
  }).catch(error => {
    console.log(error);
  });

}

async function isMine(email) {
  const token = localStorage.getItem('auth');
  if (token == null) {
    return false;
  }
  try {
    const response = await axios.get(rootUrl + '/api/account/getEmail', {
      headers: {'Authorization': `${token}`}
    });
    return response.data === email;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function initializeModal() {
  // 이미 모달이 존재하는지 확인
  if (document.getElementById('modalOverlay')) {
    return;
  }

  try {
    // modal.html 파일 로드
    const htmlResponse = await fetch('/common/modal.html');
    if (!htmlResponse.ok) {
      throw new Error('modal.html 파일을 불러올 수 없습니다.');
    }
    const modalHTML = await htmlResponse.text();

    // footer 위에 모달 추가
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      footerContainer.insertAdjacentHTML('beforebegin', modalHTML);
    } else {
      // footer가 없으면 body 끝에 추가
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // modal.css 동적 로드
    loadModalCSS();

    // ✅ 모달 오버레이 클릭 이벤트 설정
    setupModalOverlayEvent();

    // ✅ ESC 키 이벤트 리스너 추가
    setupEscKeyEvent();

  } catch (error) {
    console.error('모달 초기화 실패:', error);
  }
}

// ✅ 모달 오버레이 클릭 이벤트 설정
function setupModalOverlayEvent() {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (event) {
      // 오버레이 자체를 클릭했을 때만 닫기
      if (event.target === event.currentTarget) {
        closeModal();
      }
    });
  }
}

// ✅ ESC 키 이벤트 설정 (중복 방지)
function setupEscKeyEvent() {
  // 기존 이벤트 리스너가 있는지 확인하고 중복 방지
  if (!document.hasEscKeyListener) {
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay && modalOverlay.classList.contains('active')) {
          closeModal();
        }
      }
    });
    document.hasEscKeyListener = true;
  }
}

// modal.css 파일 동적 로드
function loadModalCSS() {
  // 이미 CSS가 로드되었는지 확인
  if (document.getElementById('modal-css')) {
    return;
  }

  const link = document.createElement('link');
  link.id = 'modal-css';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = '/common/modal.css';
  document.head.appendChild(link);
}

// 모달을 여는 함수 (외부 HTML 파일 로드)
async function openModal(htmlFile) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContainer = document.getElementById('modalContainer');

  if (!modalOverlay || !modalContainer) {
    console.error('모달이 초기화되지 않았습니다.');
    return;
  }

  // 모달 표시
  modalOverlay.classList.add('active');

  try {
    // 외부 HTML 파일 불러오기
    const response = await fetch(htmlFile);

    if (!response.ok) {
      throw new Error(`모달 파일을 불러올 수 없습니다: ${htmlFile}`);
    }

    const html = await response.text();
    modalContainer.innerHTML = html;

    // 모달 내부의 이벤트 리스너 추가
    setupModalEvents();

  } catch (error) {
    console.error('모달 로딩 에러:', error);
    // ✅ onclick 대신 이벤트 리스너 사용
    showModalError(error.message);
  }
}

// ✅ 모달 에러 표시 함수
function showModalError(message) {
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    modalContainer.innerHTML = `
      <div class="error">
        <h3>오류 발생</h3>
        <p>${message}</p>
        <button class="error-close-btn" style="padding: 8px 16px; margin-top: 10px; cursor: pointer;">닫기</button>
      </div>
    `;

    // 에러 메시지의 닫기 버튼에 이벤트 리스너 추가
    const errorCloseBtn = modalContainer.querySelector('.error-close-btn');
    if (errorCloseBtn) {
      errorCloseBtn.addEventListener('click', closeModal);
    }
  }
}

// 모달을 닫는 함수
function closeModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

// ✅ 이 함수는 더 이상 HTML onclick에서 사용하지 않지만 호환성을 위해 유지
function closeModalOnOverlay(event) {
  if (event.target === event.currentTarget) {
    closeModal();
  }
}

// 모달 내부 이벤트 설정
function setupModalEvents() {
  // 취소/닫기 버튼 이벤트
  const cancelButtons = document.querySelectorAll(
      '#modalContainer .cancel-btn, #modalContainer .close-btn');
  cancelButtons.forEach(button => {
    button.addEventListener('click', closeModal);
  });

  // 확인/삭제 버튼 이벤트 (커스텀 가능)
  const confirmButtons = document.querySelectorAll(
      '#modalContainer .confirm-btn, #modalContainer .delete-btn');
  confirmButtons.forEach(button => {
    button.addEventListener('click', function () {
      // 커스텀 이벤트 발생 (각 페이지에서 처리)
      const customEvent = new CustomEvent('modalConfirm', {
        detail: {
          buttonType: this.className,
          buttonElement: this
        }
      });
      document.dispatchEvent(customEvent);
    });
  });
}

// ✅ 전역 함수로 등록 (HTML onclick 호환성을 위해)
function registerGlobalModalFunctions() {
  window.closeModal = closeModal;
  window.closeModalOnOverlay = closeModalOnOverlay;
  window.openModal = openModal;
}

// 페이지 로드 시 전역 함수 등록
document.addEventListener('DOMContentLoaded', function () {
  registerGlobalModalFunctions();
});

export {
  common, rootUrl, loadLayout, initializeModal,
  openModal, closeModal, closeModalOnOverlay, setupModalEvents, isMine
};