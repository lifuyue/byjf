from rest_framework import serializers
from .models import (
    Student, SubjectScore, 
    AcademicExpertise, ComprehensivePerformance,
    A_SCORE_MAX, B_SCORE_MAX, C_SCORE_MAX
)

class AcademicExpertiseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicExpertise
        fields = ['id', 'name', 'score', 'material']
        read_only_fields = ['id']

class ComprehensivePerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComprehensivePerformance
        fields = ['id', 'name', 'score', 'material']
        read_only_fields = ['id']

class SubjectScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectScore
        fields = ['id', 'gpa', 'a_value', 'calculated_score']
        read_only_fields = ['id', 'calculated_score']
    
    def validate(self, data):
        """验证学科成绩相关数据"""
        if 'a_value' in data and data['a_value'] != A_SCORE_MAX:
            raise serializers.ValidationError(f"学科成绩总分值必须为{A_SCORE_MAX}分")
        if 'gpa' in data and (data['gpa'] < 0 or data['gpa'] > 4):
            raise serializers.ValidationError("绩点必须在0到4之间")
        return data

class StudentSerializer(serializers.ModelSerializer):
    subject_score = SubjectScoreSerializer()
    academic_expertises = AcademicExpertiseSerializer(many=True)
    comprehensive_performances = ComprehensivePerformanceSerializer(many=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'username', 'password', 'student_id', 
            'total_score', 'ranking', 'subject_score',
            'academic_expertises', 'comprehensive_performances',
            'date_joined'
        ]
        read_only_fields = ['id', 'total_score', 'ranking', 'date_joined']
    
    def create(self, validated_data):
        # 提取嵌套数据
        subject_score_data = validated_data.pop('subject_score')
        academic_expertises_data = validated_data.pop('academic_expertises')
        comprehensive_performances_data = validated_data.pop('comprehensive_performances')
        
        # 创建学生用户
        student = Student.objects.create_user(** validated_data)
        
        # 创建学科成绩
        SubjectScore.objects.create(student=student, **subject_score_data)
        
        # 创建学术专长记录
        for exp_data in academic_expertises_data:
            AcademicExpertise.objects.create(student=student,** exp_data)
        
        # 创建综合表现记录
        for cp_data in comprehensive_performances_data:
            ComprehensivePerformance.objects.create(student=student, **cp_data)
        
        return student
    
    def update(self, instance, validated_data):
        # 处理密码更新
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        
        # 处理学科成绩更新
        if 'subject_score' in validated_data:
            subject_score_data = validated_data.pop('subject_score')
            subject_score = instance.subject_score
            for attr, value in subject_score_data.items():
                setattr(subject_score, attr, value)
            subject_score.save()
        
        # 处理学术专长更新
        if 'academic_expertises' in validated_data:
            academic_expertises_data = validated_data.pop('academic_expertises')
            
            # 删除现有记录
            instance.academic_expertises.all().delete()
            # 创建新记录
            for exp_data in academic_expertises_data:
                AcademicExpertise.objects.create(student=instance,** exp_data)
        
        # 处理综合表现更新
        if 'comprehensive_performances' in validated_data:
            comprehensive_performances_data = validated_data.pop('comprehensive_performances')
            
            # 删除现有记录
            instance.comprehensive_performances.all().delete()
            # 创建新记录
            for cp_data in comprehensive_performances_data:
                ComprehensivePerformance.objects.create(student=instance, **cp_data)
        
        # 更新学生其他字段
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance
