import {rootUrl} from "/common/common.js";

// 전역 변수
let selectedFiles = [];

document.addEventListener('DOMContentLoaded', async function () {
  // 쿼리스트링에서 카페 ID 추출
  const params = new URLSearchParams(window.location.search);
  const cafeId = params.get('cafeId');

  console.log('=== 리뷰 작성 페이지 초기화 ===');
  console.log('cafeId:', cafeId);

  if (!cafeId || !/^\d+$/.test(cafeId)) {
    alert('올바르지 않은 카페 ID입니다.');
    window.location.href = '/';
    return;
  }

  // DOM 요소들
  const reviewContent = document.getElementById('reviewContent');
  const charCount = document.getElementById('charCount');
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const stars = document.querySelectorAll('.star-label');
  const ratingInput = document.querySelector('.rating-input');

  // 글자 수 카운터 업데이트
  function updateCharCount() {
    const length = reviewContent.value.length;
    charCount.textContent = length;
    charCount.style.color = (length > 450) ? '#dc3545' : '#999';
  }

  // 리뷰 내용 글자 수 카운터
  if (reviewContent && charCount) {
    reviewContent.addEventListener('input', updateCharCount);
    updateCharCount(); // 초기 카운트 설정
  }

  // 별점 상호작용 - 클릭 이벤트
  stars.forEach((star, index) => {
    star.addEventListener('click', function () {
      const starValue = parseInt(this.getAttribute('for').replace('star', ''));
      document.getElementById(`star${starValue}`).checked = true;
      updateStarDisplay();
    });

    star.addEventListener('mouseenter', function () {
      const starValue = parseInt(this.getAttribute('for').replace('star', ''));
      // 호버 시 해당 별까지 활성화
      for (let i = 1; i <= starValue; i++) {
        document.querySelector(`label[for="star${i}"]`).style.color = '#D4A574';
      }
      for (let i = starValue + 1; i <= 5; i++) {
        document.querySelector(`label[for="star${i}"]`).style.color = '#e9ecef';
      }
    });
  });

  // 별점 컨테이너에서 마우스가 나갔을 때 원래 상태로
  ratingInput.addEventListener('mouseleave', function () {
    updateStarDisplay();
  });

  // 별점 표시 업데이트 함수
  function updateStarDisplay() {
    const checkedStar = document.querySelector('.star-input:checked');
    if (checkedStar) {
      const checkedValue = parseInt(checkedStar.value);
      for (let i = 1; i <= 5; i++) {
        const star = document.querySelector(`label[for="star${i}"]`);
        if (i <= checkedValue) {
          star.style.color = '#D4A574';
        } else {
          star.style.color = '#e9ecef';
        }
      }
    } else {
      // 선택된 별이 없으면 모두 회색
      for (let i = 1; i <= 5; i++) {
        const star = document.querySelector(`label[for="star${i}"]`);
        star.style.color = '#e9ecef';
      }
    }
  }

  // 이미지 업로드 및 미리보기
  imageInput.addEventListener('change', function (e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = function (e) {
          const previewItem = document.createElement('div');
          previewItem.className = 'preview-item';
          previewItem.innerHTML = `
            <img src="${e.target.result}" alt="미리보기">
            <button type="button" class="remove-image" onclick="removeImage(${selectedFiles.length
          - 1})">×</button>
          `;
          imagePreview.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
      }
    });

    // 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    imageInput.value = '';
  });

  // 이미지 제거 함수
  window.removeImage = function (index) {
    selectedFiles.splice(index, 1);
    updateImagePreview();
  };

  // 이미지 미리보기 업데이트
  function updateImagePreview() {
    imagePreview.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
          <img src="${e.target.result}" alt="미리보기">
          <button type="button" class="remove-image" onclick="removeImage(${index})">×</button>
        `;
        imagePreview.appendChild(previewItem);
      };
      reader.readAsDataURL(file);
    });
  }

  // 리뷰 제출 함수
  window.submitReview = async function () {
    const rating = document.querySelector('input[name="rating"]:checked');
    const content = reviewContent.value.trim();

    console.log('=== 리뷰 제출 시작 ===');
    console.log('별점:', rating ? rating.value : 'null');
    console.log('내용:', content);
    console.log('이미지 개수:', selectedFiles.length);

    // 유효성 검사
    if (!rating) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (!content) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    if (content.length > 500) {
      alert('리뷰 내용은 500자 이하로 작성해주세요.');
      return;
    }

    // 제출 버튼 비활성화
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';

    try {
      // TotalReviewDTO 형태로 리뷰 데이터 생성 (이미지 없이)
      const reviewData = {
        userNickname: null, // 서버에서 설정
        userImage: null, // 서버에서 설정
        reviewDTO: {
          reviewContents: content,
          starScore: parseInt(rating.value)
          // cafeId, email, reviewId, reviewDate는 서버에서 설정
        },
        reviewImage: selectedFiles.map(file => ({
          image: file.name // 파일명만 전송
          // reviewId는 서버에서 설정
        }))
      };

      console.log('=== 전송할 리뷰 데이터 ===');
      console.log(reviewData);

      const url = `/api/cafe/${cafeId}/reviews`;

      console.log('=== 리뷰 등록 요청 ===');
      console.log('URL:', rootUrl + url);
      console.log('Method: POST');

      // Axios를 사용한 리뷰 데이터 전송
      const response = await axios({
        method: 'POST',
        url: rootUrl + url,
        data: reviewData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('auth')
        }
      });

      console.log('=== 리뷰 등록 응답 ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      if (response.status === 201 || response.status === 200) {
        const message = response.data || '리뷰가 성공적으로 등록되었습니다.';
        alert(message);
        resetForm();
        // 카페 상세 페이지로 이동
        window.location.href = `/cafe/cafe-detail.html?cafeId=${cafeId}`;
      }

    } catch (error) {
      console.error('=== 리뷰 등록 오류 ===');
      console.error(error);

      let errorMessage = '리뷰 등록 중 오류가 발생했습니다.';

      if (error.response) {
        console.error('서버 오류:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          errorMessage = '로그인이 필요합니다.';
        } else if (error.response.status === 500) {
          errorMessage = '서버 오류가 발생했습니다.';
        } else {
          errorMessage = error.response.data?.message ||
              error.response.data?.error ||
              error.response.data ||
              `HTTP ${error.response.status} 에러가 발생했습니다.`;
        }
      } else if (error.request) {
        console.error('네트워크 오류:', error.request);
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      }

      alert(errorMessage);
    } finally {
      // 제출 버튼 다시 활성화
      submitBtn.disabled = false;
      submitBtn.textContent = '등록';
    }
  };

  // 취소 버튼 함수
  window.cancelReview = function () {
    if (confirm('작성 중인 리뷰를 취소하시겠습니까?')) {
      resetForm();
      // 카페 상세 페이지로 이동
      window.location.href = `/cafe/cafe-detail.html?cafeId=${cafeId}`;
    }
  };

  // 폼 초기화 함수
  function resetForm() {
    reviewContent.value = '';
    charCount.textContent = '0';
    charCount.style.color = '#999';
    selectedFiles = [];
    imagePreview.innerHTML = '';

    // 별점 초기화 (선택 해제)
    const checkedStar = document.querySelector('.star-input:checked');
    if (checkedStar) {
      checkedStar.checked = false;
    }
    updateStarDisplay();
  }

  // 페이지 로드 시 초기화
  console.log('=== 페이지 초기화 완료 ===');
  // 초기 별점 표시 (선택된 것 없음)
  updateStarDisplay();
  // 초기 문자 수 표시
  updateCharCount();
});