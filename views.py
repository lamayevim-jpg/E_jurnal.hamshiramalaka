from django.contrib.auth import login, logout
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User, Group, Subject, Lesson, Grade, Attendance
from .serializers import *

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        return Response(UserSerializer(user).data)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out successfully'})

@api_view(['GET'])
def current_user(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    return Response({'error': 'Not authenticated'}, status=401)

# User management
@api_view(['GET'])
def user_list(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def user_create(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(request.data.get('password', 'defaultpassword'))
        user.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# Group management
@api_view(['GET'])
def group_list(request):
    groups = Group.objects.all()
    serializer = GroupSerializer(groups, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def group_create(request):
    serializer = GroupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# Subject management
@api_view(['GET'])
def subject_list(request):
    subjects = Subject.objects.all()
    serializer = SubjectSerializer(subjects, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def subject_create(request):
    serializer = SubjectSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# Lesson management
@api_view(['GET'])
def lesson_list(request):
    lessons = Lesson.objects.all()
    serializer = LessonSerializer(lessons, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def lesson_create(request):
    serializer = LessonSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# Grade management
@api_view(['GET'])
def grade_list(request):
    grades = Grade.objects.all()
    serializer = GradeSerializer(grades, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def grade_update(request):
    student_id = request.data.get('student_id')
    lesson_id = request.data.get('lesson_id')
    score = request.data.get('score')
    
    grade, created = Grade.objects.update_or_create(
        student_id=student_id,
        lesson_id=lesson_id,
        defaults={'score': score}
    )
    serializer = GradeSerializer(grade)
    return Response(serializer.data)

# Attendance management
@api_view(['GET'])
def attendance_list(request):
    attendance = Attendance.objects.all()
    serializer = AttendanceSerializer(attendance, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def attendance_update(request):
    student_id = request.data.get('student_id')
    lesson_id = request.data.get('lesson_id')
    status = request.data.get('status')
    
    attendance, created = Attendance.objects.update_or_create(
        student_id=student_id,
        lesson_id=lesson_id,
        defaults={'status': status}
    )
    serializer = AttendanceSerializer(attendance)
    return Response(serializer.data)