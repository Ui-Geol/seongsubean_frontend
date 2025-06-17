import {  rootUrl  } from '/common/common.js';

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById("confirmBtn");
  const error = document.getElementById("passwordError");

  btn.addEventListener("click", () => {
    const token = localStorage.getItem("auth");
    const password = document.getElementById("currentPassword").value;

    if (!password) {
      error.textContent = "비밀번호를 입력하세요.";
      error.style.display = "block";
      return;
    }

    axios.post( rootUrl + "/api/account/checkPw",
        {password: password},
        {headers: {Authorization: `Bearer ${token}` } }
    )
    .then(res => {
      if (res.data.result) {
        window.location.href = "edit-profile.html";
      } else {
        error.textContent = "비밀번호가 일치하지 않습니다";
        error.style.display = "block";
      }
    })
    .catch(err => {
      alert(err);
    });
  });
});