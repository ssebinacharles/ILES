
from __future__ import annotations
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action

from rest_framework.response import Response

from .models import (
    AuditLog,
    Company,
    Evaluation,
    EvaluationCriterion,
    EvaluationScore,
    EvaluationStatus,
    Feedback,
    FinalResult,
    GeneratedReport,
    InternshipPlacement,
    PlacementStatus,
    ReportDefinition,
    ReportStatus,
    SupervisorAssignment,
    WeeklyLog,
    WeeklyLogStatus,
)

from .permissions import (
    AuditLogPermission,
    CompanyPermission,
    EvaluationCriterionPermission,
    EvaluationPermission,
    EvaluationScorePermission,
    FeedbackPermission,
    FinalResultPermission,
    PlacementPermission,
    ReportPermission,
    SupervisorAssignmentPermission,
    WeeklyLogPermission,
    can_access_placement,
    get_admin_profile,
    get_student_profile,
    get_supervisor_profile,
    is_administrator,
    is_student,
    is_supervisor,
)

from .serializers import (
    AuditLogSerializer,
    CompanySerializer,
    EvaluationCriterionSerializer,
    EvaluationScoreSerializer,
    EvaluationSerializer,
    FeedbackSerializer,
    FinalResultSerializer,
    GeneratedReportSerializer,
    InternshipPlacementSerializer,
    ReportDefinitionSerializer,
    SupervisorAssignmentSerializer,
    WeeklyLogSerializer,
)


class SearchOrderingMixin:
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering = ("-id",)


class CompanyViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]
    search_fields = (
        "company_name",
        "location",
        "contact_email",
        "contact_person_name",
    )
    ordering = ("company_name",)


class InternshipPlacementViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.select_related(
        "student__user",
        "company",
        "approved_by__user",
    ).prefetch_related("supervisor_assignments__supervisor__user").all()

    serializer_class = InternshipPlacementSerializer
    permission_classes = [AllowAny]

    search_fields = (
        "student__registration_number",
        "student__user__username",
        "company__company_name",
        "status",
    )

    ordering = ("-requested_at",)

    def get_queryset(self):
        return InternshipPlacement.objects.select_related(
            "student__user",
            "company",
            "approved_by__user",
        ).prefetch_related(
            "supervisor_assignments__supervisor__user"
        ).all().order_by("-requested_at")

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        placement = self.get_object()
        placement.status = PlacementStatus.APPROVED
        placement.approved_at = timezone.now()
        placement.rejection_reason = ""
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        placement = self.get_object()
        placement.status = PlacementStatus.REJECTED
        placement.rejection_reason = request.data.get("rejection_reason", "")
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=["post"])
    def mark_in_progress(self, request, pk=None):
        placement = self.get_object()
        placement.status = PlacementStatus.IN_PROGRESS
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        placement = self.get_object()
        placement.status = PlacementStatus.COMPLETED
        placement.save()
        return Response(self.get_serializer(placement).data)


class SupervisorAssignmentViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = SupervisorAssignment.objects.select_related(
        "placement__student__user",
        "placement__company",
        "supervisor__user",
        "assigned_by__user",
    ).all()

    serializer_class = SupervisorAssignmentSerializer
    permission_classes = [AllowAny]

    search_fields = (
        "placement__student__registration_number",
        "placement__company__company_name",
        "supervisor__user__username",
        "assignment_role",
    )

    ordering = ("-assigned_at",)

    def get_queryset(self):
        return SupervisorAssignment.objects.select_related(
            "placement__student__user",
            "placement__company",
            "supervisor__user",
            "assigned_by__user",
        ).all().order_by("-assigned_at")

    def perform_create(self, serializer):
        serializer.save()


class WeeklyLogViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = WeeklyLog.objects.select_related(
        "placement__student__user",
        "placement__company",
    ).all()

    serializer_class = WeeklyLogSerializer
    permission_classes = [AllowAny]

    search_fields = (
        "title",
        "status",
        "placement__student__registration_number",
        "placement__company__company_name",
    )

    ordering = ("placement", "week_number")

    def get_queryset(self):
        return WeeklyLog.objects.select_related(
            "placement__student__user",
            "placement__company",
        ).all().order_by("placement", "week_number")

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        log = self.get_object()
        log.status = WeeklyLogStatus.SUBMITTED
        log.submitted_at = timezone.now()
        log.save()
        return Response(self.get_serializer(log).data)


class FeedbackViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = Feedback.objects.select_related(
        "weekly_log__placement__student__user",
        "weekly_log__placement__company",
        "supervisor__user",
    ).all()

    serializer_class = FeedbackSerializer
    permission_classes = [AllowAny]

    search_fields = (
        "decision",
        "comment",
        "supervisor__user__username",
        "weekly_log__title",
    )

    ordering = ("-created_at",)

    def get_queryset(self):
        return Feedback.objects.select_related(
            "weekly_log__placement__student__user",
            "weekly_log__placement__company",
            "supervisor__user",
        ).all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save()


class EvaluationCriterionViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = EvaluationCriterion.objects.all()
    serializer_class = EvaluationCriterionSerializer
    permission_classes = [AllowAny]
    search_fields = ("criterion_name", "criterion_group")
    ordering = ("criterion_group", "criterion_name")


class EvaluationViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = Evaluation.objects.select_related(
        "placement__student__user",
        "placement__company",
        "evaluator__user",
    ).prefetch_related("scores__criterion")

    serializer_class = EvaluationSerializer
    permission_classes = [AllowAny]

    search_fields = (
        "evaluation_type",
        "status",
        "placement__student__registration_number",
        "evaluator__user__username",
    )

    ordering = ("-created_at",)

    def get_queryset(self):
        return Evaluation.objects.select_related(
            "placement__student__user",
            "placement__company",
            "evaluator__user",
        ).prefetch_related("scores__criterion").all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        evaluation = self.get_object()
        evaluation.status = EvaluationStatus.SUBMITTED
        evaluation.submitted_at = timezone.now()
        evaluation.save()
        return Response(self.get_serializer(evaluation).data)


class EvaluationScoreViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = EvaluationScore.objects.select_related("evaluation", "criterion")
    serializer_class = EvaluationScoreSerializer
    permission_classes = [AllowAny]
    search_fields = ("criterion__criterion_name", "evaluation__evaluation_type")
    ordering = ("evaluation", "criterion")

    def get_queryset(self):
        user = self.request.user

        if is_administrator(user):
            return self.queryset

        if is_student(user):
            profile = get_student_profile(user)
            if profile:
                return self.queryset.filter(evaluation__placement__student=profile)
            return self.queryset.none()

        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if profile:
                return self.queryset.filter(evaluation__evaluator=profile)
            return self.queryset.none()

        return self.queryset.none()


class FinalResultViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = FinalResult.objects.select_related(
        "placement__student__user",
        "placement__company",
        "published_by__user",
    ).all()

    serializer_class = FinalResultSerializer
    permission_classes = [AllowAny]

    search_fields = (
        "placement__student__registration_number",
        "placement__company__company_name",
    )

    ordering = ("-published_at", "-created_at")

    def get_queryset(self):
        return FinalResult.objects.select_related(
            "placement__student__user",
            "placement__company",
            "published_by__user",
        ).all().order_by("-published_at", "-created_at")

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        final_result = self.get_object()
        final_result.published_at = timezone.now()
        final_result.save()
        return Response(self.get_serializer(final_result).data)

class AuditLogViewSet(SearchOrderingMixin, viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor", "content_type").all()
    serializer_class = AuditLogSerializer
    permission_classes = [AllowAny]
    search_fields = ("action", "model_label", "object_id", "actor__username")
    ordering = ("-created_at",)


class ReportDefinitionViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = ReportDefinition.objects.select_related("created_by").all()
    serializer_class = ReportDefinitionSerializer
    permission_classes = [AllowAny]
    search_fields = ("name", "report_type", "frequency")
    ordering = ("name",)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def run_now(self, request, pk=None):
        report_definition = self.get_object()

        generated_report = GeneratedReport.objects.create(
            report_definition=report_definition,
            generated_by=request.user,
            status=ReportStatus.COMPLETED,
            output_format=request.data.get("output_format", "PDF"),
            summary={"message": "Manual report trigger recorded from API."},
            generated_at=timezone.now(),
        )

        serializer = GeneratedReportSerializer(
            generated_report,
            context=self.get_serializer_context(),
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GeneratedReportViewSet(SearchOrderingMixin, viewsets.ReadOnlyModelViewSet):
    queryset = GeneratedReport.objects.select_related(
        "report_definition",
        "generated_by",
    ).all()

    serializer_class = GeneratedReportSerializer
    permission_classes = [AllowAny]
    search_fields = ("report_definition__name", "status", "output_format")
    ordering = ("-created_at",)