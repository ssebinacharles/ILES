from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from users.models import (
    User,
    UserRole,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
)

from .models import (
    AuditLog,
    Company,
    Evaluation,
    EvaluationCriterion,
    EvaluationScore,
    Feedback,
    FinalResult,
    GeneratedReport,
    InternshipPlacement,
    ReportDefinition,
    SupervisorAssignment,
    WeeklyLog,
)


class FullCleanModelSerializer(serializers.ModelSerializer):
    """Run model full_clean() during create/update."""

    def _run_model_validation(self, instance):
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise serializers.ValidationError(exc.message_dict)
            raise serializers.ValidationError(exc.messages)

    def create(self, validated_data):
        model = self.Meta.model
        instance = model(**validated_data)
        self._run_model_validation(instance)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        self._run_model_validation(instance)
        return super().update(instance, validated_data)


# ============================================================
# USER / PROFILE SUMMARY SERIALIZERS
# These models are from the users app, not issues app.
# ============================================================

class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
        )


class StudentProfileSummarySerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            "id",
            "user",
            "registration_number",
            "course",
            "year_of_study",
            "department",
        )


class SupervisorProfileSummarySerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = SupervisorProfile
        fields = (
            "id",
            "user",
            "supervisor_type",
            "organization_name",
            "title",
        )


class AdministratorProfileSummarySerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = AdministratorProfile
        fields = (
            "id",
            "user",
            "office_name",
        )


# ============================================================
# COMPANY
# ============================================================

