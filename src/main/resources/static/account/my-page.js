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
      userImage.src = '/images/account/default.png';   // 기본 프로필 이미지
    } else {
      userImage.src = `/images/account/${image}`;      // 저장된 유저 이미지
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("profile-upload").addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) return;

    const fileName = file.name.replaceAll(' ', '_');
    const token = localStorage.getItem("auth"); // 반드시 여기서 설정

    try {
      const res = await axios.put(rootUrl + "/api/account/profile/image", { image: fileName }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      });

      // 미리보기 업데이트
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('profile-img').src = e.target.result;
      };
      reader.readAsDataURL(file);

      alert(res.data.message);
    } catch (err) {
      console.error("업로드 실패:", err);
      alert("이미지 저장 실패");
    }
  });
});
