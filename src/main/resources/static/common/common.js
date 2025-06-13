const common = axios.create({
    baseURL: 'http://127.0.0.1:8881',
    headers: {
        'Content-Type': 'application/json'
    }
});
export default common;

export function loadLayout() {
    // Header 삽입
    axios.get('/common/header.html')
        .then(res => {
            document.getElementById('header-container').innerHTML = res.data;

            // 로그인 상태 확인 대신 하드코딩 (비로그인 상태라고 가정)
            // const loginArea = document.getElementById('login-area');
            // if (loginArea) {
            //     loginArea.innerHTML = `<a href="/account/login.html">로그인</a>`;
            // }

            // 백엔드 붙인 뒤에는 아래처럼 다시 바꾸면 됨

            return common.get('/board/freeboards/api/auth/email')
              .then(res => {
                if (res.data.success) {
                  loginArea.innerHTML = `
                    <form action="/account/myPage" method="get"><button type="submit">마이페이지</button></form>
                    <form action="/account/logout" method="post"><button type="submit">로그아웃</button></form>
                  `;
                } else {
                  loginArea.innerHTML = `<a href="/account/login.html">로그인</a>`;
                }
              });

        })
        .catch(err => {
            console.error('[layout] header 삽입 실패:', err);
        });

    // Footer 삽입
    axios.get('/common/footer.html')
        .then(res => {
            document.getElementById('footer-container').innerHTML = res.data;
        })
        .catch(err => {
            console.error('[layout] footer 삽입 실패:', err);
        });
}
