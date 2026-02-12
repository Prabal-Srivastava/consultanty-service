from rest_framework import serializers
from .models import Subject, Course, Enrollment, CourseMaterial
from accounts.serializers import UserSerializer

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ('id', 'name', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')

class CourseMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseMaterial
        fields = ('id', 'title', 'description', 'file', 'video_url', 'order', 'is_published', 'created_at')
        read_only_fields = ('id', 'created_at')

class CourseSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        source='subject', 
        write_only=True
    )
    tutor = UserSerializer(read_only=True)
    materials = serializers.SerializerMethodField()
    enrollment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ('id', 'title', 'subject', 'subject_id', 'tutor', 'fee', 'description', 
                 'duration', 'is_active', 'created_at', 'materials', 'enrollment_count')
        read_only_fields = ('id', 'tutor', 'created_at', 'enrollment_count')
    
    def get_materials(self, obj):
        materials = []
        
        # Add Course Materials
        for item in obj.materials.all():
            material_type = 'video' if item.video_url else 'document'
            materials.append({
                'id': item.id,
                'title': item.title,
                'description': item.description,
                'type': material_type,
                'url': item.video_url if item.video_url else (item.file.url if item.file else ''),
                'created_at': item.created_at
            })
            
        # Add Quizzes
        for quiz in obj.quizzes.filter(is_active=True):
            materials.append({
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'type': 'assignment',
                'url': f'/quizzes/{quiz.id}',
                'created_at': quiz.created_at
            })
            
        # Sort by created_at
        return sorted(materials, key=lambda x: x['created_at'])

    def get_enrollment_count(self, obj):
        return obj.enrollments.filter(is_active=True).count()
    
    def create(self, validated_data):
        validated_data['tutor'] = self.context['request'].user
        return super().create(validated_data)

class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), 
        source='course', 
        write_only=True
    )
    
    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'course', 'course_id', 'enrollment_date', 'is_active', 'progress')
        read_only_fields = ('id', 'student', 'enrollment_date')
    
    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, attrs):
        student = self.context['request'].user
        course = attrs.get('course')
        
        # Check if student is already enrolled
        if Enrollment.objects.filter(student=student, course=course, is_active=True).exists():
            raise serializers.ValidationError("You are already enrolled in this course.")
        
        return attrs

class EnrollmentListSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ('id', 'course', 'enrollment_date', 'is_active', 'progress')