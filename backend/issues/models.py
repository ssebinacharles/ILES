from django.db import models
from django.db.models import Q
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from simple_history.models import HistoricalRecords
from django.db.models.signals import post_save
from django.dispatch import receiver

class Issue(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reported_issues"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Issue: {self.title}"

class InternshipPlacement(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed")
        ("cancelled", "Cancelled"),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="placements"
    )

    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null = True,
        related_name="supervised_placements"
    )
    company_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ["-created"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["supervisor", "status"]),
        ]
    
    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after the start date")
        if self.status != "cancelled":
            overlapping = InternshipPlacement.objects.filter(
                student=self.student
            ).exclude(
                status="cancelled"
            ).filter(
                Q(start_date_1t=self.end_date) & Q(end_date_gt=self.start_date)

            ).exclude(id=self.id)

            if overlapping.exists():
                raise ValidationError("This placement overlaps with another existing placement.")
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs) 

    def __str__(self):
        student_name = self.students.get_full_name() or self.student.username 
        return f"{student_name} @ {self.company}"
     
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
        related_name="weekly_logs"
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="logs"
    )

    week_number = models.PositiveIntegerField()
    content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    class Meta:
        unique_together = ("placement", "week_number")
        ordering = ["placement", "week_number"]
        indexes = [
            models.Index(fields=["placement", "status"]),
            models.Index(fields=["student", "status"]),
        ]
    def clean(self):
        if self.week_number < 1:
            raise ValidationError({"Week_number": "Week number must be at least 1."})
        if self.placement and self.student:
            if self.placement.student != self.student:
                raise ValidationError({
                    "student": "The log students must match the placement student."
                })
        if self.placement and self.week_number:
            pass
        super().clean

    def save(self, *args, **kwargs):
        if self.status == "submitted":
            self.submitted_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Week {self.week_number} - {self.placement.student}"

    class Evaluation(models.Model):
        STATUS_CHOICES = [
            ("draft", "Draft"),
            ("submitted", "Submitted"),
            ("reviewed", "Reviewed"),
            ("approved", "Approved"),
        ]   

        placement = models.OneToOneField(
            InternshipPlacement,
            on_delete=models.CASCADE,
            related_name="evaluation"
        )

        supervisor = models.ForeignKey(
            settings.AUTH_USER_MODEL,
            on_delete=models.CASCADE,
            related_name="evaluations"
        )

        score_params ={
            "max_digits": 5,
            "decimal_places": 2,
            "validators": [MinValueValidator(0), MaxValueValidator(100)]
        }

        weekly_logs_score = models.DecimalField(**score_params)
        supervisor_evaluation