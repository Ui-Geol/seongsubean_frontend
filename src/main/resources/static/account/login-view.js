import {common, rootUrl} from '/common/common.js';

axios.defaults.withCredentials = true;

document.addEventListener("DOMContentLoaded", () => {
  const google = document.getElementById("google-login-btn");
  const kakao = document.getElementById("kakao-login-btn");

  google.addEventListener("click", () => {
    window.location.href = rootUrl + `/oauth2/authorization/google`;
  });

  kakao.addEventListener("click", () => {
    window.location.href = rootUrl + `/oauth2/authorization/kakao`;
  });
});

document.querySelector('#login-btn').addEventListener('click', () => {
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value.trim();

  if (!email || !password) {
    alert('이메일과 비밀번호를 모두 입력해주세요.');
    return;
  }

  common.post(rootUrl + '/login', {
    email: email,
    password: password
  })
  .then(res => {
    console.log(res.headers['authorization']);
    const token = res.headers["authorization"];
    if (token) {
      localStorage.auth = token;
      window.location.href = '../';
    } else {
      showError('이메일 또는 비밀번호가 틀렸습니다.');
    }
  })
  .catch(err => {
    showError('서버에 오류가 발생했습니다');
  });
});

function showError(msg) {
  const errorDiv = document.querySelector('#login-error');
  if (errorDiv) {
    errorDiv.innerText = msg;
    errorDiv.style.display = 'block';
  } else {
    alert(msg);
  }
}
