from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    AdministratorProfile,
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
    StudentProfile,
    SupervisorAssignment,
    SupervisorProfile,
    User,
    UserRole,
    WeeklyLog,
)


class FullCleanModelSerializer(serializers.ModelSerializer):
    """Run model ``full_clean()`` during create/update."""

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


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "role")


class UserSerializer(FullCleanModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "phone_number",
            "is_verified",
            "is_active",
            "password",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        return user


class StudentProfileSummarySerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = ("id", "user", "registration_number", "course", "year_of_study", "department")


class StudentProfileSerializer(FullCleanModelSerializer):
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user",
        queryset=User.objects.filter(role=UserRole.STUDENT),
        write_only=True,
    )

    class Meta:
        model = StudentProfile
        fields = (
            "id",
            "user",
            "user_id",
            "registration_number",
            "course",
            "year_of_study",
            "department",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class SupervisorProfileSummarySerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = SupervisorProfile
        fields = ("id", "user", "supervisor_type", "organization_name", "title")


class SupervisorProfileSerializer(FullCleanModelSerializer):
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user",
        queryset=User.objects.filter(role=UserRole.SUPERVISOR),
        write_only=True,
    )

    class Meta:
        model = SupervisorProfile
        fields = (
            "id",
            "user",
            "user_id",
            "supervisor_type",
            "organization_name",
            "title",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class AdministratorProfileSummarySerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = AdministratorProfile
        fields = ("id", "user", "office_name")


class AdministratorProfileSerializer(FullCleanModelSerializer):
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user",
        queryset=User.objects.filter(role=UserRole.ADMINISTRATOR),
        write_only=True,
    )

    class Meta:
        model = AdministratorProfile
        fields = (
            "id",
            "user",
            "user_id",
            "office_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


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
        read_only_fields = ("id", "created_at", "updated_at")


class CompanySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("id", "company_name", "location")


class SupervisorAssignmentSummarySerializer(serializers.ModelSerializer):
    supervisor = SupervisorProfileSummarySerializer(read_only=True)

    class Meta:
        model = SupervisorAssignment
        fields = ("id", "supervisor", "assignment_role", "assigned_at", "is_active")


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
    supervisor_assignments = SupervisorAssignmentSummarySerializer(many=True, read_only=True)

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
            "approved_at",
            "rejection_reason",
            "supervisor_assignments",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "requested_at", "approved_at", "created_at", "updated_at")


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
        read_only_fields = ("id", "assigned_at", "created_at", "updated_at")


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
            "decision",
            "comment",
            "is_latest",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class WeeklyLogSerializer(FullCleanModelSerializer):
    placement = InternshipPlacementSerializer(read_only=True)
    placement_id = serializers.PrimaryKeyRelatedField(
        source="placement",
        queryset=InternshipPlacement.objects.all(),
        write_only=True,
    )
    feedback_entries = FeedbackSerializer(many=True, read_only=True)

    class Meta:
        model = WeeklyLog
        fields = (
            "id",
            "placement",
            "placement_id",
            "week_number",
            "title",
            "activities",
            "challenges",
            "lessons_learned",
            "status",
            "submitted_at",
            "feedback_entries",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "submitted_at", "created_at", "updated_at")


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
        read_only_fields = ("id", "created_at", "updated_at")


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
        read_only_fields = ("id", "weighted_score", "created_at", "updated_at")


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
    scores = EvaluationScoreSerializer(many=True, read_only=True)

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
        read_only_fields = ("id", "final_mark", "published_at", "created_at", "updated_at")


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

    def get_content_type_display(self, obj):
        return str(obj.content_type)


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
        read_only_fields = ("id", "created_at", "updated_at")


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
        read_only_fields = ("id", "generated_at", "created_at", "updated_at")
