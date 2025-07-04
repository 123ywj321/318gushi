// 用户界面管理模块
class UIManager {
    constructor() {
        this.currentImageIndex = 0;
        this.searchTimeout = null;
        this.visitedPOIs = new Set();
        this.overviewVisible = true;
    }

    // 初始化UI
    initialize() {
        this.bindEvents();
        this.renderPOIList();
        this.hideLoading();
    }

    // 绑定事件
    bindEvents() {
        // 头部切换按钮
        document.getElementById('headerToggle').addEventListener('click', this.toggleHeader.bind(this));
        
        // 侧边栏切换按钮
        document.getElementById('sidebarToggle').addEventListener('click', this.toggleSidebar.bind(this));
        
        // 搜索功能
        document.getElementById('searchInput').addEventListener('input', this.handleSearch.bind(this));
        
        // 控制按钮
        document.getElementById('routeBtn').addEventListener('click', this.toggleRoute.bind(this));
        document.getElementById('layerBtn').addEventListener('click', this.toggleLayer.bind(this));
        document.getElementById('storyBtn').addEventListener('click', this.showStoryModal.bind(this));
        document.getElementById('fullscreenBtn').addEventListener('click', this.toggleFullscreen.bind(this));
        document.getElementById('infoBtn').addEventListener('click', this.showInfo.bind(this));
        
        // 弹窗关闭
        document.getElementById('modalClose').addEventListener('click', this.closePOIModal.bind(this));
        document.getElementById('poiModal').addEventListener('click', (e) => {
            if (e.target.id === 'poiModal') {
                this.closePOIModal();
            }
        });
        
        // 故事弹窗关闭
        if (document.getElementById('storyModalClose')) {
            document.getElementById('storyModalClose').addEventListener('click', this.closeStoryModal.bind(this));
        }
        if (document.getElementById('storyModal')) {
            document.getElementById('storyModal').addEventListener('click', (e) => {
                if (e.target.id === 'storyModal') {
                    this.closeStoryModal();
                }
            });
        }
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 路段概览卡片点击
        document.querySelectorAll('.overview-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const segment = e.currentTarget.dataset.segment;
                this.hideOverview(segment);
            });
        });
    }

    // 渲染景点列表
    renderPOIList(pois = null) {
        const poiList = document.getElementById('poiList');
        const poisToRender = pois || getAllPOIs();
        
        poiList.innerHTML = '';
        
        poisToRender.forEach(poi => {
            const poiElement = this.createPOIListItem(poi);
            poiList.appendChild(poiElement);
        });
    }

    // 创建景点列表项
    createPOIListItem(poi) {
        const div = document.createElement('div');
        div.className = 'poi-item';
        div.dataset.poiId = poi.id;
        
        div.innerHTML = `
            <h4>${poi.name}</h4>
            <p>${poi.description.substring(0, 50)}...</p>
            <div class="poi-meta">
                <span class="poi-type">${poi.type}</span>
                <span class="poi-distance">${poi.distance}</span>
            </div>
        `;
        
        div.addEventListener('click', () => {
            this.selectPOI(poi);
        });
        
        return div;
    }

    // 选择景点
    selectPOI(poi) {
        // 清除之前的选中状态
        document.querySelectorAll('.poi-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 设置当前选中状态
        const poiElement = document.querySelector(`[data-poi-id="${poi.id}"]`);
        if (poiElement) {
            poiElement.classList.add('active');
        }
        
        // 飞行到景点位置
        window.mapInstance.flyToPOI(poi.id);
    }

    // 搜索功能
    handleSearch(e) {
        const keyword = e.target.value.trim();
        
        // 清除之前的延时
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // 延时搜索，避免频繁查询
        this.searchTimeout = setTimeout(() => {
            const results = searchPOIs(keyword);
            this.renderPOIList(results);
        }, 300);
    }

    // 显示景点详情弹窗
    showPOIModal(poi) {
        this.currentPOI = poi;
        this.currentImageIndex = 0;
        
        // 设置标题和基本信息
        document.getElementById('modalTitle').textContent = poi.name;
        document.getElementById('modalType').textContent = poi.type;
        document.getElementById('modalType').className = 'poi-type';
        document.getElementById('modalDistance').textContent = poi.distance;
        
        // 设置图片轮播
        this.setupImageSlider(poi.images);
        
        // 设置描述
        document.getElementById('modalDescription').innerHTML = `
            <h3>景点介绍</h3>
            <p>${poi.description}</p>
        `;
        
        // 设置故事（如果存在）
        const storyElement = document.getElementById('modalStory');
        if (storyElement && poi.story) {
            storyElement.innerHTML = `
                <h4>📖 传奇故事</h4>
                <p>${poi.story}</p>
                ${poi.legend ? `<blockquote style="margin-top: 15px; padding: 10px; background: rgba(255, 193, 7, 0.1); border-left: 3px solid #FFC107; font-style: italic; color: #FFD54F;">💫 ${poi.legend}</blockquote>` : ''}
            `;
        }
        
        // 设置旅游贴士
        document.getElementById('modalTips').innerHTML = `
            <h4><i class="fas fa-lightbulb"></i> 旅游贴士</h4>
            <ul>
                ${poi.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        `;
        
        // 显示弹窗
        document.getElementById('poiModal').style.display = 'block';
        
        // 添加动画效果
        setTimeout(() => {
            document.querySelector('.poi-modal-content').style.transform = 'scale(1)';
        }, 10);
    }

    // 设置图片轮播
    setupImageSlider(images) {
        const imageContainer = document.getElementById('modalImages');
        
        if (!images || images.length === 0) {
            imageContainer.innerHTML = '<p>暂无图片</p>';
            return;
        }
        
        let sliderHTML = '<div class="image-slider">';
        images.forEach((image, index) => {
            sliderHTML += `<div class="image-slide" style="background-image: url('${image}')"></div>`;
        });
        sliderHTML += '</div>';
        
        // 如果有多张图片，添加导航点
        if (images.length > 1) {
            sliderHTML += '<div class="image-nav">';
            images.forEach((_, index) => {
                sliderHTML += `<span class="image-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`;
            });
            sliderHTML += '</div>';
        }
        
        imageContainer.innerHTML = sliderHTML;
        
        // 绑定导航点击事件
        document.querySelectorAll('.image-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.switchImage(index);
            });
        });
        
        // 自动轮播
        if (images.length > 1) {
            this.startImageSlider();
        }
    }

    // 切换图片
    switchImage(index) {
        if (!this.currentPOI || !this.currentPOI.images) return;
        
        this.currentImageIndex = index;
        const slider = document.querySelector('.image-slider');
        if (slider) {
            slider.style.transform = `translateX(-${index * 100}%)`;
        }
        
        // 更新导航点
        document.querySelectorAll('.image-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    // 开始图片自动轮播
    startImageSlider() {
        if (this.imageSliderInterval) {
            clearInterval(this.imageSliderInterval);
        }
        
        this.imageSliderInterval = setInterval(() => {
            if (!this.currentPOI) return;
            
            const nextIndex = (this.currentImageIndex + 1) % this.currentPOI.images.length;
            this.switchImage(nextIndex);
        }, 4000);
    }

    // 停止图片轮播
    stopImageSlider() {
        if (this.imageSliderInterval) {
            clearInterval(this.imageSliderInterval);
            this.imageSliderInterval = null;
        }
    }

    // 关闭景点详情弹窗
    closePOIModal() {
        this.stopImageSlider();
        document.getElementById('poiModal').style.display = 'none';
        this.currentPOI = null;
    }

    // 切换头部显示
    toggleHeader() {
        const header = document.querySelector('.header');
        const icon = document.querySelector('#headerToggle i');
        
        header.classList.toggle('hidden');
        
        if (header.classList.contains('hidden')) {
            icon.className = 'fas fa-chevron-down';
        } else {
            icon.className = 'fas fa-chevron-up';
        }
    }

    // 切换侧边栏
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('hidden');
    }

    // 切换路线显示
    toggleRoute() {
        const btn = document.getElementById('routeBtn');
        const isVisible = window.mapInstance.toggleRoute();
        
        btn.classList.toggle('active', isVisible);
        
        // 提示信息
        this.showToast(isVisible ? '路线已显示' : '路线已隐藏');
    }

    // 切换地图图层
    toggleLayer() {
        const currentLayer = window.mapInstance.toggleLayer();
        const layerNames = {
            osm: 'OpenStreetMap',
            satellite: '卫星图',
            terrain: '地形图',
            dark: '暗色主题'
        };
        
        this.showToast(`已切换到${layerNames[currentLayer] || '未知图层'}`);
    }

    // 切换全屏
    toggleFullscreen() {
        const btn = document.getElementById('fullscreenBtn');
        const icon = btn.querySelector('i');
        const isFullscreen = window.mapInstance.toggleFullscreen();
        
        if (isFullscreen) {
            icon.className = 'fas fa-compress';
            btn.classList.add('active');
        } else {
            icon.className = 'fas fa-expand';
            btn.classList.remove('active');
        }
    }

    // 显示信息
    showInfo() {
        alert(`318国道沉浸式故事地图\n\n这是一个展示中国318国道沿线美景的交互式地图。\n\n功能介绍：\n• 点击景点标记查看详细信息\n• 使用搜索功能快速找到景点\n• 切换不同的地图图层\n• 显示/隐藏路线\n\n祝您使用愉快！`);
    }

    // 更新进度
    updateProgress(progress) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}% 完成`;
    }

    // 显示提示消息
    showToast(message) {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        
        document.body.appendChild(toast);
        
        // 2秒后移除
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 2000);
    }

    // 处理键盘事件
    handleKeyDown(e) {
        // ESC键关闭弹窗
        if (e.key === 'Escape') {
            this.closePOIModal();
            this.closeStoryModal();
        }
        
        // 空格键切换侧边栏
        if (e.key === ' ' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            this.toggleSidebar();
        }
    }

    // 处理窗口大小变化
    handleResize() {
        // 在移动设备上自动隐藏侧边栏
        if (window.innerWidth < 768) {
            document.getElementById('sidebar').classList.add('hidden');
        }
    }

    // 隐藏加载动画
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 1500);
    }

    // 显示318故事弹窗
    showStoryModal() {
        const storyModal = document.getElementById('storyModal');
        const storyModalBody = document.getElementById('storyModalBody');
        
        if (!storyModal || !storyModalBody) {
            console.error('故事弹窗元素未找到');
            return;
        }
        
        // 获取318传奇故事数据
        const legend = get318Legend();
        
        // 生成故事内容HTML
        let storyContent = `
            <div class="story-intro-section">
                <p class="story-introduction">${legend.mainStory.introduction}</p>
            </div>
        `;
        
        // 添加主要故事章节
        legend.mainStory.chapters.forEach(chapter => {
            storyContent += `
                <div class="story-chapter">
                    <h3>${chapter.title}</h3>
                    ${chapter.content.map(paragraph => `<p>${paragraph}</p>`).join('')}
                </div>
            `;
        });
        
        // 添加路段故事
        storyContent += `<div class="story-chapter">
            <h3>路段传奇</h3>
        `;
        
        legend.segmentStories.forEach(segment => {
            storyContent += `
                <div class="segment-story">
                    <h4>${segment.segment}</h4>
                    <p>${segment.story}</p>
                    <blockquote>${segment.legend}</blockquote>
                </div>
            `;
        });
        
        storyContent += '</div>';
        
        // 添加结尾
        storyContent += `
            <div class="story-chapter">
                <h3>永恒的征程</h3>
                <p>318国道，不只是一条公路，它是一种精神，一种信仰，一种对美好生活的向往。每一个走过这条路的人，都成为了这个传奇的一部分。</p>
                <p class="story-highlight">愿每一位踏上318国道的旅者，都能在这条最美的路上，找到属于自己的故事和答案。</p>
            </div>
        `;
        
        storyModalBody.innerHTML = storyContent;
        
        // 显示弹窗
        storyModal.style.display = 'block';
    }
    
    // 关闭318故事弹窗
    closeStoryModal() {
        const storyModal = document.getElementById('storyModal');
        if (storyModal) {
            storyModal.style.display = 'none';
        }
    }

    // 隐藏路段概览
    hideOverview(segment) {
        if (!this.overviewVisible) return;
        this.overviewVisible = false;

        const overviewContainer = document.getElementById('routeOverview');
        overviewContainer.classList.add('hidden');

        if (segment) {
            window.mapInstance.zoomToSegment(segment);
        }

        // 动画结束后移除，避免遮挡地图事件
        setTimeout(() => {
            overviewContainer.style.display = 'none';
        }, 500);
    }
}

// 添加toast动画样式
const toastStyles = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;

if (!document.getElementById('toast-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'toast-styles';
    styleSheet.textContent = toastStyles;
    document.head.appendChild(styleSheet);
} 