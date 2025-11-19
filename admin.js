class AdminService {
    static async createUser(userData) {
        const response = await fetch(`${API_BASE}/users/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });
        return await response.json();
    }

    static async createGroup(groupData) {
        const response = await fetch(`${API_BASE}/groups/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(groupData)
        });
        return await response.json();
    }

    static async createSubject(subjectData) {
        const response = await fetch(`${API_BASE}/subjects/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(subjectData)
        });
        return await response.json();
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('dashboard_admin.html')) {
        await initializeAdminDashboard();
    }
});

async function initializeAdminDashboard() {
    try {
        const user = await AuthService.getCurrentUser();
        
        if (user.user_type !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        
        document.getElementById('userInfo').textContent = 
            `${user.first_name} ${user.last_name} (Администратор)`;
        
        await loadAdminDashboard();
        await loadUsers();
        await loadGroups();
        await loadSubjects();
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
        window.location.href = 'index.html';
    }
}

async function loadAdminDashboard() {
    // Load statistics
    const users = await fetch(`${API_BASE}/users/`, { credentials: 'include' }).then(r => r.json());
    const groups = await fetch(`${API_BASE}/groups/`, { credentials: 'include' }).then(r => r.json());
    const lessons = await fetch(`${API_BASE}/lessons/`, { credentials: 'include' }).then(r => r.json());
    
    const studentsCount = users.filter(u => u.user_type === 'student').length;
    const teachersCount = users.filter(u => u.user_type === 'teacher').length;
    
    document.getElementById('studentsCount').textContent = studentsCount;
    document.getElementById('teachersCount').textContent = teachersCount;
    document.getElementById('groupsCount').textContent = groups.length;
    document.getElementById('lessonsCount').textContent = lessons.length;
}

async function loadUsers() {
    const users = await fetch(`${API_BASE}/users/`, { credentials: 'include' }).then(r => r.json());
    
    const usersHtml = users.map(user => {
        const badgeClass = {
            'admin': 'bg-danger',
            'teacher': 'bg-warning',
            'student': 'bg-success'
        }[user.user_type] || 'bg-secondary';
        
        const typeText = {
            'admin': 'Администратор',
            'teacher': 'Преподаватель', 
            'student': 'Студент'
        }[user.user_type] || user.user_type;
        
        return `
            <tr>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.username}</td>
                <td><span class="badge ${badgeClass} user-type-badge">${typeText}</span></td>
                <td>${user.phone || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary">Редактировать</button>
                    <button class="btn btn-sm btn-outline-danger">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('usersTable').innerHTML = usersHtml;
}

async function loadGroups() {
    const groups = await fetch(`${API_BASE}/groups/`, { credentials: 'include' }).then(r => r.json());
    const users = await fetch(`${API_BASE}/users/`, { credentials: 'include' }).then(r => r.json());
    
    const groupsHtml = groups.map(group => {
        const studentCount = users.filter(u => u.user_type === 'student').length; // Simplified
        
        return `
            <tr>
                <td>${group.name}</td>
                <td>${new Date(group.created_at).toLocaleDateString()}</td>
                <td>${studentCount}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary">Редактировать</button>
                    <button class="btn btn-sm btn-outline-danger">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('groupsTable').innerHTML = groupsHtml;
}

async function loadSubjects() {
    // Similar implementation for subjects
}