from datetime import date, datetime
from decimal import Decimal

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from users.models import (
    StudentProfile,
    SupervisorProfile,
    SupervisorType,
    AdministratorProfile,
)


# ============================================================
# JSON SAFETY HELPER
# ============================================================

def make_json_safe(value):
    """
    Convert Python values into JSON-safe values before saving into JSONField.
    This prevents errors like:
    Object of type datetime is not JSON serializable
    """

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, models.Model):
        return str(value)

    if isinstance(value, dict):
        return {str(key): make_json_safe(val) for key, val in value.items()}

    if isinstance(value, list):
        return [make_json_safe(item) for item in value]

    if isinstance(value, tuple):
        return [make_json_safe(item) for item in value]

    if isinstance(value, set):
        return [make_json_safe(item) for item in value]

    return value


# ============================================================
# ABSTRACT BASE MODELS
# ============================================================

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ============================================================
# CORE ENTITIES
# ============================================================

class Company(TimeStampedModel):
    company_name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    contact_person_name = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["company_name"]

    def __str__(self):
        return self.company_name


class PlacementStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")
    IN_PROGRESS = "IN_PROGRESS", _("In Progress")
    COMPLETED = "COMPLETED", _("Completed")
    CANCELLED = "CANCELLED", _("Cancelled")


class InternshipPlacement(TimeStampedModel):
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="placements",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name="placements",
    )
    approved_by = models.ForeignKey(
        AdministratorProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_placements",
    )
    org_department = models.CharField(max_length=150, blank=True)
    workplace_supervisor_name = models.CharField(max_length=150, blank=True)
    workplace_supervisor_email = models.EmailField(blank=True, null=True)
    workplace_supervisor_phone = models.CharField(max_length=30, blank=True)
    workplace_supervisor_title = models.CharField(max_length=150, blank=True)
    workplace_supervisor_department = models.CharField(max_length=150, blank=True)
    student_notes = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=PlacementStatus.choices,
        default=PlacementStatus.PENDING,
    )
    requested_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-requested_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["start_date", "end_date"]),
        ]
        permissions = [
            ("can_approve_placement", "Can approve internship placement"),
            ("can_assign_supervisors", "Can assign supervisors to placements"),
        ]

    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("Internship start date must be earlier than end date.")

        overlapping = InternshipPlacement.objects.filter(
            student=self.student,
            status__in=[
                PlacementStatus.APPROVED,
                PlacementStatus.IN_PROGRESS,
            ],
        ).exclude(pk=self.pk)

        for placement in overlapping:
            if self.start_date <= placement.end_date and self.end_date >= placement.start_date:
                raise ValidationError(
                    "This student already has an overlapping active internship placement."
                )

    def __str__(self):
        return f"{self.student.registration_number} @ {self.company.company_name}"


class AssignmentRole(models.TextChoices):
    ACADEMIC = "ACADEMIC", _("Academic Supervisor")
    WORKPLACE = "WORKPLACE", _("Workplace Supervisor")


class SupervisorAssignment(TimeStampedModel):
    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name="supervisor_assignments",
    )
    supervisor = models.ForeignKey(
        SupervisorProfile,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    assigned_by = models.ForeignKey(
        AdministratorProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_assignments",
    )
    assignment_role = models.CharField(max_length=20, choices=AssignmentRole.choices)
    assigned_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-assigned_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["placement", "supervisor", "assignment_role"],
                name="unique_supervisor_assignment_per_role",
            ),
            models.UniqueConstraint(
                fields=["placement", "assignment_role"],
                condition=Q(is_active=True),
                name="unique_active_assignment_role_per_placement",
            ),
        ]
        permissions = [
            ("can_reassign_supervisor", "Can reassign supervisors"),
        ]

    def clean(self):
        if self.supervisor.supervisor_type != self.assignment_role:
            raise ValidationError("Supervisor type must match assignment role.")

    def __str__(self):
        return f"{self.placement} - {self.assignment_role} - {self.supervisor}"


# ============================================================
# WEEKLY LOGS + FEEDBACK
# ============================================================

class WeeklyLogStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    SUBMITTED = "SUBMITTED", _("Submitted")
    UNDER_REVIEW = "UNDER_REVIEW", _("Under Review")
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")


