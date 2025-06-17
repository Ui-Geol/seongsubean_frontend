import {updateAuthDisplay} from '/common/header.js';
const rootUrl = 'http://127.0.0.1:8881';

const common = axios.create({
  baseURL: rootUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function loadLayout() {
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

export {common, rootUrl, loadLayout}
