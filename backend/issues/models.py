from django.db import models
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils import timezone


class InternshipPlacement(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="placements",
        help_text="The student undertaking the internship",
    )

    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="supervised_placements",
        help_text="Supervisor overseeing the internship",
    )

    company_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date")

        overlapping = InternshipPlacement.objects.filter(
            student=self.student
        ).filter(
            Q(start_date__lt=self.end_date) &
            Q(end_date__gt=self.start_date)
        ).exclude(id=self.id)

        if overlapping.exists():
            raise ValidationError("This placement overlaps with another existing placement")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["supervisor", "status"]),
        ]

    def __str__(self):
        student_name = self.student.get_full_name() or self.student.username
        return f"{student_name} @ {self.company_name}"


class WeeklyLog(models.Model):

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("reviewed", "Reviewed"),
        ("approved", "Approved"),
    ]

    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name="weekly_logs",
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="logs",
        help_text="Must match placement.student",
    )

    week_number = models.PositiveIntegerField(
        help_text="Week number of internship (starts at 1)"
    )

    content = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )

    submitted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("placement", "week_number")
        ordering = ["placement", "week_number"]
        indexes = [
            models.Index(fields=["placement", "status"]),
            models.Index(fields=["student", "status"]),
        ]

    def clean(self):
        if self.week_number and self.week_number < 1:
            raise ValidationError({
                "week_number": "Week number must be at least 1."
            })

        if self.placement and self.student:
            if self.placement.student != self.student:
                raise ValidationError({
                    "student": "The log student must match the placement student."
                })

    def save(self, *args, **kwargs):
        if self.status == "submitted" and not self.submitted_at:
            self.submitted_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Week {self.week_number} - {self.placement.student}"


class Evaluation(models.Model):

    placement = models.OneToOneField(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name="evaluation",
    )

    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="evaluations",
        help_text="Supervisor who completed the evaluation",
    )

    supervisor_score = models.FloatField(verbose_name="Supervisor score (%)")
    academic_score = models.FloatField(verbose_name="Academic score (%)")
    logbook_score = models.FloatField(verbose_name="Logbook score (%)")

    total_score = models.FloatField(
        editable=False,
        blank=True,
        null=True,
        verbose_name="Total weighted score (%)"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):

        scores = {
            "supervisor_score": self.supervisor_score,
            "academic_score": self.academic_score,
            "logbook_score": self.logbook_score,
        }

        for field, value in scores.items():
            if value is not None and not (0 <= value <= 100):
                raise ValidationError({
                    field: "Score must be between 0 and 100."
                })

    def save(self, *args, **kwargs):

        if all([
            self.supervisor_score is not None,
            self.academic_score is not None,
            self.logbook_score is not None,
        ]):

            self.total_score = (
                (self.supervisor_score * 0.4)
                + (self.academic_score * 0.3)
                + (self.logbook_score * 0.3)
            )

        super().save(*args, **kwargs)

    def __str__(self):
        student = self.placement.student
        student_name = student.get_full_name() or student.username
        return f"Evaluation for {student_name} - {self.total_score:.1f}%"
from django.conf import settings
from django.utils import timezone

class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(field=['code'])
        ]
        
    def __str__(self):
        return f"{self.name} ({self.code})"
    
class Issue(models.Model):
    class IssueType(models.TestChoices):
        MISSING_MARKS = 'MISSING_MARKS', 'Missing Marks'
        APPEAL = 'APPEAL', 'Appeal'
        CORRECTION = 'CORRECTION', 'Correction'
        
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name = 'submitted_issues'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_issues'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='issues'
              
    )
    
    course_code = models.CharField(max_length=20, db_index=True)
    issue_type = models.CharField(
        max_length=20,
        choices=IssueType.choices,
        default=IssueType.MISSING_MARKS
    )
    description = models.TextField()
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', ' created_at']),
            models.Index(fields=['issue_type'])
        ]
    def __str__(self):
        return f"{self.course_code} - {self.get_status_display()} ({self.student})"
    
    def save(self, *args, **kwargs):
        if self.status == self.Status.RESOLVED and not self.resolved_at:
            self.resolved_at = timezone.now()
        elif self.status != self.Status.RESOLVED:
            self.resolved_at = None
        super().save(*args, **kwargs)
        
class IssueLog(models.Model):
    issue = models.ForeignKey(
        Issue, 
        on_delete=models.CASCADE,
        related_name='logs'
    )
    action = models.CharField(max_length=255)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name = 'issue_logs'
    )        
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"Issue #{self.issue.id}: {self.action} by {self.performed_by}"
    