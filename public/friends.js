document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // 获取DOM元素
    const userEmail = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const friendsList = document.getElementById('friendsList');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const friendModal = document.getElementById('friendModal');
    const friendForm = document.getElementById('friendForm');
    const modalTitle = document.getElementById('modalTitle');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const toast = document.getElementById('toast');

    // 状态变量
    let currentPage = 1;
    let totalPages = 1;
    let searchQuery = '';
    let editingFriendId = null;

    // 初始化
    loadFriends();
    loadUserInfo();

    // 加载用户信息
    async function loadUserInfo() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                userEmail.textContent = data.data.email;
            } else {
                console.error('加载用户信息失败:', data.message);
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
    }

    // 加载友链列表
    async function loadFriends() {
        showLoading();
        try {
            const response = await fetch(`/api/friends/list?page=${currentPage}&search=${searchQuery}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                renderFriends(data.data);
                updatePagination(data.pagination);
            } else {
                showToast(data.message);
            }
        } catch (error) {
            showToast('加载友链列表失败');
        } finally {
            hideLoading();
        }
    }

    // 渲染友链列表
    function renderFriends(data) {
        friendsList.innerHTML = '';
        if (!data || !data.list || data.list.length === 0) {
            friendsList.innerHTML = '<div class="no-data">暂无友链数据</div>';
            return;
        }

        data.list.forEach(friend => {
            const friendCard = document.createElement('div');
            friendCard.className = 'friend-card';
            friendCard.innerHTML = `
                <div class="friend-header">
                    <img src="${friend.avatar}" alt="${friend.name}" class="friend-avatar" onerror="this.src='/default-avatar.png'">
                    <div>
                        <h3 class="friend-name">${friend.name}</h3>
                        <a href="${friend.link}" target="_blank" class="friend-link">${friend.link}</a>
                    </div>
                </div>
                <p class="friend-descr">${friend.descr || ''}</p>
                <div class="friend-actions">
                    <button class="action-btn edit-btn" data-id="${friend.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${friend.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // 添加编辑和删除事件监听器
            const editBtn = friendCard.querySelector('.edit-btn');
            const deleteBtn = friendCard.querySelector('.delete-btn');

            editBtn.addEventListener('click', () => openEditModal(friend));
            deleteBtn.addEventListener('click', () => deleteFriend(friend.id));

            friendsList.appendChild(friendCard);
        });
    }

    // 更新分页信息
    function updatePagination(pagination) {
        if (!pagination) return;

        currentPage = pagination.currentPage;
        totalPages = pagination.totalPages;

        // 更新页码显示
        pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;

        // 更新按钮状态
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    // 编辑友链
    async function editFriend(id) {
        editingFriendId = id;
        showLoading();
        try {
            const response = await fetch(`/api/friends/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok && data.success) {
                document.getElementById('name').value = data.data.name;
                document.getElementById('link').value = data.data.link;
                document.getElementById('avatar').value = data.data.avatar;
                document.getElementById('descr').value = data.data.descr || '';
                document.getElementById('friendId').value = id;
                modalTitle.textContent = '编辑友链';
                document.getElementById('avatarPreview').innerHTML = `<img src="${data.data.avatar}" alt="头像预览" style="width:80px;height:80px;border-radius:50%;border:2px solid #eee;object-fit:cover;" onerror="this.style.display='none'">`;
                showModal();
            } else {
                showToast(data.message || '加载友链信息失败');
            }
        } catch (error) {
            showToast('加载友链信息失败');
        } finally {
            hideLoading();
        }
    }

    // 打开编辑模态框
    function openEditModal(friend) {
        modalTitle.textContent = '编辑友链';
        editingFriendId = friend.id;

        // 填充表单数据
        document.getElementById('name').value = friend.name;
        document.getElementById('link').value = friend.link;
        document.getElementById('avatar').value = friend.avatar;
        document.getElementById('descr').value = friend.descr || '';

        // 显示头像预览
        const preview = document.getElementById('avatarPreview');
        preview.innerHTML = `<img src="${friend.avatar}" alt="头像预览" style="width:80px;height:80px;border-radius:50%;border:2px solid #eee;object-fit:cover;" onerror="this.style.display='none'">`;

        showModal();
    }

    // 打开添加模态框
    addFriendBtn.addEventListener('click', () => {
        modalTitle.textContent = '添加友链';
        editingFriendId = null;
        friendForm.reset();
        document.getElementById('avatarPreview').innerHTML = '';
        showModal();
    });

    // 显示模态框
    function showModal() {
        friendModal.style.display = 'flex';
    }

    // 隐藏模态框
    function hideModal() {
        friendModal.style.display = 'none';
        friendForm.reset();
        editingFriendId = null;
        document.getElementById('avatarPreview').innerHTML = '';
    }

    // 关闭模态框事件
    closeBtn.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);
    friendModal.addEventListener('click', (e) => {
        if (e.target === friendModal) {
            hideModal();
        }
    });

    // 头像预览
    document.getElementById('avatar').addEventListener('input', (e) => {
        const preview = document.getElementById('avatarPreview');
        preview.innerHTML = `<img src="${e.target.value}" alt="头像预览" style="width:80px;height:80px;border-radius:50%;border:2px solid #eee;object-fit:cover;" onerror="this.style.display='none'">`;
    });

    // 删除友链
    async function deleteFriend(id) {
        if (!confirm('确定要删除这个友链吗？')) return;

        showLoading();
        try {
            const response = await fetch(`/api/friends/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                showToast('删除成功');
                loadFriends();
            } else {
                showToast(data.message);
            }
        } catch (error) {
            showToast('删除失败');
        } finally {
            hideLoading();
        }
    }

    // 提交表单
    friendForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            link: document.getElementById('link').value,
            avatar: document.getElementById('avatar').value,
            descr: document.getElementById('descr').value
        };

        showLoading();
        try {
            const url = editingFriendId
                ? `/api/friends/${editingFriendId}`
                : '/api/friends/add';

            const response = await fetch(url, {
                method: editingFriendId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showToast(editingFriendId ? '更新成功' : '添加成功');
                hideModal();
                loadFriends();
            } else {
                showToast(data.message);
            }
        } catch (error) {
            showToast(editingFriendId ? '更新失败' : '添加失败');
        } finally {
            hideLoading();
        }
    });

    // 搜索功能
    searchBtn.addEventListener('click', () => {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        loadFriends();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // 分页按钮事件
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadFriends();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadFriends();
        }
    });

    // 退出登录
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    // 工具函数
    function showLoading() {
        loadingOverlay.classList.add('active');
    }

    function hideLoading() {
        loadingOverlay.classList.remove('active');
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});