from __future__ import annotations
from typing import Any
from django.contrib import admin
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from .models import (
    Company,
    InternshipPlacement,
    SupervisorAssignment,
    WeeklyLog,
    Feedback,
    EvaluationCriterion,
    Evaluation,
    EvaluationScore,
    FinalResult,
    AuditLog,
    ReportDefinition,
    GeneratedReport,
)
# Company Admin
@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "location",
        "contact_email",
        "contact_phone",
        "contact_person_name",
        "website",
        "created_at",
        "updated_at",
    )
    list_filter = ("location",)
    search_fields = (
        "company_name",
        "location",
        "contact_email",
        "contact_person_name",
    )
    readonly_fields = ("created_at", "updated_at")


# Internship Placement and Assignments
class SupervisorAssignmentInline(admin.TabularInline):
    model = SupervisorAssignment
    extra = 0
    fields = ("supervisor", "assignment_role", "assigned_by", "assigned_at", "is_active")
    readonly_fields = ("assigned_at",)
    show_change_link = True


class WeeklyLogInline(admin.TabularInline):
    model = WeeklyLog
    extra = 0
    fields = ("week_number", "title", "status", "submitted_at")
    readonly_fields = ("submitted_at",)
    show_change_link = True


@admin.register(InternshipPlacement)
class InternshipPlacementAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "company",
        "start_date",
        "end_date",
        "status",
        "approved_by",
        "requested_at",
        "approved_at",
    )
    list_filter = ("status", "start_date", "end_date", "company")
    search_fields = (
        "student__user__username",
        "student__registration_number",
        "company__company_name",
    )
    readonly_fields = ("created_at", "updated_at", "requested_at", "approved_at")
    date_hierarchy = "start_date"
    inlines = [SupervisorAssignmentInline, WeeklyLogInline]

    def get_queryset(self, request: Any) -> QuerySet:
        qs = super().get_queryset(request)
        return qs.select_related("student__user", "company", "approved_by")


# Supervisor Assignment Admin
@admin.register(SupervisorAssignment)
class SupervisorAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "placement",
        "supervisor",
        "assignment_role",
        "assigned_by",
        "assigned_at",
        "is_active",
    )
    list_filter = ("assignment_role", "is_active", "assigned_at")
    search_fields = (
        "placement__student__user__username",
        "placement__company__company_name",
        "supervisor__user__username",
        "assigned_by__user__username",
    )
    readonly_fields = ("assigned_at",)
    autocomplete_fields = ("placement", "supervisor", "assigned_by")

    def get_queryset(self, request: Any) -> QuerySet:
        qs = super().get_queryset(request)
        return qs.select_related(
            "placement__student__user",
            "placement__company",
            "supervisor__user",
            "assigned_by__user",
        )


# Weekly Log and Feedback
class FeedbackInline(admin.TabularInline):
    model = Feedback
    extra = 0
    fields = ("supervisor", "decision", "comment", "is_latest", "created_at")
    readonly_fields = ("created_at",)
    show_change_link = True


@admin.register(WeeklyLog)
class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = ("placement", "week_number", "title", "status", "submitted_at")
    list_filter = ("status", "week_number")
    search_fields = (
        "placement__student__user__username",
        "placement__company__company_name",
        "title",
    )
    readonly_fields = ("created_at", "updated_at", "submitted_at")
    ordering = ("placement", "week_number")
    autocomplete_fields = ("placement",)
    inlines = [FeedbackInline]

    def get_queryset(self, request: Any) -> QuerySet:
        qs = super().get_queryset(request)
        return qs.select_related("placement__student__user", "placement__company")


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("weekly_log", "supervisor", "decision", "is_latest", "created_at")
    list_filter = ("decision", "is_latest")
    search_fields = (
        "weekly_log__placement__student__user__username",
        "weekly_log__placement__company__company_name",
        "supervisor__user__username",
        "comment",
    )
    readonly_fields = ("created_at",)
    autocomplete_fields = ("weekly_log", "supervisor")

    def get_queryset(self, request: Any) -> QuerySet:
        qs = super().get_queryset(request)
        return qs.select_related(
            "weekly_log__placement__student__user",
            "weekly_log__placement__company",
            "supervisor__user",
        )


