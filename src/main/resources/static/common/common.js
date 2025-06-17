import {updateAuthDisplay} from '/common/header.js';

const common = axios.create({
  baseURL: 'http://127.0.0.1:8881',
  headers: {
    'Content-Type': 'application/json'
  }
});
export default common;

export async function loadLayout() {
  // Header와 Footer를 순차적으로 로드
  await loadFragment('header-container', '/common/header.html');
  await loadFragment('footer-container', '/common/footer.html');

  // HTML 로드 완료 후 인증 상태 업데이트
  updateAuthDisplay();
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
