import {  rootUrl  } from '/common/common.js';

const validationState = {
  nicknameValid: false,
  passwordMatch: false
};

document.addEventListener("DOMContentLoaded", () =>{
  let userEmail = document.getElementById("email");
  let userNickname = document.getElementById("nickname");

  const passwordRow = document.getElementById("password").closest(".form-row");
  const confirmRow = document.getElementById("password-confirm").closest(".form-row");

  const token = localStorage.getItem("auth");
  axios.get( rootUrl + "/api/account/editProfile",{
    headers : { Authorization: `Bearer ${token}`}
  })
  .then(res =>{
    const { email, nickName, oauth } = res.data;
    userEmail.placeholder = email;
    userNickname.placeholder = nickName;
    if(oauth){
      passwordRow.style.display = "none";
      confirmRow.style.display = "none";
    }
  })
  .catch(err =>{
    alert(err);
  });
});

// 닉네임 중복 체크
function checkNickname() {
  const nicknameInput = document.getElementById('nickname');
  const feedback = document.getElementById('nickname-feedback');
  const nickname = nicknameInput.value.trim();

  if (!nickname) {
    feedback.textContent = '';
    validationState.nicknameValid = false;
    return;
  }

  axios.post(rootUrl + "/api/account/checkNickname", {
    nickName: nickname
  })
  .then(res => {
    if (res.data.result) {
      feedback.textContent = "이미 사용 중인 닉네임입니다.";
      validationState.nicknameValid = false;
    } else {
      feedback.textContent = "";
      validationState.nicknameValid = true;
    }
  })
  .catch(() => {
    feedback.textContent = "오류가 발생했습니다.";
    validationState.nicknameValid = false;
  });
}

// 비밀번호 일치 확인
function checkPasswordMatch() {
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('password-confirm').value;
  const feedback = document.getElementById('password-feedback');

  if (password && confirm && password !== confirm) {
    feedback.textContent = "비밀번호가 일치하지 않습니다.";
    validationState.passwordMatch = false;
  } else {
    feedback.textContent = "";
    validationState.passwordMatch = true;
  }
}

function checkEmpty(event) {
  const password = document.getElementById("password").value.trim();
  const confirm = document.getElementById("password-confirm").value.trim();
  const nickname = document.getElementById("nickname").value.trim();

  if (!password && !confirm && !nickname) {
    alert("수정을 원하는 정보를 입력해주세요.");
    event.preventDefault();
    return;
  }

  if (nickname && !validationState.nicknameValid) {
    alert("닉네임이 중복입니다.");
    event.preventDefault();
    return;
  }

  if ((password || confirm) && !validationState.passwordMatch) {
    alert("비밀번호가 일치하지 않습니다.");
    event.preventDefault();
    return;
  }

  const payload = {};
  if (nickname) payload.newNickName = nickname;
  if (password) payload.newPassword = password;

  const token = localStorage.getItem("auth");
  axios.post( rootUrl + "/api/account/editProfile", payload, {
    headers : { Authorization : `Bearer ${token}`}
  })
  .then(res => {
    alert(res.data.message);
    window.location.href = "my-page.html";
  })
  .catch(err =>
  alert(err));
}

function deleteEvent() {
  const deleteBtn = document.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    if (!confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    const token = localStorage.getItem("auth");
    axios.delete( rootUrl + "/api/account/deleteAccount", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(() => {
      alert("회원 탈퇴가 완료되었습니다.");
      window.location.href = "login-view.html";
    })
    .catch(err => {
      console.error(err);
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    });
  });
}
deleteEvent();
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nickname").addEventListener("blur", checkNickname);
  document.getElementById("password").addEventListener("blur", checkPasswordMatch);
  document.getElementById("password-confirm").addEventListener("blur", checkPasswordMatch);
  document.getElementById("submitBtn").addEventListener("click", checkEmpty);
});
