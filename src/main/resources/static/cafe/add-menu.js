import {loadLayout, rootUrl} from '/common/common.js';

document.addEventListener('DOMContentLoaded', async function () {
  // 레이아웃 로드
  await loadLayout();

  // URL 파라미터에서 cafeId와 menuId 추출
  const params = new URLSearchParams(window.location.search);
  const cafeId = params.get('cafeId');
  const menuId = params.get('menuId');

  // 수정 모드 판단
  const isEditMode = menuId !== null;

  console.log('=== 페이지 모드 확인 ===');
  console.log('cafeId:', cafeId);
  console.log('menuId:', menuId);
  console.log('isEditMode:', isEditMode);

  // cafeId 필수 체크
  if (!cafeId) {
    alert('카페 정보가 없습니다.');
    window.location.href = '/';
    return;
  }

  // 폼 요소들 가져오기
  const menuDescriptionTextarea = document.getElementById('menuDescription');
  const charCount = document.getElementById('charCount');
  const imageUpload = document.getElementById('imageUpload');
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const cancelBtn = document.getElementById('cancelBtn');
  const submitBtn = document.getElementById('submitBtn');
  const priceInput = document.getElementById('price');
  const cafeIdInput = document.getElementById('cafeId');
  const menuIdInput = document.getElementById('menuId');
  const pageTitle = document.getElementById('pageTitle');

  // 선택된 이미지 파일명 저장
  let selectedImageName = null;

  // Hidden 필드에 값 설정
  cafeIdInput.value = cafeId;
  if (menuId) {
    menuIdInput.value = menuId;
  }

  // 페이지 제목 및 버튼 텍스트 설정
  if (isEditMode) {
    pageTitle.textContent = '메뉴 수정';
    submitBtn.textContent = '수정';
    document.title = '메뉴 수정';
  } else {
    pageTitle.textContent = '메뉴 추가';
    submitBtn.textContent = '등록';
    document.title = '메뉴 추가';
  }

  // 글자 수 카운터
  menuDescriptionTextarea.addEventListener('input', function () {
    charCount.textContent = this.value.length;
  });

  // 가격 입력 포맷팅 (천 단위 콤마)
  priceInput.addEventListener('input', function () {
    let value = this.value.replace(/[^0-9]/g, '');
    if (value) {
      // 천 단위 콤마 추가는 표시용으로만 사용 (실제 값은 숫자로 유지)
      this.setAttribute('data-formatted', Number(value).toLocaleString() + '원');
    } else {
      this.removeAttribute('data-formatted');
    }
  });

  // 가격 입력 필드 포커스 아웃 시 포맷팅 표시
  priceInput.addEventListener('blur', function () {
    if (this.value) {
      const formatted = Number(this.value).toLocaleString() + '원';
      this.setAttribute('placeholder', formatted);
    }
  });

  // 가격 입력 필드 포커스 시 원래 placeholder 복원
  priceInput.addEventListener('focus', function () {
    this.setAttribute('placeholder', '가격을 입력해주세요');
  });

  // 이미지 업로드 영역 클릭 이벤트
  imageUpload.addEventListener('click', function () {
    imageInput.click();
  });

  // 파일 선택 이벤트
  imageInput.addEventListener('change', function (e) {
    handleFiles(e.target.files);
  });

  // 파일 처리 함수
  function handleFiles(files) {
    // 기존 미리보기 제거 (1개만 허용)
    imagePreview.innerHTML = '';
    selectedImageName = null;

    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
          selectedImageName = file.name;
          addImagePreview(e.target.result, file.name);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // 이미지 미리보기 추가
  function addImagePreview(src, fileName) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';

    previewItem.innerHTML = `
      <img src="${src}" alt="${fileName}" style="max-width: 200px; max-height: 200px;">
      <button type="button" class="remove-image">×</button>
      <div class="image-info">
        <span class="file-name">${fileName}</span>
      </div>
    `;

    imagePreview.appendChild(previewItem);

    // 제거 버튼 이벤트
    const removeBtn = previewItem.querySelector('.remove-image');
    removeBtn.addEventListener('click', function () {
      imageInput.value = '';
      selectedImageName = null;
      previewItem.remove();
    });
  }

  // 기존 이미지 표시 (수정 모드용)
  function displayExistingImage(imagePath) {
    if (!imagePath) {
      return;
    }

    imagePreview.innerHTML = '';
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item existing-image';

    previewItem.innerHTML = `
      <img src="${rootUrl}/api/common${imagePath}" alt="기존 이미지" 
           style="max-width: 200px; max-height: 200px;"
           onerror="this.src='/images/cafe/menuDefault.png'">
      <button type="button" class="remove-image">×</button>
      <div class="image-info">
        <span class="existing-label">기존 이미지</span>
        <span class="file-name">${imagePath.split('/').pop()}</span>
      </div>
    `;

    imagePreview.appendChild(previewItem);

    // 제거 버튼 이벤트
    const removeBtn = previewItem.querySelector('.remove-image');
    removeBtn.addEventListener('click', function () {
      previewItem.remove();
    });
  }

  // 수정 모드일 때 기존 데이터 로드
  if (isEditMode) {
    try {
      console.log('=== 메뉴 데이터 로드 시작 ===');
      console.log('cafeId:', cafeId);
      console.log('menuId:', menuId);

      const response = await axios.get(
          `${rootUrl}/api/cafe/${cafeId}/menu/${menuId}`);
      const menuData = response.data;

      console.log('=== 불러온 메뉴 데이터 ===');
      console.log('전체 response:', response);
      console.log('response.data:', response.data);
      console.log('menuData:', menuData);
      console.log('menuData의 타입:', typeof menuData);
      console.log('menuData의 키들:', Object.keys(menuData || {}));

      // 실제 데이터 구조 확인
      console.log('menuData를 JSON으로:', JSON.stringify(menuData, null, 2));

      // DOM 요소들이 존재하는지 확인
      const menuCategoryEl = document.getElementById('menuCategory');
      const menuNameEl = document.getElementById('menuName');
      const menuDescriptionEl = document.getElementById('menuDescription');
      const priceEl = document.getElementById('price');

      console.log('=== DOM 요소 확인 ===');
      console.log('menuCategory element:', menuCategoryEl);
      console.log('menuName element:', menuNameEl);
      console.log('menuDescription element:', menuDescriptionEl);
      console.log('price element:', priceEl);

      if (!menuCategoryEl || !menuNameEl || !menuDescriptionEl || !priceEl) {
        console.error('일부 폼 요소를 찾을 수 없습니다.');
        return;
      }

      // 폼에 기존 데이터 설정 (menuDto 구조에 맞게 수정)
      menuCategoryEl.value = menuData.menuDto?.menuCategory || '';
      menuNameEl.value = menuData.menuDto?.menuName || '';
      menuDescriptionEl.value = menuData.menuDto?.description || '';
      priceEl.value = menuData.menuDto?.price || '';

      console.log('=== 설정된 값 확인 ===');
      console.log('menuCategory:', menuCategoryEl.value);
      console.log('menuName:', menuNameEl.value);
      console.log('menuDescription:', menuDescriptionEl.value);
      console.log('price:', priceEl.value);

      // 글자 수 카운터 업데이트
      if (charCount) {
        charCount.textContent = (menuData.menuDto?.description || '').length;
      }

      // 기존 이미지 표시 (menuDto.image 사용)
      if (menuData.menuDto?.image) {
        console.log('기존 이미지 표시:', menuData.menuDto.image);
        displayExistingImage(menuData.menuDto.image);
      }

      console.log('=== 메뉴 데이터 로드 완료 ===');

    } catch (error) {
      console.error('=== 메뉴 데이터 로드 실패 ===');
      console.error(error);

      let errorMessage = '메뉴 정보를 불러올 수 없습니다.';
      if (error.response?.status === 404) {
        errorMessage = '존재하지 않는 메뉴입니다.';
      } else if (error.response?.status === 403) {
        errorMessage = '메뉴 정보에 접근할 권한이 없습니다.';
      }

      alert(errorMessage);
      console.log('데이터 로드 실패로 인해 처리를 중단합니다.');
      return; // 여기서 함수 실행을 중단
    }
  }

  // 폼 유효성 검사
  function validateForm() {
    let isValid = true;
    const errors = [];

    // 필수 필드 검사
    const menuCategory = document.getElementById('menuCategory').value;
    const menuName = document.getElementById('menuName').value.trim();
    const price = document.getElementById('price').value;

    // 카테고리 검사
    if (!menuCategory) {
      errors.push('메뉴 카테고리를 선택해주세요.');
      document.getElementById('menuCategory').classList.add('error');
      isValid = false;
    } else {
      document.getElementById('menuCategory').classList.remove('error');
    }

    // 메뉴명 검사
    if (!menuName) {
      errors.push('메뉴명을 입력해주세요.');
      document.getElementById('menuName').classList.add('error');
      isValid = false;
    } else {
      document.getElementById('menuName').classList.remove('error');
    }

    // 가격 검사
    if (!price || price <= 0) {
      errors.push('올바른 가격을 입력해주세요.');
      document.getElementById('price').classList.add('error');
      isValid = false;
    } else {
      document.getElementById('price').classList.remove('error');
    }

    // 이미지 검사 (등록 모드에서만 필수)
    const hasNewImage = selectedImageName !== null;
    const hasExistingImage = imagePreview.querySelector('.existing-image');

    if (!isEditMode && !hasNewImage) {
      errors.push('이미지를 선택해주세요.');
      isValid = false;
    }

    // 에러 메시지 표시
    if (!isValid) {
      alert(errors.join('\n'));
    }

    return isValid;
  }

  // 제출 버튼 이벤트
  submitBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      console.log('=== 폼 제출 시작 ===');
      console.log('모드:', isEditMode ? '수정' : '등록');

      // JSON 데이터 생성
      const jsonData = {
        menuCategory: document.getElementById('menuCategory').value,
        menuName: document.getElementById('menuName').value,
        price: Number(document.getElementById('price').value),
        description: document.getElementById('menuDescription').value
      };

      // 새 이미지가 있으면 파일명 추가
      if (selectedImageName) {
        jsonData.image = selectedImageName;
        console.log('새 이미지 파일명:', selectedImageName);
      }

      // 수정 모드일 때 menuId와 cafeId 추가
      if (isEditMode) {
        jsonData.menuId = Number(menuId);
        jsonData.cafeId = Number(cafeId);
      }

      // API 요청 설정
      const url = isEditMode ? `${rootUrl}/api/cafe/${cafeId}/menu`
          : `${rootUrl}/api/cafe/${cafeId}/menu`;
      const method = isEditMode ? 'PUT' : 'POST';

      console.log('=== 요청 정보 ===');
      console.log('URL:', url);
      console.log('Method:', method);
      console.log('JSON Data:', jsonData);

      // 서버로 전송
      const response = await axios({
        method: method,
        url: url,
        data: jsonData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('auth')
        }
      });

      console.log('=== 응답 정보 ===');
      console.log('Status:', response.status);
      console.log('Response Data:', response.data);

      // 성공 처리
      const successMessage = isEditMode ? '메뉴가 성공적으로 수정되었습니다!'
          : '메뉴가 성공적으로 등록되었습니다!';
      alert(successMessage);

      // 카페 상세 페이지로 이동
      window.location.href = `/cafe/cafe-detail.html?cafeId=${cafeId}`;

    } catch (error) {
      console.error('=== 폼 제출 오류 ===');
      console.error(error);

      let errorMessage = '요청 처리 중 오류가 발생했습니다.';

      if (error.response) {
        console.error('서버 오류:', error.response.status, error.response.data);
        errorMessage = error.response.data.message ||
            error.response.data.error ||
            `HTTP ${error.response.status} 에러가 발생했습니다.`;
      } else if (error.request) {
        console.error('네트워크 오류:', error.request);
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      }

      alert(errorMessage);
    }
  });

  // 취소 버튼 이벤트
  cancelBtn.addEventListener('click', function () {
    const message = isEditMode ? '수정을 취소하시겠습니까?'
        : '작성 중인 내용이 모두 삭제됩니다. 계속하시겠습니까?';

    if (confirm(message)) {
      // 카페 상세 페이지로 이동
      window.location.href = `/cafe/cafe-detail.html?cafeId=${cafeId}`;
    }
  });

  // 실시간 입력 피드백
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('blur', function () {
      if (this.hasAttribute('required') && !this.value.trim()) {
        this.classList.add('error');
      } else {
        this.classList.remove('error');
      }
    });

    input.addEventListener('focus', function () {
      this.classList.remove('error');
    });
  });
});