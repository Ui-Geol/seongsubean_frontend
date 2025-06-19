import { loadLayout, rootURL } from '/common/common.js';

document.addEventListener('DOMContentLoaded', async function () {
    loadLayout();
    const editor = new toastui.Editor({
        el: document.querySelector('#editor'),
        height: '500px',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        language: 'ko'
    });

    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get("id");
    const isEdit = !!reportId;

    const form = document.getElementById('report-form');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('editor-contents');
    const cancelBtn = document.getElementById('cancel-btn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = '/board/report-list.html';
        });
    }

    if (isEdit) {
        try {
            const res = await common.get(`${rootURL}/api/reportboards/detail/${reportId}`);
            const data = res.data;
            titleInput.value = data.title;
            editor.setHTML(data.content);
        } catch (err) {
            console.error('수정 데이터 불러오기 실패', err);
            alert('제보글 정보를 불러올 수 없습니다.');
        }
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const title = titleInput.value.trim();
        const contentHtml = editor.getHTML();
        contentInput.value = contentHtml;

        const imageInput = document.getElementById('images');
        const files = imageInput.files;

        if (files.length > 5) {
            alert('이미지는 최대 5개까지만 업로드할 수 있습니다.');
            return;
        }

        try {
            let response;
            if (isEdit) {
                response = await common.put(
                    `${rootURL}/api/reportboards/post/${reportId}`,
                    {
                        title,
                        content: contentHtml
                    }
                );
            } else {
                const formData = new FormData(form);
                response = await common.post(`${rootURL}/api/reportboards`, formData);
            }

            const result = response.data;
            if (isEdit && result.updated) {
                alert('제보글이 수정되었습니다!');
                location.href = `/board/report-detail.html?id=${reportId}`;
            } else if (!isEdit && result.success) {
                alert('제보글이 등록되었습니다!');
                location.href = `/board/report-detail.html?id=${result.id}`;
            } else {
                alert('처리에 실패했습니다.');
            }
        } catch (err) {
            console.error('전송 오류', err);
            alert('요청 중 문제가 발생했습니다.');
        }
    });
});
