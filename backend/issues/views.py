from __future__ import annotations

from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    AdministratorProfile,
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
    StudentProfile,
    SupervisorAssignment,
    User,
    UserRole,
    WeeklyLog,
    WeeklyLogStatus,
)
from .permissions import (
    AdministratorProfilePermission,
    AuditLogPermission,
    CompanyPermission,
    EvaluationCriterionPermission,
    EvaluationPermission,
    EvaluationScorePermission,
    FeedbackPermission,
    FinalResultPermission,
    PlacementPermission,
    ReportPermission,
    StudentProfilePermission,
    SupervisorAssignmentPermission,
    SupervisorProfilePermission,
    UserPermission,
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
    AdministratorProfileSerializer,
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
    StudentProfileSerializer,
    SupervisorAssignmentSerializer,
    SupervisorProfileSerializer,
    UserSerializer,
    WeeklyLogSerializer,
)


class SearchOrderingMixin:
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering = ("-id",)


class UserViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, UserPermission]
    search_fields = ("username", "first_name", "last_name", "email")
    ordering = ("username",)

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        return self.queryset.filter(pk=user.pk)


class StudentProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related("user").all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated, StudentProfilePermission]
    search_fields = ("registration_number", "course", "department", "user__username")

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_student(user):
            return self.queryset.filter(user=user)
        return self.queryset.none()

    def perform_create(self, serializer):
        if is_student(self.request.user):
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class SupervisorProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = SupervisorProfile.objects.select_related("user").all()
    serializer_class = SupervisorProfileSerializer
    permission_classes = [IsAuthenticated, SupervisorProfilePermission]
    search_fields = ("organization_name", "title", "user__username")

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_supervisor(user):
            return self.queryset.filter(user=user)
        return self.queryset.none()

    def perform_create(self, serializer):
        if is_supervisor(self.request.user):
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class AdministratorProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = AdministratorProfile.objects.select_related("user").all()
    serializer_class = AdministratorProfileSerializer
    permission_classes = [IsAuthenticated, AdministratorProfilePermission]
    search_fields = ("office_name", "user__username")

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        return self.queryset.none()


class CompanyViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, CompanyPermission]
    search_fields = ("company_name", "location", "contact_email", "contact_person_name")
    ordering = ("company_name",)


class InternshipPlacementViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.select_related(
        "student__user",
        "company",
        "approved_by__user",
    ).prefetch_related("supervisor_assignments__supervisor__user")
    serializer_class = InternshipPlacementSerializer
    permission_classes = [IsAuthenticated, PlacementPermission]
    search_fields = (
        "student__registration_number",
        "student__user__username",
        "company__company_name",
        "status",
    )
    ordering = ("-requested_at",)

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_student(user):
            profile = get_student_profile(user)
            return self.queryset.filter(student=profile) if profile else self.queryset.none()
        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if not profile:
                return self.queryset.none()
            return self.queryset.filter(
                supervisor_assignments__supervisor=profile,
                supervisor_assignments__is_active=True,
            ).distinct()
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if is_student(user):
            profile = get_student_profile(user)
            serializer.save(student=profile)
        else:
            serializer.save()

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        placement = self.get_object()
        if not is_administrator(request.user):
            return Response({"detail": "Administrator access is required."}, status=status.HTTP_403_FORBIDDEN)
        placement.status = PlacementStatus.APPROVED
        placement.approved_by = get_admin_profile(request.user)
        placement.approved_at = timezone.now()
        placement.rejection_reason = ""
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        placement = self.get_object()
        if not is_administrator(request.user):
            return Response({"detail": "Administrator access is required."}, status=status.HTTP_403_FORBIDDEN)
        placement.status = PlacementStatus.REJECTED
        placement.rejection_reason = request.data.get("rejection_reason", "")
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=["post"])
    def mark_in_progress(self, request, pk=None):
        placement = self.get_object()
        if not is_administrator(request.user):
            return Response({"detail": "Administrator access is required."}, status=status.HTTP_403_FORBIDDEN)
        placement.status = PlacementStatus.IN_PROGRESS
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        placement = self.get_object()
        if not is_administrator(request.user):
            return Response({"detail": "Administrator access is required."}, status=status.HTTP_403_FORBIDDEN)
        placement.status = PlacementStatus.COMPLETED
        placement.save()
        return Response(self.get_serializer(placement).data)


class SupervisorAssignmentViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = SupervisorAssignment.objects.select_related(
        "placement__student__user",
        "placement__company",
        "supervisor__user",
        "assigned_by__user",
    )
    serializer_class = SupervisorAssignmentSerializer
    permission_classes = [IsAuthenticated, SupervisorAssignmentPermission]
    search_fields = (
        "placement__student__registration_number",
        "placement__company__company_name",
        "supervisor__user__username",
        "assignment_role",
    )
    ordering = ("-assigned_at",)

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            return self.queryset.filter(supervisor=profile) if profile else self.queryset.none()
        if is_student(user):
            profile = get_student_profile(user)
            return self.queryset.filter(placement__student=profile) if profile else self.queryset.none()
        return self.queryset.none()

    def perform_create(self, serializer):
        admin_profile = get_admin_profile(self.request.user)
        serializer.save(assigned_by=admin_profile)


class WeeklyLogViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = WeeklyLog.objects.select_related("placement__student__user", "placement__company")
    serializer_class = WeeklyLogSerializer
    permission_classes = [IsAuthenticated, WeeklyLogPermission]
    search_fields = ("title", "status", "placement__student__registration_number", "placement__company__company_name")
    ordering = ("placement", "week_number")

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_student(user):
            profile = get_student_profile(user)
            return self.queryset.filter(placement__student=profile) if profile else self.queryset.none()
        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if not profile:
                return self.queryset.none()
            return self.queryset.filter(
                placement__supervisor_assignments__supervisor=profile,
                placement__supervisor_assignments__is_active=True,
            ).distinct()
        return self.queryset.none()

    def perform_create(self, serializer):
        placement = serializer.validated_data["placement"]
        if is_student(self.request.user) and not can_access_placement(self.request.user, placement):
            raise PermissionError("You can only create logs for your own placement.")
        serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        log = self.get_object()
        if not (is_administrator(request.user) or (is_student(request.user) and can_access_placement(request.user, log.placement))):
            return Response({"detail": "You cannot submit this log."}, status=status.HTTP_403_FORBIDDEN)
        log.status = WeeklyLogStatus.SUBMITTED
        log.submitted_at = timezone.now()
        log.save()
        return Response(self.get_serializer(log).data)


class FeedbackViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = Feedback.objects.select_related(
        "weekly_log__placement__student__user",
        "weekly_log__placement__company",
        "supervisor__user",
    )
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated, FeedbackPermission]
    search_fields = ("decision", "comment", "supervisor__user__username", "weekly_log__title")
    ordering = ("-created_at",)

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_student(user):
            profile = get_student_profile(user)
            return self.queryset.filter(weekly_log__placement__student=profile) if profile else self.queryset.none()
        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if not profile:
                return self.queryset.none()
            return self.queryset.filter(
                weekly_log__placement__supervisor_assignments__supervisor=profile,
                weekly_log__placement__supervisor_assignments__is_active=True,
            ).distinct()
        return self.queryset.none()

    def perform_create(self, serializer):
        if is_supervisor(self.request.user):
            serializer.save(supervisor=get_supervisor_profile(self.request.user))
        else:
            serializer.save()


class EvaluationCriterionViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = EvaluationCriterion.objects.all()
    serializer_class = EvaluationCriterionSerializer
    permission_classes = [IsAuthenticated, EvaluationCriterionPermission]
    search_fields = ("criterion_name", "criterion_group")
    ordering = ("criterion_group", "criterion_name")


class EvaluationViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = Evaluation.objects.select_related(
        "placement__student__user",
        "placement__company",
        "evaluator__user",
    ).prefetch_related("scores__criterion")
    serializer_class = EvaluationSerializer
    permission_classes = [IsAuthenticated, EvaluationPermission]
    search_fields = ("evaluation_type", "status", "placement__student__registration_number", "evaluator__user__username")
    ordering = ("-created_at",)

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_student(user):
            profile = get_student_profile(user)
            return self.queryset.filter(placement__student=profile) if profile else self.queryset.none()
        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if not profile:
                return self.queryset.none()
            return self.queryset.filter(
                placement__supervisor_assignments__supervisor=profile,
                placement__supervisor_assignments__is_active=True,
            ).distinct()
        return self.queryset.none()

    def perform_create(self, serializer):
        if is_supervisor(self.request.user):
            serializer.save(evaluator=get_supervisor_profile(self.request.user))
        else:
            serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        evaluation = self.get_object()
        if not (
            is_administrator(request.user)
            or (
                is_supervisor(request.user)
                and get_supervisor_profile(request.user)
                and evaluation.evaluator_id == get_supervisor_profile(request.user).id
            )
        ):
            return Response({"detail": "You cannot submit this evaluation."}, status=status.HTTP_403_FORBIDDEN)
        evaluation.status = EvaluationStatus.SUBMITTED
        evaluation.submitted_at = timezone.now()
        evaluation.save()
        return Response(self.get_serializer(evaluation).data)


class EvaluationScoreViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = EvaluationScore.objects.select_related("evaluation", "criterion")
    serializer_class = EvaluationScoreSerializer
    permission_classes = [IsAuthenticated, EvaluationScorePermission]
    search_fields = ("criterion__criterion_name", "evaluation__evaluation_type")
    ordering = ("evaluation", "criterion")

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_student(user):
            profile = get_student_profile(user)
            return self.queryset.filter(evaluation__placement__student=profile) if profile else self.queryset.none()
        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if not profile:
                return self.queryset.none()
            return self.queryset.filter(evaluation__evaluator=profile)
        return self.queryset.none()


class FinalResultViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = FinalResult.objects.select_related(
        "placement__student__user",
        "placement__company",
        "published_by__user",
    )
    serializer_class = FinalResultSerializer
    permission_classes = [IsAuthenticated, FinalResultPermission]
    search_fields = ("placement__student__registration_number", "placement__company__company_name")
    ordering = ("-published_at",)

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_student(user):
            profile = get_student_profile(user)
            return self.queryset.filter(placement__student=profile) if profile else self.queryset.none()
        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if not profile:
                return self.queryset.none()
            return self.queryset.filter(
                placement__supervisor_assignments__supervisor=profile,
                placement__supervisor_assignments__is_active=True,
            ).distinct()
        return self.queryset.none()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        final_result = self.get_object()
        if not is_administrator(request.user):
            return Response({"detail": "Administrator access is required."}, status=status.HTTP_403_FORBIDDEN)
        final_result.published_by = get_admin_profile(request.user)
        final_result.published_at = timezone.now()
        final_result.save()
        return Response(self.get_serializer(final_result).data)


class AuditLogViewSet(SearchOrderingMixin, viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor", "content_type").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, AuditLogPermission]
    search_fields = ("action", "model_label", "object_id", "actor__username")
    ordering = ("-created_at",)


class ReportDefinitionViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = ReportDefinition.objects.select_related("created_by").all()
    serializer_class = ReportDefinitionSerializer
    permission_classes = [IsAuthenticated, ReportPermission]
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
        serializer = GeneratedReportSerializer(generated_report, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GeneratedReportViewSet(SearchOrderingMixin, viewsets.ReadOnlyModelViewSet):
    queryset = GeneratedReport.objects.select_related("report_definition", "generated_by").all()
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated, ReportPermission]
    search_fields = ("report_definition__name", "status", "output_format")
    ordering = ("-created_at",)
