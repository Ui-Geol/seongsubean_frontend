import {updateAuthDisplay} from '/common/header.js';

const rootUrl = 'http://43.200.1.181:8881';

const common = axios.create({
  baseURL: rootUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function loadLayout() {
  await checkToken();
  const test = await isMine('hanni0616@gmail.com');
  console.log(test);
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

export {common, rootUrl, loadLayout};
