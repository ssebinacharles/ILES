from django.db import models
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
    