class WeeklyLog(TimeStampedModel):
    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name="weekly_logs",
    )
    week_number = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(52)]
    )
    title = models.CharField(max_length=200)
    activities = models.TextField(blank=True)
    monday_activities = models.TextField(blank=True)
    tuesday_activities = models.TextField(blank=True)
    wednesday_activities = models.TextField(blank=True)
    thursday_activities = models.TextField(blank=True)
    friday_activities = models.TextField(blank=True)
    challenges = models.TextField(blank=True)
    lessons_learned = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=WeeklyLogStatus.choices,
        default=WeeklyLogStatus.DRAFT,
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["placement", "week_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["placement", "week_number"],
                name="unique_week_per_placement",
            ),
        ]
        permissions = [
            ("can_submit_weekly_log", "Can submit weekly log"),
            ("can_review_weekly_log", "Can review weekly log"),
        ]

    def clean(self):
        duration_days = (self.placement.end_date - self.placement.start_date).days
        max_expected_weeks = max(1, (duration_days // 7) + 1)

        if self.week_number > max_expected_weeks + 2:
            raise ValidationError("Week number exceeds the likely internship duration.")

    def __str__(self):
        return f"{self.placement} - Week {self.week_number}"


class FeedbackDecision(models.TextChoices):
    COMMENT = "COMMENT", _("Comment")
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")


class Feedback(TimeStampedModel):
    weekly_log = models.ForeignKey(
        WeeklyLog,
        on_delete=models.CASCADE,
        related_name="feedback_entries",
    )
    supervisor = models.ForeignKey(
        SupervisorProfile,
        on_delete=models.CASCADE,
        related_name="feedback_given",
    )
    decision = models.CharField(
        max_length=20,
        choices=FeedbackDecision.choices,
        default=FeedbackDecision.COMMENT,
    )
    comment = models.TextField()
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    is_latest = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["decision"]),
            models.Index(fields=["is_latest"]),
        ]

    def clean(self):
        if not self.weekly_log_id or not self.supervisor_id:
            return

        assigned = SupervisorAssignment.objects.filter(
            placement=self.weekly_log.placement,
            supervisor=self.supervisor,
            is_active=True,
        ).exists()

        if not assigned:
            raise ValidationError(
                "Only an assigned supervisor can review this weekly log."
            )

    def __str__(self):
        return f"{self.weekly_log} - {self.supervisor} - {self.decision}"


# ============================================================
# EVALUATION + CRITERIA + SCORES
# ============================================================

class CriterionGroup(models.TextChoices):
    WEEKLY_LOG = "WEEKLY_LOG", _("Weekly Log")
    SUPERVISOR_EVALUATION = "SUPERVISOR_EVALUATION", _("Supervisor Evaluation")
    FINAL_REPORT = "FINAL_REPORT", _("Final Report")
    WORKPLACE_ASSESSMENT = "WORKPLACE_ASSESSMENT", _("Workplace Assessment")


class EvaluationCriterion(TimeStampedModel):
    criterion_name = models.CharField(max_length=150)
    criterion_group = models.CharField(max_length=30, choices=CriterionGroup.choices)
    weight_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["criterion_group", "criterion_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["criterion_name", "criterion_group"],
                name="unique_criterion_per_group",
            ),
        ]

    def __str__(self):
        return f"{self.criterion_group} - {self.criterion_name}"


class EvaluationType(models.TextChoices):
    ACADEMIC_EVALUATION = "ACADEMIC_EVALUATION", _("Academic Evaluation")
    WORKPLACE_ASSESSMENT = "WORKPLACE_ASSESSMENT", _("Workplace Assessment")
    FINAL_REPORT = "FINAL_REPORT", _("Final Report")
    WEEKLY_LOG_SUMMARY = "WEEKLY_LOG_SUMMARY", _("Weekly Log Summary")


class EvaluationStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    SUBMITTED = "SUBMITTED", _("Submitted")
    APPROVED = "APPROVED", _("Approved")


class Evaluation(TimeStampedModel):
    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name="evaluations",
    )
    evaluator = models.ForeignKey(
        SupervisorProfile,
        on_delete=models.CASCADE,
        related_name="evaluations_done",
    )
    evaluation_type = models.CharField(max_length=30, choices=EvaluationType.choices)
    total_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    weighted_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    remarks = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=EvaluationStatus.choices,
        default=EvaluationStatus.DRAFT,
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["placement", "evaluator", "evaluation_type"],
                name="unique_evaluation_per_evaluator_type_placement",
            ),
        ]
        permissions = [
            ("can_submit_evaluation", "Can submit evaluation"),
            ("can_publish_final_results", "Can publish final results"),
        ]

    def clean(self):
        assigned = SupervisorAssignment.objects.filter(
            placement=self.placement,
            supervisor=self.evaluator,
            is_active=True,
        ).exists()

        if not assigned:
            raise ValidationError(
                "Only an assigned supervisor can submit an evaluation for this placement."
            )

        if (
            self.evaluation_type == EvaluationType.ACADEMIC_EVALUATION
            and self.evaluator.supervisor_type != SupervisorType.ACADEMIC
        ):
            raise ValidationError(
                "Academic evaluation must be submitted by an academic supervisor."
            )

        if (
            self.evaluation_type == EvaluationType.WORKPLACE_ASSESSMENT
            and self.evaluator.supervisor_type != SupervisorType.WORKPLACE
        ):
            raise ValidationError(
                "Workplace assessment must be submitted by a workplace supervisor."
            )

    def recalculate_scores(self):
        scores = self.scores.select_related("criterion").all()
        total = Decimal("0.00")
        weighted = Decimal("0.00")

        for score in scores:
            total += score.raw_score
            weighted += score.weighted_score

        self.total_score = min(total, Decimal("100.00"))
        self.weighted_score = min(weighted, Decimal("100.00"))

    def __str__(self):
        return f"{self.placement} - {self.evaluation_type}"