class CompanySerializer(FullCleanModelSerializer):
    class Meta:
        model = Company
        fields = (
            "id",
            "company_name",
            "location",
            "contact_email",
            "contact_phone",
            "website",
            "contact_person_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )


class CompanySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = (
            "id",
            "company_name",
            "location",
        )


# ============================================================
# INTERNSHIP PLACEMENT
# ============================================================

class SupervisorAssignmentSummarySerializer(serializers.ModelSerializer):
    supervisor = SupervisorProfileSummarySerializer(read_only=True)

    class Meta:
        model = SupervisorAssignment
        fields = (
            "id",
            "supervisor",
            "assignment_role",
            "assigned_at",
            "is_active",
        )


class InternshipPlacementSerializer(FullCleanModelSerializer):
    student = StudentProfileSummarySerializer(read_only=True)
    company = CompanySummarySerializer(read_only=True)
    approved_by = AdministratorProfileSummarySerializer(read_only=True)

    student_id = serializers.PrimaryKeyRelatedField(
        source="student",
        queryset=StudentProfile.objects.all(),
        write_only=True,
        required=False,
    )
    company_id = serializers.PrimaryKeyRelatedField(
        source="company",
        queryset=Company.objects.all(),
        write_only=True,
    )
    approved_by_id = serializers.PrimaryKeyRelatedField(
        source="approved_by",
        queryset=AdministratorProfile.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    supervisor_assignments = SupervisorAssignmentSummarySerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = InternshipPlacement
        fields = (
            "id",
            "student",
            "student_id",
            "company",
            "company_id",
            "approved_by",
            "approved_by_id",
            "org_department",
            "start_date",
            "end_date",
            "status",
            "requested_at",
            "workplace_supervisor_name",
            "workplace_supervisor_email",
            "workplace_supervisor_phone",
            "workplace_supervisor_title",
            "workplace_supervisor_department",
            "student_notes",
            "approved_at",
            "rejection_reason",
            "supervisor_assignments",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "requested_at",
            "approved_at",
            "created_at",
            "updated_at",
        )


# ============================================================
# SUPERVISOR ASSIGNMENT
# ============================================================

class SupervisorAssignmentSerializer(FullCleanModelSerializer):
    placement = InternshipPlacementSerializer(read_only=True)
    supervisor = SupervisorProfileSummarySerializer(read_only=True)
    assigned_by = AdministratorProfileSummarySerializer(read_only=True)

    placement_id = serializers.PrimaryKeyRelatedField(
        source="placement",
        queryset=InternshipPlacement.objects.all(),
        write_only=True,
    )
    supervisor_id = serializers.PrimaryKeyRelatedField(
        source="supervisor",
        queryset=SupervisorProfile.objects.all(),
        write_only=True,
    )
    assigned_by_id = serializers.PrimaryKeyRelatedField(
        source="assigned_by",
        queryset=AdministratorProfile.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = SupervisorAssignment
        fields = (
            "id",
            "placement",
            "placement_id",
            "supervisor",
            "supervisor_id",
            "assigned_by",
            "assigned_by_id",
            "assignment_role",
            "assigned_at",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "assigned_at",
            "created_at",
            "updated_at",
        )


# ============================================================
# WEEKLY LOG + FEEDBACK
# ============================================================

class FeedbackSerializer(FullCleanModelSerializer):
    supervisor = SupervisorProfileSummarySerializer(read_only=True)

    weekly_log_id = serializers.PrimaryKeyRelatedField(
        source="weekly_log",
        queryset=WeeklyLog.objects.all(),
        write_only=True,
    )
    supervisor_id = serializers.PrimaryKeyRelatedField(
        source="supervisor",
        queryset=SupervisorProfile.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Feedback
        fields = (
            "id",
            "weekly_log_id",
            "supervisor",
            "supervisor_id",
            "score",
            "decision",
            "comment",
            "is_latest",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )


class WeeklyLogSerializer(FullCleanModelSerializer):
    placement = InternshipPlacementSerializer(read_only=True)

    placement_id = serializers.PrimaryKeyRelatedField(
        source="placement",
        queryset=InternshipPlacement.objects.all(),
        write_only=True,
    )

    feedback_entries = FeedbackSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = WeeklyLog
        fields = (
            "id",
            "placement",
            "placement_id",
            "week_number",
            "title",
            "activities",
            "monday_activities",
            "tuesday_activities",
            "wednesday_activities",
            "thursday_activities",
            "friday_activities",
            "challenges",
            "lessons_learned",
            "status",
            "submitted_at",
            "feedback_entries",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "submitted_at",
            "created_at",
            "updated_at",
        )


class WeeklyLogFeedbackSummarySerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    registration_number = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyLog
        fields = (
            "id",
            "week_number",
            "title",
            "status",
            "student_name",
            "registration_number",
            "company_name",
            "created_at",
            "updated_at",
        )

    def get_student_name(self, obj):
        user = obj.placement.student.user
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username

    def get_registration_number(self, obj):
        return obj.placement.student.registration_number

    def get_company_name(self, obj):
        return obj.placement.company.company_name


class FeedbackSerializer(FullCleanModelSerializer):
    weekly_log = WeeklyLogFeedbackSummarySerializer(read_only=True)
    supervisor = SupervisorProfileSummarySerializer(read_only=True)

    weekly_log_id = serializers.PrimaryKeyRelatedField(
        source="weekly_log",
        queryset=WeeklyLog.objects.all(),
        write_only=True,
    )

    supervisor_id = serializers.PrimaryKeyRelatedField(
        source="supervisor",
        queryset=SupervisorProfile.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Feedback
        fields = (
            "id",
            "weekly_log",
            "weekly_log_id",
            "supervisor",
            "supervisor_id",
            "decision",
            "comment",
            "score",
            "is_latest",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "weekly_log",
            "supervisor",
            "is_latest",
            "created_at",
            "updated_at",
        )

# ============================================================
# EVALUATION CRITERIA + SCORES
# ============================================================

class EvaluationCriterionSerializer(FullCleanModelSerializer):
    class Meta:
        model = EvaluationCriterion
        fields = (
            "id",
            "criterion_name",
            "criterion_group",
            "weight_percent",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )


class EvaluationScoreSerializer(FullCleanModelSerializer):
    criterion = EvaluationCriterionSerializer(read_only=True)

    criterion_id = serializers.PrimaryKeyRelatedField(
        source="criterion",
        queryset=EvaluationCriterion.objects.all(),
        write_only=True,
    )
    evaluation_id = serializers.PrimaryKeyRelatedField(
        source="evaluation",
        queryset=Evaluation.objects.all(),
        write_only=True,
    )

    class Meta:
        model = EvaluationScore
        fields = (
            "id",
            "evaluation_id",
            "criterion",
            "criterion_id",
            "raw_score",
            "weighted_score",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "weighted_score",
            "created_at",
            "updated_at",
        )


class EvaluationSerializer(FullCleanModelSerializer):
    placement = InternshipPlacementSerializer(read_only=True)
    evaluator = SupervisorProfileSummarySerializer(read_only=True)

    placement_id = serializers.PrimaryKeyRelatedField(
        source="placement",
        queryset=InternshipPlacement.objects.all(),
        write_only=True,
    )
    evaluator_id = serializers.PrimaryKeyRelatedField(
        source="evaluator",
        queryset=SupervisorProfile.objects.all(),
        write_only=True,
        required=False,
    )

    scores = EvaluationScoreSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Evaluation
        fields = (
            "id",
            "placement",
            "placement_id",
            "evaluator",
            "evaluator_id",
            "evaluation_type",
            "total_score",
            "weighted_score",
            "remarks",
            "status",
            "submitted_at",
            "scores",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "total_score",
            "weighted_score",
            "submitted_at",
            "created_at",
            "updated_at",
        )


# ============================================================
# FINAL RESULT
# ============================================================

class FinalResultSerializer(FullCleanModelSerializer):
    placement = InternshipPlacementSerializer(read_only=True)
    published_by = AdministratorProfileSummarySerializer(read_only=True)

    placement_id = serializers.PrimaryKeyRelatedField(
        source="placement",
        queryset=InternshipPlacement.objects.all(),
        write_only=True,
    )
    published_by_id = serializers.PrimaryKeyRelatedField(
        source="published_by",
        queryset=AdministratorProfile.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = FinalResult
        fields = (
            "id",
            "placement",
            "placement_id",
            "published_by",
            "published_by_id",
            "weekly_logs_score",
            "supervisor_evaluation_score",
            "final_report_score",
            "workplace_assessment_score",
            "final_mark",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "final_mark",
            "published_at",
            "created_at",
            "updated_at",
        )


# ============================================================
# AUDIT LOG
# ============================================================

class AuditLogSerializer(serializers.ModelSerializer):
    actor = UserSummarySerializer(read_only=True)
    content_type_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "actor",
            "action",
            "content_type_display",
            "object_id",
            "model_label",
            "changes",
            "ip_address",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_at",
        )

    def get_content_type_display(self, obj):
        return str(obj.content_type)


# ============================================================
# REPORTING
# ============================================================

class ReportDefinitionSerializer(FullCleanModelSerializer):
    created_by = UserSummarySerializer(read_only=True)

    created_by_id = serializers.PrimaryKeyRelatedField(
        source="created_by",
        queryset=User.objects.filter(role=UserRole.ADMINISTRATOR),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ReportDefinition
        fields = (
            "id",
            "name",
            "report_type",
            "frequency",
            "filters",
            "is_active",
            "next_run_at",
            "last_run_at",
            "created_by",
            "created_by_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )


class GeneratedReportSerializer(FullCleanModelSerializer):
    report_definition = ReportDefinitionSerializer(read_only=True)
    generated_by = UserSummarySerializer(read_only=True)

    report_definition_id = serializers.PrimaryKeyRelatedField(
        source="report_definition",
        queryset=ReportDefinition.objects.all(),
        write_only=True,
    )
    generated_by_id = serializers.PrimaryKeyRelatedField(
        source="generated_by",
        queryset=User.objects.filter(role=UserRole.ADMINISTRATOR),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = GeneratedReport
        fields = (
            "id",
            "report_definition",
            "report_definition_id",
            "generated_by",
            "generated_by_id",
            "status",
            "output_format",
            "output_path",
            "summary",
            "generated_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "generated_at",
            "created_at",
            "updated_at",
        )