import common, { loadLayout } from '/common/common.js';

let freeBoardId = null;
let loginUserEmail = '';

async function fetchLoginEmail() {
    try {
        const res = await common.get('/api/freeboards/auth/email');
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
    freeBoardId = urlParams.get("id");

    document.getElementById('delete-btn')?.addEventListener('click', deleteHandler);
    document.getElementById('edit-btn')?.addEventListener('click', () => {
        if (freeBoardId) {
            window.location.href = `/board/free-post.html?id=${freeBoardId}`;
        }
    });

    try {
        const res = await common.get(`/api/freeboards/detail/${freeBoardId}`);
        const data = res.data;
        await fetchLoginEmail();

        if (loginUserEmail === data.email) {
            document.getElementById('edit-btn').style.display = 'inline-block';
            document.getElementById('delete-btn').style.display = 'inline-block';
        }

        document.getElementById('post-title').textContent = data.title;
        document.getElementById('author-name').textContent = data.nickName;
        document.getElementById('post-date').textContent = formatDate(data.createdDate);
        document.getElementById('post-content').innerHTML = data.content;

        const headwordSelect = document.getElementById("headword-select");
        if (headwordSelect && data.headWord) {
            headwordSelect.value = data.headWord;
        }

        const imageContainer = document.getElementById('image-container');
        imageContainer.innerHTML = '';

        for (const imgName of (data.images || [])) {
            if (imgName === 'default.png') continue;
            try {
                const imagePath = `http://127.0.0.1:8881/api/common${imgName.startsWith('/') ? '' : '/'}${imgName}`;
                const imageRes = await axios.get(imagePath, { responseType: 'blob' });
                const imageUrl = URL.createObjectURL(imageRes.data);

                const imgTag = document.createElement('img');
                imgTag.src = imageUrl;
                imgTag.classList.add('post-image');
                imgTag.alt = '게시글 이미지';
                imageContainer.appendChild(imgTag);
            } catch (err) {
                console.warn(`이미지 로딩 실패: ${imgName}`, err);
            }
        }

        const avatar = document.getElementById('author-avatar');
        let profileImageUrl = 'http://127.0.0.1:8881/images/board/SampleProfile.png';

        if (data.profileImage) {
            try {
                const imageRes = await axios.get(`http://127.0.0.1:8881/api/common${data.profileImage.startsWith('/') ? '' : '/'}${data.profileImage}`, {
                    responseType: 'blob'
                });
                profileImageUrl = URL.createObjectURL(imageRes.data);
            } catch (err) {
                console.warn('작성자 프로필 이미지 로딩 실패:', err);
            }
        }

        avatar.innerHTML = `<img src="${profileImageUrl}" class="avatar-img">`;

    } catch (err) {
        console.error("불러오기 실패:", err);
        alert("게시글을 불러오는 데 실패했습니다.");
    }

    await loadComments();
});

async function deleteHandler() {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
        const res = await common.delete(`/api/freeboards/detail/${freeBoardId}`);
        if (res.data.deleted) {
            alert("삭제되었습니다.");
            window.location.href = `/board/free-list.html?ts=${Date.now()}`;
        } else {
            alert("삭제에 실패했습니다.");
        }
    } catch (err) {
        console.error("삭제 오류:", err);
        alert("오류 발생");
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR");
}

// 💬 댓글 처리
async function loadComments() {
    let currentUserEmail = '';
    try {
        const userRes = await common.get('/api/freeboards/auth/email');
        currentUserEmail = userRes.data.email;
    } catch {}

    try {
        const res = await common.get(`/api/freeboards/comment/${freeBoardId}`);
        const comments = res.data;

        const commentList = document.querySelector(".comment-list");
        commentList.innerHTML = "";

        comments.forEach(comment => {
            const item = document.createElement("div");
            item.className = "comment-item";
            item.innerHTML = `
              <div class="comment-avatar">
                <img src="${comment.profileImage || 'http://127.0.0.1:8881/images/board/SampleProfile.png'}" class="avatar-img">
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">${comment.nickName}</span>
                  <span class="comment-date">${formatDate(comment.createdDate)}</span>
                </div>
                <div class="comment-text">${comment.content}</div>
                ${comment.email === currentUserEmail ? `<div class="comment-actions">
                  <button class="comment-delete-btn" data-id="${comment.freeBoardCommentId}">삭제하기</button></div>` : ""}
              </div>
            `;
            commentList.appendChild(item);
        });

        document.querySelectorAll(".comment-delete-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                if (confirm("댓글을 삭제하시겠습니까?")) {
                    await common.delete(`/api/freeboards/comment/${id}`);
                    alert("댓글이 삭제되었습니다.");
                    location.reload();
                }
            });
        });
    } catch (err) {
        console.warn("댓글 로딩 실패:", err);
    }
}

document.querySelector(".comment-submit")?.addEventListener("click", async () => {
    const content = document.querySelector(".comment-input").value.trim();
    if (!content) return alert("댓글을 입력해주세요.");

    const formData = new FormData();
    formData.append("comment", content);
    formData.append("freeBoardId", freeBoardId);

    try {
        const res = await common.post("/api/freeboards/comment", formData);
        if (res.data.success) {
            alert("댓글이 등록되었습니다.");
            location.reload();
        } else {
            alert(res.data.message || "등록 실패");
        }
    } catch (err) {
        console.error("댓글 등록 오류:", err);
        alert("댓글 등록 중 오류 발생");
    }
});
