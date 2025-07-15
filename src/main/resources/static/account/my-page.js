import {  rootUrl  } from '/common/common.js';

document.addEventListener("DOMContentLoaded", () => {
  const userImage = document.getElementById("profile-img");
  const userNickname = document.getElementById("username");
  const editBtn = document.getElementById("edit-profile-btn");

  const token = localStorage.getItem("auth");

  axios.get( rootUrl + "/api/account/profile", {
    headers: {Authorization: `Bearer ${token}`}
  })
  .then(res => {
    const {nickName, image, isOauth} = res.data;
    if (!image) {
      userImage.src = '/images/account/default.png';
    }else {
      userImage.src = image;
    }
    userNickname.textContent = nickName;

    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (isOauth) {
        window.location.href = "edit-profile.html";
      } else {
        window.location.href = "check-pw.html";
      }
    })
  })
  .catch(err => {
    alert(err);
  })
});

document.getElementById('profile-upload').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  axios.put(rootUrl + "/api/account/profile/image", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  })
  .then(response => {
    // 미리보기 이미지 변경
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('profile-img').src = e.target.result;
    };
    reader.readAsDataURL(file);
  })
  .catch(() => {
    alert("업로드 실패");
  });
});