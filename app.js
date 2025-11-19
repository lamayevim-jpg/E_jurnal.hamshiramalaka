const API_BASE = 'http://localhost:8000/api';

class AuthService {
    static async login(username, password) {
        const response = await fetch(`${API_BASE}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Ошибка авторизации');
        }
    }

    static async getCurrentUser() {
        const response = await fetch(`${API_BASE}/current_user/`, {
            credentials: 'include'
        });
        return await response.json();
    }

    static async logout() {
        await fetch(`${API_BASE}/logout/`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/';
    }
}

class UserInterface {
    static showMessage(message, type = 'danger') {
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }

    static redirectToDashboard(userType) {
        switch(userType) {
            case 'admin':
                window.location.href = 'dashboard_admin.html';
                break;
            case 'teacher':
                window.location.href = 'dashboard_teacher.html';
                break;
            case 'student':
                window.location.href = 'dashboard_student.html';
                break;
            default:
                window.location.href = '/';
        }
    }
}

// Обработчик формы входа
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const user = await AuthService.login(username, password);
                UserInterface.redirectToDashboard(user.user_type);
            } catch (error) {
                UserInterface.showMessage(error.message);
            }
        });
    }
});