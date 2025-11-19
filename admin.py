from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Group, Subject, Lesson, Grade, Attendance

admin.site.register(User, UserAdmin)
admin.site.register(Group)
admin.site.register(Subject)
admin.site.register(Lesson)
admin.site.register(Grade)
admin.site.register(Attendance)