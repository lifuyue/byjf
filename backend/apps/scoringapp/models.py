from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import os
from django.db.models.signals import post_save
from django.dispatch import receiver

# 默认分数上限（可以在 rulesapp 中由管理员修改）
DEFAULT_A_SCORE_MAX = 80  # 学科成绩总分上限
DEFAULT_B_SCORE_MAX = 15  # 学术专长总分上限
DEFAULT_C_SCORE_MAX = 5  # 综合表现总分上限

from django.apps import apps

def get_score_limits():
    """从 rulesapp.ScoreLimit 中获取当前的分数上限；不存在时返回默认值。

    返回 (a_max, b_max, c_max)
    """
    try:
        ScoreLimit = apps.get_model('rulesapp', 'ScoreLimit')
        if ScoreLimit:
            obj = ScoreLimit.objects.first()
            if obj:
                return obj.a_max, obj.b_max, obj.c_max
    except Exception:
        # 当 rulesapp 未就绪或不存在时，回退到默认常量
        pass
    return DEFAULT_A_SCORE_MAX, DEFAULT_B_SCORE_MAX, DEFAULT_C_SCORE_MAX

def proof_material_path(instance, filename):
    """生成证明材料的存储路径"""
    today = timezone.now().date()
    return f'proof_materials/{today.year}/{today.month}/{today.day}/{filename}'

class StudentManager(BaseUserManager):
    def create_user(self, username, student_id, password=None, **extra_fields):
        if not username:
            raise ValueError('必须提供用户名')
        if not student_id:
            raise ValueError('必须提供学号')
        user = self.model(username=username, student_id=student_id,** extra_fields)
        user.set_password(password)  # 密码加密存储
        user.save(using=self._db)
        return user

    def create_superuser(self, username, student_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, student_id, password,** extra_fields)

class Student(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True, verbose_name="用户名")
    student_id = models.CharField(max_length=20, unique=True, verbose_name="学号")
    total_score = models.FloatField(default=0, verbose_name="总分")
    ranking = models.IntegerField(default=0, verbose_name="排名")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = StudentManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['student_id']

    class Meta:
        verbose_name = "学生"
        verbose_name_plural = "学生"
        ordering = ['-total_score']  # 按总分降序排列

    def __str__(self):
        return f"{self.username} ({self.student_id})"

class SubjectScore(models.Model):
    """学科成绩模型"""
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='subject_score', verbose_name="学生")
    gpa = models.FloatField(verbose_name="绩点")
    a_value = models.FloatField(default=A_SCORE_MAX, verbose_name="学科成绩总分值")
    calculated_score = models.FloatField(default=0, verbose_name="计算后的学科成绩")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "学科成绩"
        verbose_name_plural = "学科成绩"

    def save(self, *args, **kwargs):
        # 计算学科成绩：(GPA/4)*a，确保不超过当前配置的 A_SCORE_MAX
        a_max, _, _ = get_score_limits()
        self.calculated_score = min((self.gpa / 4) * self.a_value, a_max)
        super().save(*args, **kwargs)

class AcademicExpertise(models.Model):
    """学术专长模型"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_expertises', verbose_name="学生")
    name = models.CharField(max_length=100, verbose_name="专长名称")
    score = models.FloatField(verbose_name="得分")
    material = models.FileField(upload_to=proof_material_path, null=True, blank=True, verbose_name="证明材料")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "学术专长"
        verbose_name_plural = "学术专长"

    def save(self, *args, **kwargs):
        # 确保单条得分不为负
        self.score = max(0, self.score)
        super().save(*args, **kwargs)

class ComprehensivePerformance(models.Model):
    """综合表现模型"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='comprehensive_performances', verbose_name="学生")
    name = models.CharField(max_length=100, verbose_name="表现名称")
    score = models.FloatField(verbose_name="得分")
    material = models.FileField(upload_to=proof_material_path, null=True, blank=True, verbose_name="证明材料")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "综合表现"
        verbose_name_plural = "综合表现"

    def save(self, *args, **kwargs):
        # 确保单条得分不为负
        self.score = max(0, self.score)
        super().save(*args, **kwargs)

@receiver(post_save, sender=SubjectScore)
@receiver(post_save, sender=AcademicExpertise)
@receiver(post_save, sender=ComprehensivePerformance)
def update_student_total_score(sender, instance,** kwargs):
    """当成绩相关模型更新时，自动更新学生总分和排名"""
    # 获取学生实例
    if hasattr(instance, 'student'):
        student = instance.student
        
    # 获取当前配置的分数上限
    _, b_max, c_max = get_score_limits()

    # 计算学术专长总分（不超过 b_max）
    academic_total = sum(exp.score for exp in student.academic_expertises.all())
    academic_total = min(academic_total, b_max)

    # 计算综合表现总分（不超过 c_max）
    comprehensive_total = sum(cp.score for cp in student.comprehensive_performances.all())
    comprehensive_total = min(comprehensive_total, c_max)
        
        # 获取学科成绩
        subject_score = student.subject_score.calculated_score if hasattr(student, 'subject_score') else 0
        
        # 计算总分（确保不超过100分）
        total_score = subject_score + academic_total + comprehensive_total
        total_score = min(total_score, 100)
        
        # 更新学生总分
        student.total_score = total_score
        student.save(update_fields=['total_score'])
        
        # 重新计算所有学生的排名
        recalculate_rankings()

def recalculate_rankings():
    """重新计算所有学生的排名"""
    students = Student.objects.order_by('-total_score')
    for index, student in enumerate(students, start=1):
        if student.ranking != index:
            student.ranking = index
            student.save(update_fields=['ranking'])
