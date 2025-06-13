import api, { loadLayout } from '/common/common.js';
window.addEventListener('DOMContentLoaded', () => {
    loadLayout();
});
(() => {
    const mapContainer = document.getElementById('map');
    const mapOption = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 6,
        draggable: false,
        zoomable: false
    };
    const map = new kakao.maps.Map(mapContainer, mapOption);
    map.setMinLevel(5);
    map.setMaxLevel(5);

    const geocoder = new kakao.maps.services.Geocoder();

    geocoder.addressSearch('서울특별시 성동구 성수일로 56', (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

            const beanOverlay = new kakao.maps.CustomOverlay({
                position: coords,
                yAnchor: 1,
                zIndex: 2
            });
            beanOverlay.setMap(map);

            map.setCenter(coords);

            const illustration = new kakao.maps.CustomOverlay({
                position: coords,
                content: '<img src="/images/common/SeongsuBean.png" width="1200" height="500" style="pointer-events: none;">',
                xAnchor: 0.5,
                yAnchor: 0.5,
                zIndex: 0
            });
            illustration.setMap(map);
        }
    });

    let markers = [];
    function clearMarkers() {
        markers.forEach(m => m.setMap(null));
        markers = [];
    }

    function addMarkerByAddress(address) {
        geocoder.addressSearch(address, (result, status) => {
            if (status === kakao.maps.services.Status.OK && result[0]) {
                const {y: lat, x: lng} = result[0];
                const pos = new kakao.maps.LatLng(lat, lng);

                const marker = new kakao.maps.Marker({
                    map: map,
                    position: pos
                });
                markers.push(marker);
            }
        });
    }

    function fetchTop5() {
        axios.get('/api/search/top5')
            .then(res => {
                clearMarkers();
                res.data.forEach(addr => addMarkerByAddress(addr));
            })
            .catch(console.error);
    }

    function fetchCafeAddresses(menuName) {
        axios.get('/api/search-by-menu', {
            params: { menuName }
        })
            .then(res => {
                const addressList = res.data;
                if (!Array.isArray(addressList)) return;
                clearMarkers();
                addressList.forEach(addr => {
                    const addrs = Array.isArray(addr) ? addr : [addr];
                    addrs.forEach(a => addMarkerByAddress(a));
                });
            })
            .catch(console.error);
    }

    document.getElementById('crownBtn').addEventListener('click', fetchTop5);

    document.querySelectorAll('#filterIcons .filter-icon-img')
        .forEach(img => {
            img.addEventListener('click', () => {
                const menuName = img.dataset.menu;
                clearMarkers();
                fetchCafeAddresses(menuName);
            });
        });

    const ROW_SIZE = 4;
    let currentIndex = 0;
    let cafes = [];

    const wrapper = document.getElementById('cards-wrapper');
    const btn = document.getElementById('load-more');

    axios.get('/api/main/cards')
        .then(res => {
            cafes = res.data;
            btn.style.display = cafes.length > ROW_SIZE ? 'block' : 'none';
            renderRow();
            btn.addEventListener('click', renderRow);
        })
        .catch(err => console.error('메인 카드 로딩 실패', err));

    function renderRow() {
        if (currentIndex >= cafes.length) {
            btn.style.display = 'none';
            return;
        }

        const row = document.createElement('div');
        row.className = 'card-row';

        const slice = cafes.slice(currentIndex, currentIndex + ROW_SIZE);
        slice.forEach(cafe => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.cafeId = cafe.cafeId;
            card.innerHTML = `
        <img src="${cafe.mainImage}" alt="${cafe.cafeName}">
        <div class="info">
            <h4>${cafe.cafeName}</h4>
            <p>${cafe.introduction || ''}</p>
        </div>
      `;
            card.addEventListener('click', () => {
                const cafeId = card.dataset.cafeId;
                window.location.href = `/cafe/${cafeId}`;
            });
            row.appendChild(card);
        });

        wrapper.appendChild(row);
        currentIndex += ROW_SIZE;

        if (currentIndex >= cafes.length) {
            btn.style.display = 'none';
        }
    }

    function searchByKeyword(keyword) {
        axios.get('/api/search', {
            params: { keyword }
        })
            .then(res => {
                const addressList = res.data;
                if (!Array.isArray(addressList) || addressList.length === 0) {
                    alert('검색 결과가 없습니다.');
                    return;
                }
                clearMarkers();
                addressList.forEach(addr => addMarkerByAddress(addr));
            })
            .catch(err => {
                console.error('[searchByKeyword] 에러:', err);
                alert('검색 중 오류가 발생했습니다.');
            });
    }

    const input = document.getElementById('searchInput');
    const searchbtn = document.getElementById('searchBtn');

    searchbtn.addEventListener('click', () => {
        const keyword = input.value.trim();
        if (keyword) searchByKeyword(keyword);
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const keyword = input.value.trim();
            if (keyword) searchByKeyword(keyword);
        }
    });

    const registerBtn = document.getElementById('cafe-registration');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            window.location.href = '/cafe-registration';
        });
    }
})();
