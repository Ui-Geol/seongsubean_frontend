import {rootUrl} from "/common/common.js";

document.addEventListener('DOMContentLoaded', async function () {
  // 쿼리스트링에서 카페 ID 추출
  const params = new URLSearchParams(window.location.search);
  const cafeId = params.get('cafeId');

  // 수정 모드 판단: cafeId가 있고 숫자인 경우
  const isEdit = cafeId && /^\d+$/.test(cafeId);

  console.log('=== 모드 확인 ===');
  console.log('cafeId:', cafeId);
  console.log('isEdit:', isEdit);

  // DOM 요소들
  const form = document.getElementById('cafeForm');
  const cafeNameInput = document.getElementById('cafeName');
  const addressInput = document.getElementById('address');
  const zipCodeInput = document.getElementById('zipCode');
  const detailAddressInput = document.getElementById('detailAddress');
  const callNumberInput = document.getElementById('phone');
  const introductionInput = document.getElementById('description');
  const businessHoursInput = document.getElementById('businessHoursJson');
  const imageInput = document.getElementById('imageInput');
  const cancelBtn = document.getElementById('cancelBtn');
  const submitBtn = document.getElementById('submitJsonBtn');
  const charCountSpan = document.getElementById('charCount');

  // 글자 카운터 업데이트
  function updateCharCount() {
    const length = introductionInput.value.length;
    charCountSpan.textContent = length;
    charCountSpan.style.color = (length > 300) ? '#dc3545' : '#666';
  }

  // 소개 글자 수 카운터
  if (introductionInput && charCountSpan) {
    introductionInput.addEventListener('input', updateCharCount);
    updateCharCount(); // 초기 카운트 설정
  }

  // 취소 버튼 이벤트
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (isEdit) {
        // 수정 모드에서는 해당 카페 상세 페이지로
        window.location.href = `/cafe/cafe-detail.html?cafeId=${cafeId}`;
      } else {
        // 등록 모드에서는 메인 페이지로
        window.location.href = '/';
      }
    });
  }

  // 주소 검색 버튼
  const btnAddressSearch = document.getElementById('btnAddressSearch');
  if (btnAddressSearch) {
    btnAddressSearch.addEventListener('click', function () {
      new daum.Postcode({
        oncomplete: function (data) {
          addressInput.value = data.address;
          zipCodeInput.value = data.zonecode;
          detailAddressInput.focus();
        }
      }).open();
    });
  }

  // 영업시간 관리 로직
  const businessHoursContainer = document.getElementById(
      'business-hours-container');
  const addBusinessHoursBtn = document.getElementById('add-business-hours-btn');
  const template = document.getElementById('tpl-business-hours');

  // 시간 옵션 생성
  function populateTimeOptions(container) {
    const hourSelects = container.querySelectorAll('.hour-select');
    const minuteSelects = container.querySelectorAll('.minute-select');
    const periodSelects = container.querySelectorAll('.period-select');

    // 시 옵션 (1-12)
    hourSelects.forEach(select => {
      if (select.children.length <= 1) { // placeholder만 있는 경우
        for (let i = 1; i <= 12; i++) {
          const option = document.createElement('option');
          option.value = i;
          option.textContent = i;
          select.appendChild(option);
        }
      }
    });

    // 분 옵션 (00, 30)
    minuteSelects.forEach(select => {
      if (select.children.length <= 1) {
        ['00', '30'].forEach(minute => {
          const option = document.createElement('option');
          option.value = minute;
          option.textContent = minute;
          select.appendChild(option);
        });
      }
    });

    // AM/PM 옵션
    periodSelects.forEach(select => {
      if (select.children.length <= 1) {
        ['AM', 'PM'].forEach(period => {
          const option = document.createElement('option');
          option.value = period;
          option.textContent = period;
          select.appendChild(option);
        });
      }
    });
  }

  // 영업시간 그룹 추가
  function addBusinessHoursGroup(operationData = null) {
    const clone = template.content.cloneNode(true);
    const group = clone.querySelector('.business-hours-group');

    // 시간 옵션 추가
    populateTimeOptions(group);

    // 삭제 버튼 이벤트
    const removeBtn = group.querySelector('.btn-remove-hours');
    removeBtn.addEventListener('click', function () {
      group.remove();
    });

    businessHoursContainer.appendChild(group);

    // 수정 모드일 때 기존 데이터 설정
    if (operationData) {
      setBusinessHoursData(group, operationData);
    }

    return group;
  }

  // 영업시간 데이터 설정 (수정 모드용)
  function setBusinessHoursData(group, operationData) {
    try {
      // 요일 설정
      if (operationData.weekday) {
        const weekdaySelect = group.querySelector('.weekday-select');
        weekdaySelect.value = operationData.weekday;
      }

      // 시간 파싱 및 설정
      if (operationData.openTime) {
        const openTimeData = parseTimeString(operationData.openTime);
        setTimeSelects(group, 0, openTimeData); // 첫 번째 시간 선택자들
      }

      if (operationData.closeTime) {
        const closeTimeData = parseTimeString(operationData.closeTime);
        setTimeSelects(group, 1, closeTimeData); // 두 번째 시간 선택자들
      }

    } catch (error) {
      console.error('영업시간 데이터 설정 실패:', error);
    }
  }

  // 시간 문자열 파싱 (HH:mm 또는 HH:mm:ss 형식)
  function parseTimeString(timeString) {
    const timeParts = timeString.split(':');
    let hour = parseInt(timeParts[0]);
    const minute = timeParts[1];

    let period = 'AM';
    let displayHour = hour;

    // 24시간 형식을 12시간 형식으로 변환
    if (hour === 0) {
      displayHour = 12;
      period = 'AM';
    } else if (hour === 12) {
      displayHour = 12;
      period = 'PM';
    } else if (hour > 12) {
      displayHour = hour - 12;
      period = 'PM';
    }

    return {
      hour: displayHour.toString(),
      minute: minute,
      period: period
    };
  }

  // 시간 선택자에 값 설정
  function setTimeSelects(group, index, timeData) {
    const hourSelects = group.querySelectorAll('.hour-select');
    const minuteSelects = group.querySelectorAll('.minute-select');
    const periodSelects = group.querySelectorAll('.period-select');

    if (hourSelects[index]) {
      hourSelects[index].value = timeData.hour;
    }
    if (minuteSelects[index]) {
      minuteSelects[index].value = timeData.minute;
    }
    if (periodSelects[index]) {
      periodSelects[index].value = timeData.period;
    }
  }

  // 영업시간 추가 버튼 이벤트
  if (addBusinessHoursBtn) {
    addBusinessHoursBtn.addEventListener('click',
        () => addBusinessHoursGroup());

    // 수정 모드가 아닐 때만 초기 그룹 추가
    if (!isEdit) {
      addBusinessHoursGroup();
    }
  }

  // 영업시간 데이터 수집 (LocalTime 형식에 맞게 수정)
  function collectBusinessHours() {
    const groups = businessHoursContainer.querySelectorAll(
        '.business-hours-group');
    const businessHours = [];

    groups.forEach(group => {
      const weekday = group.querySelector('.weekday-select').value;
      const startHour = group.querySelector('.hour-select').value;
      const startMinute = group.querySelector('.minute-select').value;
      const startPeriod = group.querySelector('.period-select').value;
      const endHour = group.querySelectorAll('.hour-select')[1].value;
      const endMinute = group.querySelectorAll('.minute-select')[1].value;
      const endPeriod = group.querySelectorAll('.period-select')[1].value;

      if (weekday && startHour && startMinute && startPeriod &&
          endHour && endMinute && endPeriod) {

        // AM/PM을 24시간 형식으로 변환
        const convertTo24Hour = (hour, minute, period) => {
          let h = parseInt(hour);
          if (period === 'AM' && h === 12) {
            h = 0;
          }
          if (period === 'PM' && h !== 12) {
            h += 12;
          }
          return `${h.toString().padStart(2, '0')}:${minute}`;
        };

        businessHours.push({
          weekday: weekday,
          openTime: convertTo24Hour(startHour, startMinute, startPeriod),
          closeTime: convertTo24Hour(endHour, endMinute, endPeriod)
        });
      }
    });

    return businessHours;
  }

  // 이미지 업로드 및 미리보기 로직 (1개만)
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');

  if (imageUpload && imageInput) {
    imageUpload.addEventListener('click', () => {
      imageInput.click();
    });

    imageInput.addEventListener('change', function (e) {
      const file = e.target.files[0]; // 첫 번째 파일만 사용
      imagePreview.innerHTML = '';

      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const div = document.createElement('div');
          div.className = 'preview-item';
          div.innerHTML = `
            <img src="${e.target.result}" alt="미리보기">
            <button type="button" class="remove-image">×</button>
          `;
          imagePreview.appendChild(div);
        };
        reader.readAsDataURL(file);
      }
    });

    // 이미지 제거 기능 (단순화)
    imagePreview.addEventListener('click', function (e) {
      if (e.target.classList.contains('remove-image')) {
        imageInput.value = ''; // 파일 입력 초기화
        e.target.closest('.preview-item').remove();
      }
    });
  }

  // 기존 이미지 표시 (수정 모드용)
  function displayExistingImage(imagePath) {
    if (!imagePath) {
      return;
    }

    imagePreview.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'preview-item existing-image';
    div.innerHTML = `
      <img src="${rootUrl}/api/common${imagePath}" alt="기존 이미지">
      <button type="button" class="remove-image">×</button>
      <span class="existing-label">기존 이미지</span>
    `;
    imagePreview.appendChild(div);
  }

  // 수정 모드일 때 데이터 불러오기
  if (isEdit) {
    try {
      console.log('=== 수정 데이터 로드 시작 ===');

      const response = await axios.get(`${rootUrl}/api/cafe/${cafeId}/cafeDTO`);
      const data = response.data.cafeDTO;

      console.log('=== 불러온 카페 데이터 ===');
      console.log(data);

      // 기본 정보 설정
      if (cafeNameInput) {
        cafeNameInput.value = data.cafeName || '';
      }
      if (addressInput) {
        addressInput.value = data.address || '';
      }
      if (zipCodeInput) {
        zipCodeInput.value = data.zipCode || '';
      }
      if (detailAddressInput) {
        detailAddressInput.value = data.detailAddress
            || '';
      }
      if (callNumberInput) {
        callNumberInput.value = data.callNumber || '';
      }
      if (introductionInput) {
        introductionInput.value = data.introduction || '';
      }

      // 기존 이미지 표시
      if (data.mainImage) {
        displayExistingImage(data.mainImage);
      }

      // 영업시간 데이터 복원
      if (data.operationTimes && Array.isArray(data.operationTimes)) {
        console.log('=== 영업시간 데이터 복원 ===');
        console.log('operationTimes:', data.operationTimes);

        // 기존 그룹 제거 (있다면)
        businessHoursContainer.innerHTML = '';

        // 각 영업시간 데이터에 대해 그룹 생성
        data.operationTimes.forEach((operationTime, index) => {
          console.log(`영업시간 ${index + 1}:`, operationTime);
          addBusinessHoursGroup(operationTime);
        });
      } else {
        // 영업시간 데이터가 없으면 빈 그룹 하나 추가
        addBusinessHoursGroup();
      }

      // 페이지 제목 변경
      document.title = `카페 수정 - ${data.cafeName}`;

      // 글자 수 카운터 업데이트
      updateCharCount();

      console.log('=== 수정 데이터 로드 완료 ===');

    } catch (error) {
      console.error('=== 수정 데이터 불러오기 실패 ===');
      console.error(error);

      let errorMessage = '카페 정보를 불러올 수 없습니다.';
      if (error.response?.status === 404) {
        errorMessage = '존재하지 않는 카페입니다.';
      } else if (error.response?.status === 403) {
        errorMessage = '카페 정보에 접근할 권한이 없습니다.';
      }

      alert(errorMessage);
      window.location.href = '/';
    }
  }

  // 폼 제출 이벤트
  submitBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    const cafeName = cafeNameInput.value.trim();
    const address = addressInput.value.trim();
    const zipCode = zipCodeInput.value.trim();
    const detailAddress = detailAddressInput.value.trim();
    const callNumber = callNumberInput.value.trim();
    const introduction = introductionInput.value.trim();
    const operationTimes = collectBusinessHours();

    console.log('=== 폼 데이터 확인 ===');
    console.log('모드:', isEdit ? '수정' : '등록');
    console.log('cafeName:', cafeName);
    console.log('address:', address);
    console.log('zipCode:', zipCode);
    console.log('detailAddress:', detailAddress);
    console.log('callNumber:', callNumber);
    console.log('introduction:', introduction);
    console.log('operationTimes:', operationTimes);

    // 유효성 검사
    if (!cafeName) {
      alert('카페 이름을 입력해주세요.');
      return;
    }
    if (!address || !zipCode) {
      alert('주소를 검색해주세요.');
      return;
    }
    if (!detailAddress) {
      alert('상세주소를 입력해주세요.');
      return;
    }
    if (!callNumber) {
      alert('전화번호를 입력해주세요.');
      return;
    }
    if (introduction.length > 301) {
      alert('소개는 301자 이하로 작성해주세요.');
      return;
    }
    if (operationTimes.length === 0) {
      alert('영업시간을 하나 이상 설정해주세요.');
      return;
    }

    // 이미지 검사 (수정 모드에서는 선택사항)
    const files = imageInput.files;
    const hasExistingImage = imagePreview.querySelector('.existing-image');

    if (!isEdit && files.length !== 1) {
      alert('이미지는 1개 업로드가 필수입니다.');
      return;
    }

    try {
      // JSON 데이터 객체 생성
      const requestData = {
        cafeName,
        address,
        zipCode,
        detailAddress,
        callNumber,
        introduction,
        operationTimes
      };

      if (isEdit) {
        requestData.cafeId = cafeId;
      }

      // 새 이미지가 있으면 파일명 추가
      // 새 이미지가 있으면 파일명 추가 (등록/수정 모드별 처리)
      if (files.length > 0) {
        if (isEdit) {
          // 수정 모드: /images/cafe/ 경로 포함
          requestData.mainImage = '/images/cafe/' + files[0].name;
        } else {
          // 등록 모드: 파일명만
          requestData.mainImage = files[0].name;
        }
        console.log('이미지 파일:', requestData.mainImage);
      }

      console.log('=== 전송할 JSON 데이터 ===');
      console.log(requestData);
      console.log(requestData.mainImage);

      const url = isEdit ? `/api/cafe/${cafeId}` : '/api/cafe';
      const method = isEdit ? 'PUT' : 'POST';

      console.log('=== 요청 정보 ===');
      console.log('URL:', rootUrl + url);
      console.log('Method:', method);

      // Axios를 사용한 JSON 전송
      const response = await axios({
        method: method,
        url: rootUrl + url,
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('auth')
        }
      });

      console.log('=== 응답 정보 ===');
      console.log('Status:', response.status);
      console.log('Response Data:', response.data);

      // 성공 처리
      const responseCafeId = isEdit ? cafeId : response.data;
      const successMessage = isEdit ? '카페 정보가 수정되었습니다!' : '카페가 등록되었습니다!';

      alert(successMessage);
      location.href = `/cafe/cafe-detail.html?cafeId=${responseCafeId}`;

    } catch (error) {
      console.error('=== 요청 처리 오류 ===');
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
});