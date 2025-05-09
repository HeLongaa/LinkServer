// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// DOM元素
const friendForm = document.getElementById('friendForm');
const friendsList = document.getElementById('friendsList');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');
const imagePreviewModal = document.getElementById('imagePreviewModal');
const previewImageElement = document.getElementById('previewImage');
const closeModal = document.querySelector('.close-modal');
const avatarPreview = document.getElementById('avatarPreview');
const submitButton = document.getElementById('submitButton');
const cancelButton = document.getElementById('cancelButton');

// 状态变量
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let isEditing = false;

// 显示加载动画
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// 隐藏加载动画
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// 显示提示框
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.style.backgroundColor = type === 'success' ? '#2c3e50' : '#e74c3c';
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// 加载友链列表
async function loadFriends() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/friends/list?page=${currentPage}&search=${currentSearch}`);
        const data = await response.json();
        
        if (data.success) {
            displayFriends(data.data);
            updatePagination(data.pagination);
        } else {
            showToast('加载友链列表失败', 'error');
        }
    } catch (error) {
        showToast('加载友链列表失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// 显示友链列表
function displayFriends(friends) {
    friendsList.innerHTML = '';
    
    friends.forEach(friend => {
        const friendCard = document.createElement('div');
        friendCard.className = 'friend-card';
        
        friendCard.innerHTML = `
            <div class="friend-actions">
                <button onclick="window.editFriend(${friend.id})" title="编辑"><i class="fas fa-edit"></i></button>
                <button onclick="window.deleteFriend(${friend.id})" title="删除"><i class="fas fa-trash"></i></button>
            </div>
            <img src="${friend.avatar}" alt="${friend.name}" class="friend-avatar" onclick="window.previewImage('${friend.avatar}')">
            <div class="friend-content">
                <div class="friend-name">${friend.name}</div>
                <a href="${friend.link}" target="_blank" class="friend-link">${friend.link}</a>
                <div class="friend-descr">${friend.descr || ''}</div>
            </div>
        `;
        
        friendsList.appendChild(friendCard);
    });
}

// 更新分页信息
function updatePagination(pagination) {
    totalPages = pagination.totalPages;
    currentPage = pagination.page;
    pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
}

// 添加新友链
async function addFriend(friendData) {
    showLoading();
    try {
        console.log('Sending friend data:', friendData); // 调试日志
        const response = await fetch(`${API_BASE_URL}/friends/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(friendData)
        });
        
        const data = await response.json();
        console.log('Server response:', data); // 调试日志
        
        if (data.success) {
            showToast('友链添加成功');
            resetForm();
            loadFriends();
        } else {
            showToast(data.message || '添加友链失败', 'error');
        }
    } catch (error) {
        console.error('Error adding friend:', error); // 调试日志
        showToast('添加友链失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// 更新友链
async function updateFriend(id, friendData) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/friends/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(friendData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('友链更新成功');
            resetForm();
            loadFriends();
        } else {
            showToast(data.message || '更新友链失败', 'error');
        }
    } catch (error) {
        showToast('更新友链失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// 删除友链
async function deleteFriend(id) {
    if (!confirm('确定要删除这个友链吗？')) {
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/friends/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('友链删除成功');
            loadFriends();
        } else {
            showToast(data.message || '删除友链失败', 'error');
        }
    } catch (error) {
        showToast('删除友链失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// 编辑友链
async function editFriend(id) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/friends/list`);
        const data = await response.json();
        
        if (data.success) {
            const friend = data.data.find(f => f.id === id);
            if (friend) {
                document.getElementById('friendId').value = friend.id;
                document.getElementById('name').value = friend.name;
                document.getElementById('link').value = friend.link;
                document.getElementById('avatar').value = friend.avatar;
                document.getElementById('descr').value = friend.descr || '';
                
                submitButton.textContent = '更新友链';
                cancelButton.style.display = 'block';
                isEditing = true;
                
                // 显示头像预览
                avatarPreview.style.display = 'block';
                avatarPreview.style.backgroundImage = `url(${friend.avatar})`;
            }
        }
    } catch (error) {
        showToast('加载友链信息失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// 重置表单
function resetForm() {
    friendForm.reset();
    document.getElementById('friendId').value = '';
    submitButton.textContent = '添加友链';
    cancelButton.style.display = 'none';
    avatarPreview.style.display = 'none';
    isEditing = false;
}

// 预览图片
function previewImage(src) {
    previewImageElement.src = src;
    imagePreviewModal.style.display = 'block';
}

// 事件监听器
friendForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        link: document.getElementById('link').value.trim(),
        avatar: document.getElementById('avatar').value.trim(),
        descr: document.getElementById('descr').value.trim()
    };
    
    // 验证表单数据
    if (!formData.name || !formData.link || !formData.avatar) {
        showToast('请填写所有必填字段', 'error');
        return;
    }
    
    const friendId = document.getElementById('friendId').value;
    
    if (isEditing && friendId) {
        await updateFriend(friendId, formData);
    } else {
        await addFriend(formData);
    }
});

// 头像预览
document.getElementById('avatar').addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
        avatarPreview.style.display = 'block';
        avatarPreview.style.backgroundImage = `url(${url})`;
    } else {
        avatarPreview.style.display = 'none';
    }
});

// 搜索功能
searchButton.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadFriends();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        loadFriends();
    }
});

// 分页功能
prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadFriends();
    }
});

nextPageButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadFriends();
    }
});

// 取消编辑
cancelButton.addEventListener('click', resetForm);

// 关闭图片预览
closeModal.addEventListener('click', () => {
    imagePreviewModal.style.display = 'none';
});

// 点击模态框外部关闭
imagePreviewModal.addEventListener('click', (e) => {
    if (e.target === imagePreviewModal) {
        imagePreviewModal.style.display = 'none';
    }
});

// 将函数暴露到全局作用域
window.previewImage = previewImage;
window.editFriend = editFriend;
window.deleteFriend = deleteFriend;

// 页面加载时获取友链列表
document.addEventListener('DOMContentLoaded', loadFriends); 