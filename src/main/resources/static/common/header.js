export function updateAuthDisplay() {
  const token = localStorage.getItem('auth');
  const authEls = document.querySelectorAll('.authenticated form');
  const unauthEls = document.querySelectorAll('.unauthenticated');

  // null 체크 및 요소 존재 확인
  if (!authEls.length || !unauthEls.length) {
    console.error('인증 관련 요소를 찾을 수 없습니다:', {
      authenticated: authEls.length,
      unauthenticated: unauthEls.length
    });
    return;
  }

  if (token && token.startsWith('Bearer')) {
    console.log('로그인');
    // 모든 authenticated form 요소들을 보이기
    authEls.forEach(el => el.style.display = 'inline-block');
    // 모든 unauthenticated 요소들을 숨기기
    unauthEls.forEach(el => el.style.display = 'none');
  } else {
    console.log('로그아웃');
    // 모든 authenticated form 요소들을 숨기기
    authEls.forEach(el => el.style.display = 'none');
    // 모든 unauthenticated 요소들을 보이기
    unauthEls.forEach(el => el.style.display = 'inline-block');
  }
}