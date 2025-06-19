import { loadLayout, rootURL } from '/common/common.js';

let reportId = null;
let loginUserEmail = '';

async function fetchLoginEmail() {
  try {
    const res = await common.get(`${rootURL}/api/reportboards/auth/email`);
    if (res.data.success) {
      loginUserEmail = res.data.email;
    }
  } catch (err) {
    console.warn("로그인 이메일 조회 실패:", err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  loadLayout();

  const urlParams = new URLSearchParams(window.location.search);
  reportId = urlParams.get("id");

  document.getElementById('delete-btn')?.addEventListener('click', deleteHandler);
  document.getElementById('edit-btn')?.addEventListener('click', () => {
    window.location.href = `/board/report-post.html?id=${reportId}`;
  });

  try {
    const res = await common.get(`${rootURL}/api/reportboards/detail/${reportId}`);
    const data = res.data;
    await fetchLoginEmail();

    if (loginUserEmail === data.email) {
      document.getElementById('edit-btn').style.display = 'inline-block';
      document.getElementById('delete-btn').style.display = 'inline-block';
    }

    document.getElementById('report-title').textContent = data.title;
    document.getElementById('author-name').textContent = data.nickName;
    document.getElementById('report-date').textContent = new Date(data.createdDate).toLocaleDateString("ko-KR");
    document.getElementById('report-content').innerHTML = data.content;

    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = '';
    for (const imgName of (data.images || [])) {
      if (imgName === 'default.png') continue;
      try {
        const imagePath = `${rootURL}/api/common${imgName.startsWith('/') ? '' : '/'}${imgName}`;
        const imageRes = await axios.get(imagePath, { responseType: 'blob' });
        const imageUrl = URL.createObjectURL(imageRes.data);
        const imgTag = document.createElement('img');
        imgTag.src = imageUrl;
        imgTag.classList.add('report-image');
        imageContainer.appendChild(imgTag);
      } catch (err) {
        console.warn('이미지 로딩 실패:', err);
      }
    }
  } catch (err) {
    console.error("불러오기 실패:", err);
    alert("게시글을 불러오는 데 실패했습니다.");
  }
});

async function deleteHandler() {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    const res = await common.delete(`${rootURL}/api/reportboards/${reportId}`);
    if (res.data.deleted) {
      alert("삭제되었습니다.");
      window.location.href = `/board/report-list.html?ts=${Date.now()}`;
    } else {
      alert("삭제에 실패했습니다.");
    }
  } catch (err) {
    console.error("삭제 오류:", err);
    alert("오류 발생");
  }
}
