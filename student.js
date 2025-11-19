class StudentService {
    static async getStudentGrades() {
        const response = await fetch(`${API_BASE}/grades/`, {
            credentials: 'include'
        });
        return await response.json();
    }

    static async getStudentAttendance() {
        const response = await fetch(`${API_BASE}/attendance/`, {
            credentials: 'include'
        });
        return await response.json();
    }
}

let currentStudent = null;

// Initialize student dashboard
document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.includes('dashboard_student.html')) {
        await initializeStudentDashboard();
    }
});

async function initializeStudentDashboard() {
    try {
        currentStudent = await AuthService.getCurrentUser();
        
        if (currentStudent.user_type !== 'student') {
            window.location.href = 'index.html';
            return;
        }
        
        document.getElementById('studentInfo').textContent = 
            `${currentStudent.first_name} ${currentStudent.last_name} (Студент)`;
        
        await loadStudentDashboard();
        await loadStudentGrades();
        await loadStudentAttendance();
        await loadStudentSchedule();
        await loadStudentMaterials();
    } catch (error) {
        console.error('Error initializing student dashboard:', error);
        window.location.href = 'index.html';
    }
}

async function loadStudentDashboard() {
    const grades = await StudentService.getStudentGrades();
    const attendance = await StudentService.getStudentAttendance();
    
    // Filter current student's data
    const studentGrades = grades.filter(grade => grade.student === currentStudent.id);
    const studentAttendance = attendance.filter(record => record.student === currentStudent.id);
    
    // Calculate average grade
    const averageGrade = studentGrades.length > 0 ? 
        (studentGrades.reduce((sum, grade) => sum + grade.score, 0) / studentGrades.length).toFixed(1) : 
        '0.0';
    
    // Calculate attendance rate
    const presentCount = studentAttendance.filter(record => record.status === 'present').length;
    const attendanceRate = studentAttendance.length > 0 ? 
        Math.round((presentCount / studentAttendance.length) * 100) : 
        0;
    
    // Update dashboard stats
    document.getElementById('averageGrade').textContent = averageGrade;
    document.getElementById('attendanceRate').textContent = attendanceRate + '%';
    document.getElementById('completedLessons').textContent = studentAttendance.length;
    
    // Load upcoming lessons (simplified)
    const lessonsResponse = await fetch(`${API_BASE}/lessons/`, { credentials: 'include' });
    const allLessons = await lessonsResponse.json();
    const now = new Date();
    
    const upcomingLessons = allLessons
        .filter(lesson => new Date(lesson.date) > now)
        .slice(0, 3)
        .map(lesson => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <strong>${lesson.subject_name}</strong><br>
                    <small>${new Date(lesson.date).toLocaleDateString()} • ${lesson.teacher_name}</small>
                </div>
            </div>
        `).join('') || '<p>Нет предстоящих занятий</p>';
    
    document.getElementById('studentUpcomingLessons').innerHTML = upcomingLessons;
    
    // Load recent grades
    const recentGrades = studentGrades
        .slice(-3)
        .reverse()
        .map(grade => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <strong>${grade.lesson_title}</strong><br>
                    <small>${new Date(grade.lesson?.date).toLocaleDateString()}</small>
                </div>
                <span class="badge bg-${grade.score >= 4 ? 'success' : grade.score === 3 ? 'warning' : 'danger'}">
                    ${grade.score}
                </span>
            </div>
        `).join('') || '<p>Нет оценок</p>';
    
    document.getElementById('recentGrades').innerHTML = recentGrades;
}

async function loadStudentGrades() {
    const grades = await StudentService.getStudentGrades();
    const studentGrades = grades.filter(grade => grade.student === currentStudent.id);
    
    const gradesHtml = studentGrades.map(grade => `
        <tr>
            <td>${grade.lesson_title?.split(' - ')[0] || 'Не указан'}</td>
            <td>${grade.lesson_title || 'Без темы'}</td>
            <td>${grade.lesson?.date ? new Date(grade.lesson.date).toLocaleDateString() : 'Не указана'}</td>
            <td>
                <span class="badge bg-${grade.score >= 4 ? 'success' : grade.score === 3 ? 'warning' : 'danger'}">
                    ${grade.score}
                </span>
            </td>
            <td>${grade.lesson?.teacher_name || 'Не указан'}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-center">Оценок пока нет</td></tr>';
    
    document.getElementById('gradesTable').innerHTML = gradesHtml;
}

async function loadStudentAttendance() {
    const attendance = await StudentService.getStudentAttendance();
    const studentAttendance = attendance.filter(record => record.student === currentStudent.id);
    
    // Get lessons for attendance records
    const lessonsResponse = await fetch(`${API_BASE}/lessons/`, { credentials: 'include' });
    const lessons = await lessonsResponse.json();
    
    const attendanceHtml = studentAttendance.map(record => {
        const lesson = lessons.find(l => l.id === record.lesson);
        const statusClass = {
            'present': 'attendance-present',
            'absent': 'attendance-absent', 
            'late': 'attendance-late'
        }[record.status] || '';
        
        const statusText = {
            'present': 'Присутствовал',
            'absent': 'Отсутствовал',
            'late': 'Опоздал'
        }[record.status] || record.status;
        
        return `
            <tr>
                <td>${lesson?.date ? new Date(lesson.date).toLocaleDateString() : 'Не указана'}</td>
                <td>${lesson?.subject_name || 'Не указан'}</td>
                <td>${lesson?.title || 'Без темы'}</td>
                <td class="${statusClass}">${statusText}</td>
                <td>${record.notes || '-'}</td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" class="text-center">Записей о посещаемости пока нет</td></tr>';
    
    document.getElementById('attendanceTable').innerHTML = attendanceHtml;
}

async function loadStudentSchedule() {
    const response = await fetch(`${API_BASE}/lessons/`, { credentials: 'include' });
    const allLessons = await response.json();
    
    // In real app, filter by student's group
    const studentLessons = allLessons; // Simplified
    
    const scheduleHtml = studentLessons.map(lesson => `
        <tr>
            <td>${new Date(lesson.date).toLocaleString()}</td>
            <td>${lesson.subject_name}</td>
            <td>${lesson.teacher_name}</td>
            <td>${lesson.title}</td>
            <td>
                ${lesson.media_url ? 
                    `<a href="${lesson.media_url}" target="_blank" class="btn btn-sm btn-outline-primary">Скачать</a>` : 
                    'Нет материалов'
                }
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-center">Занятий не найдено</td></tr>';
    
    document.getElementById('scheduleTable').innerHTML = scheduleHtml;
}

async function loadStudentMaterials() {
    const response = await fetch(`${API_BASE}/lessons/`, { credentials: 'include' });
    const lessons = await response.json();
    
    const materials = lessons.filter(lesson => lesson.media_url);
    
    const materialsHtml = materials.map(lesson => `
        <div class="col-md-4 mb-3">
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${lesson.subject_name}</h6>
                    <p class="card-text">${lesson.title}</p>
                    <a href="${lesson.media_url}" target="_blank" class="btn btn-primary btn-sm">
                        📎 Открыть материалы
                    </a>
                </div>
            </div>
        </div>
    `).join('') || '<div class="col-12"><p>Учебные материалы пока не добавлены</p></div>';
    
    document.getElementById('materialsGrid').innerHTML = materialsHtml;
}