# Evaluation and Scores
class EvaluationScoreInline(admin.TabularInline):
    model = EvaluationScore
    extra = 0
    fields = ("criterion", "raw_score", "weighted_score", "created_at")
    readonly_fields = ("weighted_score", "created_at")
    autocomplete_fields = ("criterion",)

    def has_delete_permission(self, request: Any, obj: Any = None) -> bool:
        if obj is not None:
            status = getattr(obj, "status", None)
            if status is not None and str(status).upper() != "DRAFT":
                return False
        return super().has_delete_permission(request, obj)


@admin.register(EvaluationCriterion)
class EvaluationCriterionAdmin(admin.ModelAdmin):
    list_display = (
        "criterion_name",
        "criterion_group",
        "weight_percent",
        "is_active",
        "created_at",
        "updated_at",
    )
    list_filter = ("criterion_group", "is_active")
    search_fields = ("criterion_name",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("criterion_group", "criterion_name")


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = (
        "placement",
        "evaluator",
        "evaluation_type",
        "total_score",
        "weighted_score",
        "status",
        "submitted_at",
        "created_at",
    )
    list_filter = ("evaluation_type", "status")
    search_fields = (
        "placement__student__user__username",
        "placement__company__company_name",
        "evaluator__user__username",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
        "total_score",
        "weighted_score",
        "submitted_at",
    )
    autocomplete_fields = ("placement", "evaluator")
    inlines = [EvaluationScoreInline]

    def save_model(self, request: Any, obj: Evaluation, form: Any, change: bool) -> None:
        if hasattr(obj, "recalculate_scores"):
            try:
                obj.recalculate_scores()
            except Exception:
                pass
        super().save_model(request, obj, form, change)

    def get_queryset(self, request: Any) -> QuerySet:
        qs = super().get_queryset(request)
        return qs.select_related(
            "placement__student__user",
            "placement__company",
            "evaluator__user",
        )


@admin.register(EvaluationScore)
class EvaluationScoreAdmin(admin.ModelAdmin):
    list_display = ("evaluation", "criterion", "raw_score", "weighted_score", "created_at")
    list_filter = ("criterion__criterion_group",)
    search_fields = (
        "evaluation__placement__student__user__username",
        "evaluation__placement__company__company_name",
        "criterion__criterion_name",
    )
    readonly_fields = ("created_at", "weighted_score")
    autocomplete_fields = ("evaluation", "criterion")


# Final Result Admin
@admin.register(FinalResult)
class FinalResultAdmin(admin.ModelAdmin):
    list_display = ("placement", "published_by", "final_mark", "published_at")
    readonly_fields = ("created_at", "updated_at", "final_mark", "published_at")
    autocomplete_fields = ("placement", "published_by")

    def save_model(self, request: Any, obj: FinalResult, form: Any, change: bool) -> None:
        if hasattr(obj, "recalculate_final_mark"):
            try:
                obj.recalculate_final_mark()
            except Exception:
                pass
        super().save_model(request, obj, form, change)


# Audit Log Admin
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("actor", "action", "model_label", "object_id", "ip_address", "created_at")
    list_filter = ("action", "model_label")
    search_fields = ("actor__username", "model_label", "object_id", "ip_address")
    readonly_fields = (
        "actor",
        "action",
        "content_type",
        "object_id",
        "content_object",
        "model_label",
        "changes",
        "ip_address",
        "created_at",
    )
    ordering = ("-created_at",)

# Automated Reporting Admin
@admin.register(ReportDefinition)
class ReportDefinitionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "report_type",
        "frequency",
        "is_active",
        "next_run_at",
        "last_run_at",
        "created_by",
    )
    list_filter = ("report_type", "frequency", "is_active")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("created_by",)
    ordering = ("name",)


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = (
        "report_definition",
        "generated_by",
        "status",
        "output_format",
        "generated_at",
        "created_at",
    )
    list_filter = ("status", "output_format")
    search_fields = ("report_definition__name", "generated_by__username")
    readonly_fields = ("created_at", "updated_at", "generated_at", "summary")
    autocomplete_fields = ("report_definition", "generated_by")
    ordering = ("-created_at",)

# Global admin configurations
admin.site.site_header = _("Internship Learning Evaluation System")
admin.site.site_title = _("ILES Admin Portal")
admin.site.index_title = _("Administration")