class EvaluationScore(TimeStampedModel):
    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name="scores",
    )
    criterion = models.ForeignKey(
        EvaluationCriterion,
        on_delete=models.PROTECT,
        related_name="evaluation_scores",
    )
    raw_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    weighted_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )

    class Meta:
        ordering = ["evaluation", "criterion"]
        constraints = [
            models.UniqueConstraint(
                fields=["evaluation", "criterion"],
                name="unique_criterion_score_per_evaluation",
            ),
        ]

    def clean(self):
        if self.criterion.weight_percent is None:
            raise ValidationError("Criterion must have a weight.")

    def save(self, *args, **kwargs):
        self.weighted_score = (
            self.raw_score * self.criterion.weight_percent
        ) / Decimal("100.00")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.evaluation} - {self.criterion}"


# ============================================================
# FINAL RESULT
# ============================================================

class FinalResult(TimeStampedModel):
    placement = models.OneToOneField(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name="final_result",
    )
    published_by = models.ForeignKey(
        AdministratorProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_results",
    )
    weekly_logs_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    supervisor_evaluation_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    final_report_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    workplace_assessment_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    final_mark = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at"]

    def recalculate_final_mark(self):
        total = (
            self.weekly_logs_score
            + self.supervisor_evaluation_score
            + self.final_report_score
            + self.workplace_assessment_score
        )

        self.final_mark = min(total, Decimal("100.00"))

    def save(self, *args, **kwargs):
        self.recalculate_final_mark()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Final Result - {self.placement}"


# ============================================================
# AUDIT TRAIL
# ============================================================

class AuditAction(models.TextChoices):
    CREATE = "CREATE", _("Create")
    UPDATE = "UPDATE", _("Update")
    DELETE = "DELETE", _("Delete")
    STATUS_CHANGE = "STATUS_CHANGE", _("Status Change")
    LOGIN = "LOGIN", _("Login")
    REPORT_GENERATED = "REPORT_GENERATED", _("Report Generated")


class AuditLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=20, choices=AuditAction.choices)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=64)
    content_object = GenericForeignKey("content_type", "object_id")
    model_label = models.CharField(max_length=100)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["action"]),
            models.Index(fields=["model_label"]),
            models.Index(fields=["created_at"]),
        ]

    def save(self, *args, **kwargs):
        self.changes = make_json_safe(self.changes)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.action} - {self.model_label} - {self.object_id}"


# ============================================================
# AUTOMATED REPORTING
# ============================================================

class ReportType(models.TextChoices):
    INTERNSHIP_PROGRESS = "INTERNSHIP_PROGRESS", _("Internship Progress")
    STUDENT_PERFORMANCE = "STUDENT_PERFORMANCE", _("Student Performance")
    SUPERVISOR_WORKLOAD = "SUPERVISOR_WORKLOAD", _("Supervisor Workload")
    FINAL_RESULTS = "FINAL_RESULTS", _("Final Results")
    AUDIT_SUMMARY = "AUDIT_SUMMARY", _("Audit Summary")


class ReportFrequency(models.TextChoices):
    DAILY = "DAILY", _("Daily")
    WEEKLY = "WEEKLY", _("Weekly")
    MONTHLY = "MONTHLY", _("Monthly")
    ON_DEMAND = "ON_DEMAND", _("On Demand")


class ReportStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    RUNNING = "RUNNING", _("Running")
    COMPLETED = "COMPLETED", _("Completed")
    FAILED = "FAILED", _("Failed")


class ReportFormat(models.TextChoices):
    PDF = "PDF", _("PDF")
    CSV = "CSV", _("CSV")
    JSON = "JSON", _("JSON")
    XLSX = "XLSX", _("XLSX")


class ReportDefinition(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    frequency = models.CharField(
        max_length=20,
        choices=ReportFrequency.choices,
        default=ReportFrequency.ON_DEMAND,
    )
    filters = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    next_run_at = models.DateTimeField(null=True, blank=True)
    last_run_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_report_definitions",
    )

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        self.filters = make_json_safe(self.filters)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class GeneratedReport(TimeStampedModel):
    report_definition = models.ForeignKey(
        ReportDefinition,
        on_delete=models.CASCADE,
        related_name="generated_reports",
    )
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_reports",
    )
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING,
    )
    output_format = models.CharField(
        max_length=10,
        choices=ReportFormat.choices,
        default=ReportFormat.PDF,
    )
    output_path = models.CharField(max_length=255, blank=True)
    summary = models.JSONField(default=dict, blank=True)
    generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.summary = make_json_safe(self.summary)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.report_definition.name} - {self.status}"