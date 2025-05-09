document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // 切换表单显示
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const formType = btn.dataset.form;
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新表单显示
            forms.forEach(form => form.classList.remove('active'));
            document.getElementById(`${formType}Form`).classList.add('active');
        });
    });

    // 登录表单提交
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // 保存token
                localStorage.setItem('token', data.token);
                // 跳转到友链管理页面
                window.location.href = '/friends.html';
            } else {
                showError(loginForm, data.message);
            }
        } catch (error) {
            showError(loginForm, '登录失败，请稍后重试');
        }
    });

    // 注册表单提交
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 验证密码
        if (password !== confirmPassword) {
            showError(registerForm, '两次输入的密码不一致');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // 保存token
                localStorage.setItem('token', data.token);
                // 跳转到友链管理页面
                window.location.href = '/friends.html';
            } else {
                showError(registerForm, data.message);
            }
        } catch (error) {
            showError(registerForm, '注册失败，请稍后重试');
        }
    });

    // 显示错误信息
    function showError(form, message) {
        // 移除旧的错误信息
        const oldError = form.querySelector('.error-message');
        if (oldError) {
            oldError.remove();
        }

        // 创建新的错误信息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message show';
        errorDiv.textContent = message;
        form.appendChild(errorDiv);

        // 3秒后自动移除错误信息
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}); 