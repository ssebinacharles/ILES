from django.db import models
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

class InternshipPlacement(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed")
        ("cancelled", "Cancelled"),
    ]
        
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="placements", help_text="The student undertaking the internship")
    supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="supervised_placements", help_text="Supervisor overseeing the internship")
    company_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("Please end date must be after start date")
        
        overlapping = InternshipPlacement.objects.filter(
            student=self.student
        ).filter(
            Q(start_date__lt=self.end_date) &
            Q(end_date__gt=self.start_date)
        ).exclude(id=self.id)
        
        if overlapping.exists():
            raise ValidationError("This placement overlaps with anotherexisting placement")
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
        student_name = self.student.get_full_name()  or self.student.username
        return f"{student_name} @ {self.company_name}"
    
    class WeeklyLog(models.Model):
        STATUS_CHOICES =[
            ("draft", "Draft"),
            ("submitted", "Submitted")
            ("reviewed", "Reviewed"),
            ("approved", "Approved"),
        ]
        
        placement = models.ForeignKey(
            InternshipPlacents,
            on_delete=models.CASCADE,
            related_name="weekly_logs"
        )
        
        def save(self, *args, **kwargs):
            if self.pk:
                old_log = WeeklyLog.objects.get(pk=self.pk)
                
                if old_log.status == "approved":
                    raise ValidationError("Approved logs cannot be edited.")
            super().save(*args, **kwargs)
            
        def submit(self):
            if self.status != "draft":
                raise ValidationError("Only draft logs can be submitted")
            self.status = "submitted"
            self.save()
            
        def review(self):
            if self.status != "submitted":
                raise ValidationError("Only submitted logs can be reviewed")
            self.status = "reviewed"
            self.save()
            
        def approved(self):
            if self.status != "reviewed":
                raise ValidationError("Only reviewed logs can be approved ")
            self.status = "approved"
            self.save()
        
        student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="logs", help_text="Must match placement.student")
        week_number = models.PositiveIntegerField(
            help_text="Week number of internship (starts at 1)"
        )
        content = models.TextField()
        
        status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
        
        submitted_at = models.DateTimeField(null=True, blank=True)
        
        created_at = models.DateTimeField(auto_now_add=True)
        
        class Meta:
            unique_together = ("placement", "week_number")
            ordering = ["placement", "week_number"]
            indexes = [
                models.Index(fields=["placement", "status"]),
                models.index(fields=["student", "status"]),
            ]
        def clean(self):
            if self.week_number and self.week_number < 1:
                raise ValidationError({
                    "week_number": "Week number must be at least 1."
                })
            if self.placement and self.student:
                if self.placement.student != self.students:
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
        #calculates weighted score automatically.
        placement = models.OneToOneField(InternshioPlacement, on_delete=models.CASCADE, related_name="evaluation")
        supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="evaluations", help_tex="Supervisor whoc completed the evaluation")
        supervisor_score = models.FloatField(verbose_name="Supervisor score (%)")
        academic_score = models.FloatField(verbose_name="Academic score (%)")
        logbook_score = models.FloatField(verbose_name="Logbook score (%)")
        total_score = models.FloatField(editable=False, blank=True, null=True, verbose_name="Total weighted score (%)")
        created_at = models.DateTimeField(auto_now_add=True)
        
        class Meta:
            ordering =["-created_at"]
            
        def clean(self):
            scores ={"supervisor_score": self.supervisor_score, "academic_score": self.academic_score, "logbook_score": self.logbook_score,}
            
            for field, value in scores.items():
                if value is not None and not (0 <= value <= 100):
                    raise ValidationError({
                        field: "Score must be between 0 and 100."
                    })
        def save(self, *args, **kwargs):
            if all([
                self.supervisor_score is not None,
                self.academic_score is not None,
                self.logbook_score is not None
            ]):
                self.total_score = ((self.supervisor_score * 0.4) + (self.academic_score * 0.3) + (self.logbook_score * 0.3))
            super().save(*args, **kwargs)
            
        def __str__(self):
            student = self.placement.student
            student_name = student.get_full_name() or student.username
            return f"Evaluation for {student_name} - {self.total_score:.lf}%"
            
                
                