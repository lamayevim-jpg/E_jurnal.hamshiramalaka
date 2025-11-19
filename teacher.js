class TeacherService {
    static async getTeacherLessons() {
        const response = await fetch(`${API_BASE}/lessons/`, {
            credentials: 'include'
        });
        return await response.json();
    }

    static async createLesson(lessonData) {
        const response = await fetch(`${API_BASE}/lessons/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(lessonData)
        });
        return await response.json();
    }

    static async getAttendance(lessonId) {
        const response = await fetch(`${API_BASE}/attendance/?lesson_id=${lessonId}`, {
            credentials: 'include'
        });
        return await response.json();
    }

    static async updateAttendance(attendanceData) {
        const response = await fetch(`${API_BASE}/attendance/update/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(attendanceData)
        });
        return await response.json();
    }

    static async updateGrade(gradeData) {
        const response = await fetch(`${API_BASE}/grades/update/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(gradeData)
        });
        return await response.json();
    }
}

let currentUser = null;
let currentLessonForAttendance = null;

// Initialize teacher dashboard
document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('dashboard_teacher.html')) {
        await initializeTeacherDashboard();
    }
});

async function initializeTeacherDashboard() {
    try {
        currentUser = await AuthService.getCurrentUser();
        document.getElementById('teacherInfo').textContent = 
            `${currentUser.first_name} ${currentUser.last_name} (Преподаватель)`;
        
        await loadTeacherDashboard();
        await loadTeacherLessons();
        await loadLessonFilters();
    } catch (error) {
        console.error('Error initializing teacher dashboard:', error);
        window.location.href = 'index.html';
    }
}

async function loadTeacherDashboard() {
    // Load statistics and upcoming lessons
    const lessons = await TeacherService.getTeacherLessons();
    const teacherLessons = lessons.filter(lesson => lesson.teacher === currentUser.id);
    
    document.getElementById('teacherLessonsCount').textContent = teacherLessons.length;
    
    // Load upcoming lessons (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcoming = teacherLessons.filter(lesson => {
        const lessonDate = new Date(lesson.date);
        return lessonDate >= now && lessonDate <= nextWeek;
    }).slice(0, 5);
    
    const upcomingHtml = upcoming.map(lesson => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <strong>${lesson.subject_name}</strong><br>
                <small>${lesson.group_name} • ${new Date(lesson.date).toLocaleDateString()}</small>
            </div>
            <button class="btn btn-sm btn-outline-primary" onclick="loadAttendanceForLesson(${lesson.id})">
                Отметить
            </button>
        </div>
    `).join('') || '<p>Нет предстоящих занятий</p>';
    
    document.getElementById('upcomingLessons').innerHTML = upcomingHtml;
}

async function loadTeacherLessons() {
    const lessons = await TeacherService.getTeacherLessons();
    const teacherLessons = lessons.filter(lesson => lesson.teacher === currentUser.id);
    
    const lessonsHtml = teacherLessons.map(lesson => `
        <tr>
            <td>${new Date(lesson.date).toLocaleDateString()}</td>
            <td>${lesson.subject_name}</td>
            <td>${lesson.group_name}</td>
            <td>${lesson.title}</td>
            <td>
                ${lesson.media_url ? 
                    `<a href="${lesson.media_url}" target="_blank" class="btn btn-sm btn-outline-primary">📎</a>` : 
                    'Нет'
                }
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="loadAttendanceForLesson(${lesson.id})">
                    Посещаемость
                </button>
                <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})">
                    Редактировать
                </button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('teacherLessonsTable').innerHTML = lessonsHtml;
}

async function loadLessonFilters() {
    // Load groups and subjects for filters
    const groupsResponse = await fetch(`${API_BASE}/groups/`, { credentials: 'include' });
    const groups = await groupsResponse.json();
    
    const subjectsResponse = await fetch(`${API_BASE}/subjects/`, { credentials: 'include' });
    const subjects = await subjectsResponse.json();
    
    // Populate filter dropdowns
    const groupFilter = document.getElementById('lessonGroupFilter');
    const subjectFilter = document.getElementById('lessonSubjectFilter');
    const lessonGroup = document.getElementById('lessonGroup');
    const lessonSubject = document.getElementById('lessonSubject');
    
    groups.forEach(group => {
        groupFilter.innerHTML += `<option value="${group.id}">${group.name}</option>`;
        lessonGroup.innerHTML += `<option value="${group.id}">${group.name}</option>`;
    });
    
    subjects.forEach(subject => {
        subjectFilter.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
        lessonSubject.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
    });
}

async function createLesson() {
    const lessonData = {
        title: document.getElementById('lessonTitle').value,
        subject: document.getElementById('lessonSubject').value,
        teacher: currentUser.id,
        group: document.getElementById('lessonGroup').value,
        date: document.getElementById('lessonDate').value,
        plan: document.getElementById('lessonPlan').value,
        media_url: document.getElementById('lessonMedia').value
    };
    
    try {
        await TeacherService.createLesson(lessonData);
        $('#addLessonModal').modal('hide');
        await loadTeacherLessons();
        await loadTeacherDashboard();
        
        // Reset form
        document.getElementById('addLessonForm').reset();
    } catch (error) {
        alert('Ошибка при создании занятия: ' + error.message);
    }
}

async function loadAttendanceForLesson(lessonId) {
    currentLessonForAttendance = lessonId;
    
    // Show attendance section
    document.getElementById('attendanceSection').style.display = 'block';
    
    // Load students for this lesson's group
    const lessons = await TeacherService.getTeacherLessons();
    const currentLesson = lessons.find(lesson => lesson.id === lessonId);
    
    if (!currentLesson) return;
    
    // Load all users to find students in this group
    const usersResponse = await fetch(`${API_BASE}/users/`, { credentials: 'include' });
    const users = await usersResponse.json();
    
    const students = users.filter(user => 
        user.user_type === 'student' 
        // In real app, you'd have group assignment logic here
    );
    
    const attendanceHtml = students.map(student => `
        <tr>
            <td>${student.first_name} ${student.last_name}</td>
            <td>
                <select class="form-select attendance-status" data-student="${student.id}">
                    <option value="present">Присутствовал</option>
                    <option value="absent">Отсутствовал</option>
                    <option value="late">Опоздал</option>
                </select>
            </td>
            <td>
                <input type="number" class="form-control grade-input" 
                       data-student="${student.id}" placeholder="Оценка" min="2" max="5">
            </td>
        </tr>
    `).join('');
    
    document.getElementById('attendanceTable').innerHTML = attendanceHtml;
    showTab('attendance');
}

async function saveAttendance() {
    const statusSelects = document.querySelectorAll('.attendance-status');
    const gradeInputs = document.querySelectorAll('.grade-input');
    
    for (const select of statusSelects) {
        const studentId = select.dataset.student;
        const status = select.value;
        
        await TeacherService.updateAttendance({
            student_id: studentId,
            lesson_id: currentLessonForAttendance,
            status: status
        });
    }
    
    for (const input of gradeInputs) {
        const studentId = input.dataset.student;
        const score = input.value;
        
        if (score) {
            await TeacherService.updateGrade({
                student_id: studentId,
                lesson_id: currentLessonForAttendance,
                score: parseInt(score)
            });
        }
    }
    
    alert('Данные сохранены успешно!');
}

function showTab(tabName) {
    const tab = document.querySelector(`[href="#${tabName}"]`);
    if (tab) {
        bootstrap.Tab.getOrCreateInstance(tab).show();
    }
}