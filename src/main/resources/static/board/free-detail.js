import { loadLayout, rootUrl, initializeModal } from '/common/common.js';
import {showBoardModal} from "/board/board-modal.js";

let freeBoardId = null;
let loginUserEmail = '';

async function fetchLoginEmail() {
    const token = localStorage.getItem("auth");
    try {
        const res = await axios.get(rootUrl+'/api/account/email',{
            headers : { Authorization: `Bearer ${token}`}
        });
        if (res) {
            loginUserEmail = res.data;
        }
    } catch (err) {
        console.warn("로그인 이메일 조회 실패:", err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    loadLayout();
    await initializeModal();
    let currentUserProfileImage =  'http://127.0.0.1:8880/images/account/default.png';


    try {
        const token = localStorage.getItem("auth");
        const res = await axios.get(rootUrl + '/api/account/auth', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const imagePath = res.data.image; // 예: "/account/1989sd.jpg"

        if (imagePath) {
            currentUserProfileImage = imagePath.startsWith("/")
                ? rootUrl + imagePath
                : rootUrl + "/" + imagePath;
        }
    } catch (err) {
        console.warn("댓글 입력창 프로필 이미지 로딩 실패:", err);
    }

    const avatarDiv = document.querySelector('.comment-form .comment-avatar');
    if (avatarDiv) {
        avatarDiv.innerHTML = `<img src="${currentUserProfileImage}" class="avatar-img">`;
    }


    const urlParams = new URLSearchParams(window.location.search);
    freeBoardId = urlParams.get("id");

    document.getElementById('delete-btn')?.addEventListener('click', deleteHandler);
    document.getElementById('edit-btn')?.addEventListener('click', () => {
        if (freeBoardId) {
            window.location.href = `/board/free-post.html?id=${freeBoardId}`;
        }
    });

    try {
        const res = await axios.get(rootUrl+`/api/freeboards/detail/${freeBoardId}`);
        const data = res.data;
        await fetchLoginEmail();
        console.log(loginUserEmail);
        console.log(data.email);
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
                const imagePath = rootUrl+`/api/common${imgName.startsWith('/') ? '' : '/'}${imgName}`;
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
        let authorProfileImageUrl = 'http://127.0.0.1:8880/images/account/default.png';

        try {
            const res = await axios.get(rootUrl + `/api/board/email?email=${encodeURIComponent(data.email)}`);
            authorProfileImageUrl = res.data.image || authorProfileImageUrl;
        } catch (err) {
            console.warn("작성자 프로필 이미지 로딩 실패:", err);
        }

        avatar.innerHTML = `<img src="${authorProfileImageUrl}" class="avatar-img">`;


    } catch (err) {
        console.error("불러오기 실패:", err);
        alert("게시글을 불러오는 데 실패했습니다.");
    }

    await loadComments();
});

async function deleteHandler() {
    showBoardModal({
        type: 'post-delete',
        onConfirm: async () => {
            const token = localStorage.getItem("auth");
            try {
                const res = await axios.delete(rootUrl + `/api/${freeBoardId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.deleted) {
                    showBoardModal({
                        type: 'post-create', // 삭제 후 완료 메시지용으로 임시 사용
                        title: '삭제 완료',
                        message: '게시글이 삭제되었습니다.',
                        onConfirm: () => {
                            window.location.href = `/board/free-list.html?ts=${Date.now()}`;
                        }
                    });
                } else {
                    alert("삭제에 실패했습니다.");
                }
            } catch (err) {
                console.error("삭제 오류:", err);
                alert("오류 발생");
            }
        }
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR");
}

// 댓글 처리
async function loadComments() {
    let currentUserEmail = '';
    const token = localStorage.getItem("auth");

    // JWT refact
    try {
        const userRes = await axios.get(rootUrl+'/api/account/email', {
            headers: { Authorization: `Bearer ${token}` }
        });
        currentUserEmail = userRes.data;
    } catch (err) {
        console.warn("로그인 이메일 조회 실패:", err);
    }

    try {
        const res = await axios.get(rootUrl+`/api/freeboards/comment/${freeBoardId}`);
        const comments = res.data;

        const commentList = document.querySelector(".comment-list");
        commentList.innerHTML = "";

        comments.forEach(comment => {
            const item = document.createElement("div");
            item.className = "comment-item";
            const isOwner = comment.email === currentUserEmail;
            item.innerHTML = `
              <div class="comment-avatar">
                <img src="${comment.profileImage || 'http://127.0.0.1:8880/images/account/default.png'}" class="avatar-img">
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">${comment.nickName}</span>
                  <span class="comment-date">${formatDate(comment.createdDate)}</span>
                </div>
                <div class="comment-text">${comment.content}</div>
                ${isOwner ? `<div class="comment-actions">
                  <button class="comment-delete-btn" data-id="${comment.freeBoardCommentId}">삭제하기</button></div>` : ""}
              </div>
            `;

            commentList.appendChild(item);
        });

        document.querySelectorAll(".comment-delete-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                if (confirm("댓글을 삭제하시겠습니까?")) {
                    try {
                        const res = await axios.delete(rootUrl+`/api/freeboards/comment/${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.data.success) {
                            showBoardModal({
                                type: 'comment-create',
                                message: '댓글이 삭제되었습니다.',
                                onConfirm: () => location.reload()
                            });
                        } else {
                            alert("댓글 삭제 실패");
                        }
                    } catch (err) {
                        console.error("댓글 삭제 오류:", err);
                        alert("오류 발생");
                    }
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
    const token = localStorage.getItem("auth");

    try {
        const res = await axios.post(
            rootUrl + "/api/freeboards/comment",
            {
                content: content,
                freeBoardId: freeBoardId
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (res.data.success) {
            showBoardModal({
                type: 'comment-create',
                onConfirm: () => location.reload()
            });
        }
        else {

            alert(res.data.message || "등록 실패");
        }
    } catch (err) {
        console.error("댓글 등록 오류:", err);
        alert("댓글 등록 중 오류 발생");
    }
});