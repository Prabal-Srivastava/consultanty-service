from rest_framework import serializers
from .models import ConsultancyService, Organization, ConsultancyContract, StudentEnrollment, ConsultancyReport, ConsultancySession, SuccessStory, FAQ
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type']
        read_only_fields = ['id', 'username']

class ConsultancySessionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    consultant = UserSerializer(read_only=True)
    consultant_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), # Assuming tutors/consultants are Users
        source='consultant',
        write_only=True
    )
    
    class Meta:
        model = ConsultancySession
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'student', 'report', 'solution_notes']
        
    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)

class ConsultancyServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultancyService
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class ConsultancyContractSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        source='organization',
        write_only=True
    )
    service = ConsultancyServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=ConsultancyService.objects.all(),
        source='service',
        write_only=True
    )
    admin_user = UserSerializer(read_only=True)
    remaining_amount = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = ConsultancyContract
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'admin_user', 'remaining_amount', 'progress_percentage']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add organization and service details in representation
        data['organization'] = OrganizationSerializer(instance.organization).data
        data['service'] = ConsultancyServiceSerializer(instance.service).data
        data['admin_user'] = UserSerializer(instance.admin_user).data
        return data

class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    contract = ConsultancyContractSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(user_type='student'),
        source='student',
        write_only=True
    )
    contract_id = serializers.PrimaryKeyRelatedField(
        queryset=ConsultancyContract.objects.all(),
        source='contract',
        write_only=True
    )
    
    class Meta:
        model = StudentEnrollment
        fields = '__all__'
        read_only_fields = ['enrollment_date']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['student'] = UserSerializer(instance.student).data
        data['contract'] = ConsultancyContractSerializer(instance.contract).data
        return data

class ConsultancyReportSerializer(serializers.ModelSerializer):
    contract = ConsultancyContractSerializer(read_only=True)
    contract_id = serializers.PrimaryKeyRelatedField(
        queryset=ConsultancyContract.objects.all(),
        source='contract',
        write_only=True
    )
    
    class Meta:
        model = ConsultancyReport
        fields = '__all__'
        read_only_fields = ['created_at']

class SuccessStorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SuccessStory
        fields = '__all__'

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'