import { loadLayout, rootURL } from '/common/common.js';

document.addEventListener('DOMContentLoaded', async () => {
  loadLayout();

  const reportListContainer = document.getElementById('report-list');
  try {
    const res = await common.get(`${rootURL}/api/reportboards/list`);
    const reports = res.data;

    reports.forEach(report => {
      const card = document.createElement('div');
      card.className = 'report-card';
      card.innerHTML = `
                <h3>${report.title}</h3>
                <p>${report.nickName} | ${new Date(report.createdDate).toLocaleDateString()}</p>
                <a href="/board/report-detail.html?id=${report.reportBoardId}">자세히 보기</a>
            `;
      reportListContainer.appendChild(card);
    });
  } catch (err) {
    console.error('제보 목록 불러오기 실패:', err);
    alert('제보 목록을 불러오는 데 실패했습니다.');
  }
});
