
from __future__ import annotations
from rest_framework.permissions import IsAuthenticated,AllowAny

from rest_framework.exceptions import ValidationError, PermissionDenied

from users.models import User, UserRole, StudentProfile

from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action

from rest_framework.exceptions import PermissionDenied
from .utils import send_iles_email

from rest_framework.response import Response

from .models import (
    AuditLog,
    Company,
    Evaluation,
    EvaluationCriterion,
    EvaluationScore,
    EvaluationStatus,
    Feedback,
    FeedbackDecision,
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
    WeeklyLogEvaluationSerializer,
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
    serializer_class = InternshipPlacementSerializer
    permission_classes = [IsAuthenticated]
    search_fields = (
        "company__company_name",
        "student__registration_number",
        "student__user__username",
        "workplace_supervisor_name",
        "workplace_supervisor_email",
        "workplace_supervisor_phone",
    )
    ordering = ("-requested_at",)

    def get_queryset(self):
        user = self.request.user

        queryset = InternshipPlacement.objects.select_related(
            "student",
            "student__user",
            "company",
            "approved_by",
            "approved_by__user",
        ).prefetch_related(
            "supervisor_assignments",
            "supervisor_assignments__supervisor",
            "supervisor_assignments__supervisor__user",
        )

        if user.is_superuser or user.is_staff or getattr(user, "role", "") == UserRole.ADMINISTRATOR:
            return queryset

        if getattr(user, "role", "") == UserRole.STUDENT:
            return queryset.filter(student__user=user)

        if getattr(user, "role", "") == UserRole.SUPERVISOR:
            return queryset.filter(
                supervisor_assignments__supervisor__user=user,
                supervisor_assignments__is_active=True,
            ).distinct()

        return InternshipPlacement.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if getattr(user, "role", "") == UserRole.STUDENT:
            student_profile = StudentProfile.objects.filter(user=user).first()

            if not student_profile:
                raise ValidationError("Student profile not found for this user.")

            serializer.save(
                student=student_profile,
                status=PlacementStatus.PENDING,
            )
            return

        serializer.save()


class SupervisorAssignmentViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = SupervisorAssignment.objects.select_related(
        "placement__student__user",
        "placement__company",
        "supervisor__user",
        "assigned_by__user",
    )

    serializer_class = SupervisorAssignmentSerializer
    permission_classes = [IsAuthenticated]

    search_fields = (
        "placement__student__registration_number",
        "placement__company__company_name",
        "supervisor__user__username",
        "assignment_role",
    )

    ordering = ("-assigned_at",)

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or user.is_superuser or is_administrator(user):
            return self.queryset.all().order_by("-assigned_at")

        if is_student(user):
            profile = get_student_profile(user)
            if profile:
                return self.queryset.filter(placement__student=profile).order_by("-assigned_at")
            return self.queryset.none()

        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if profile:
                return self.queryset.filter(supervisor=profile).order_by("-assigned_at")
            return self.queryset.none()

        return self.queryset.none()

    def perform_create(self, serializer):
        if not (self.request.user.is_staff or self.request.user.is_superuser or is_administrator(self.request.user)):
            raise PermissionDenied("Only administrators can assign supervisors.")

        assignment = serializer.save(assigned_by=get_admin_profile(self.request.user))

        send_iles_email(
            "Supervisor assigned",
            f"You have been assigned as {assignment.assignment_role} supervisor for {assignment.placement.student.registration_number}.",
            [assignment.supervisor.user.email],
        )

        send_iles_email(
            "Supervisor assigned to your internship",
            f"{assignment.supervisor.user.username} has been assigned as your {assignment.assignment_role} supervisor.",
            [assignment.placement.student.user.email],
        )


class WeeklyLogViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    serializer_class = WeeklyLogSerializer
    permission_classes = [IsAuthenticated]
    search_fields = (
        "title",
        "placement__student__registration_number",
        "placement__student__user__username",
        "placement__company__company_name",
    )
    ordering = ("placement", "week_number")

    def get_queryset(self):
        user = self.request.user

        queryset = WeeklyLog.objects.select_related(
            "placement",
            "placement__student",
            "placement__student__user",
            "placement__company",
        ).prefetch_related(
            "feedback_entries",
            "feedback_entries__supervisor",
            "feedback_entries__supervisor__user",
        )

        if user.is_superuser or user.is_staff or getattr(user, "role", "") == UserRole.ADMINISTRATOR:
            return queryset

        if getattr(user, "role", "") == UserRole.STUDENT:
            return queryset.filter(placement__student__user=user)

        if getattr(user, "role", "") == UserRole.SUPERVISOR:
            return queryset.filter(
                placement__supervisor_assignments__supervisor__user=user,
                placement__supervisor_assignments__is_active=True,
            ).distinct()

        return WeeklyLog.objects.none()
    
    def notify_assigned_supervisors(self, weekly_log):
        """
        Notify both assigned supervisors when a student submits a weekly log.
        """
        supervisor_emails = (
            SupervisorAssignment.objects
            .filter(
                placement=weekly_log.placement,
                is_active=True,
            )
            .select_related("supervisor__user")
            .exclude(supervisor__user__email="")
            .values_list("supervisor__user__email", flat=True)
        )

        supervisor_emails = list(supervisor_emails)

        if not supervisor_emails:
            return

        student_user = weekly_log.placement.student.user
        student_name = student_user.get_full_name() or student_user.username
        registration_number = weekly_log.placement.student.registration_number
        company_name = weekly_log.placement.company.company_name

        send_iles_email(
            "Weekly log submitted for review",
            (
                f"A weekly log has been submitted for your review.\n\n"
                f"Student: {student_name}\n"
                f"Registration Number: {registration_number}\n"
                f"Company: {company_name}\n"
                f"Week: {weekly_log.week_number}\n"
                f"Title: {weekly_log.title}\n"
                f"Submitted At: {weekly_log.submitted_at}\n\n"
                f"Please log in to ILES to review and provide feedback."
            ),
            supervisor_emails,
        )


    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        weekly_log = self.get_object()

        was_already_submitted = weekly_log.status == WeeklyLogStatus.SUBMITTED

        if weekly_log.status != WeeklyLogStatus.SUBMITTED:
            weekly_log.status = WeeklyLogStatus.SUBMITTED

        if not weekly_log.submitted_at:
            weekly_log.submitted_at = timezone.now()

        weekly_log.save(update_fields=["status", "submitted_at", "updated_at"])

        if not was_already_submitted:
            self.notify_assigned_supervisors(weekly_log)

        return Response(self.get_serializer(weekly_log).data)
    
    @action(detail=False, methods=["get"], url_path="my-evaluations")
    def my_evaluations(self, request):
       
        if not is_student(request.user):
            return Response(
                {"detail": "Only students can access their own evaluations."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_profile = get_student_profile(request.user)

        if not student_profile:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        weekly_logs = (
            WeeklyLog.objects.select_related(
                "placement",
                "placement__student",
                "placement__student__user",
                "placement__company",
            )
            .prefetch_related(
                "feedback_entries",
                "feedback_entries__supervisor",
                "feedback_entries__supervisor__user",
            )
            .filter(
                placement__student=student_profile,
                status__in=[
                    WeeklyLogStatus.SUBMITTED,
                    WeeklyLogStatus.UNDER_REVIEW,
                    WeeklyLogStatus.APPROVED,
                ],
            )
            .order_by("placement", "week_number")
        )

        assessed_weekly_logs = [
            weekly_log for weekly_log in weekly_logs
            if weekly_log.is_fully_assessed()
        ]

        serializer = WeeklyLogEvaluationSerializer(
            assessed_weekly_logs,
            many=True,
            context=self.get_serializer_context(),
        )

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="student/(?P<student_id>[^/.]+)/evaluations",
    )
    def student_evaluations(self, request, student_id=None):
        
        if not (
            request.user.is_staff
            or request.user.is_superuser
            or is_administrator(request.user)
        ):
            return Response(
                {"detail": "Administrator access is required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_profile = StudentProfile.objects.filter(id=student_id).first()

        if not student_profile:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        weekly_logs = (
            WeeklyLog.objects.select_related(
                "placement",
                "placement__student",
                "placement__student__user",
                "placement__company",
            )
            .prefetch_related(
                "feedback_entries",
                "feedback_entries__supervisor",
                "feedback_entries__supervisor__user",
            )
            .filter(
                placement__student=student_profile,
                status__in=[
                    WeeklyLogStatus.SUBMITTED,
                    WeeklyLogStatus.UNDER_REVIEW,
                    WeeklyLogStatus.APPROVED,
                ],
            )
            .order_by("placement", "week_number")
        )

        assessed_weekly_logs = [
            weekly_log for weekly_log in weekly_logs
            if weekly_log.is_fully_assessed()
        ]

        serializer = WeeklyLogEvaluationSerializer(
            assessed_weekly_logs,
            many=True,
            context=self.get_serializer_context(),
        )

        return Response(serializer.data)

class FeedbackViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = Feedback.objects.select_related(
        "weekly_log__placement__student__user",
        "weekly_log__placement__company",
        "supervisor__user",
    )

    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    search_fields = (
        "decision",
        "comment",
        "supervisor__user__username",
        "weekly_log__title",
    )

    ordering = ("-created_at",)

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or user.is_superuser or is_administrator(user):
            return self.queryset.all().order_by("-created_at")

        if is_student(user):
            profile = get_student_profile(user)
            if profile:
                return self.queryset.filter(
                    weekly_log__placement__student=profile
                ).order_by("-created_at")
            return self.queryset.none()

        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if profile:
                return self.queryset.filter(
                    weekly_log__placement__supervisor_assignments__supervisor=profile,
                    weekly_log__placement__supervisor_assignments__is_active=True,
                ).distinct().order_by("-created_at")
            return self.queryset.none()

        return self.queryset.none()

    def perform_create(self, serializer):
        if not is_supervisor(self.request.user):
            raise PermissionDenied("Only supervisors can submit feedback.")

        feedback = serializer.save(supervisor=get_supervisor_profile(self.request.user))

        if feedback.decision == FeedbackDecision.APPROVED:
            feedback.weekly_log.status = WeeklyLogStatus.APPROVED
            feedback.weekly_log.save()

        if feedback.decision == FeedbackDecision.REJECTED:
            feedback.weekly_log.status = WeeklyLogStatus.REJECTED
            feedback.weekly_log.save()

        final_result, created = FinalResult.objects.get_or_create(
            placement=feedback.weekly_log.placement
        )
        final_result.save()

        student_email = feedback.weekly_log.placement.student.user.email

        if student_email:
            supervisor_user = feedback.supervisor.user
            supervisor_name = supervisor_user.get_full_name() or supervisor_user.username

            send_iles_email(
                "New supervisor feedback received",
                (
                    f"New feedback has been added to your weekly log.\n\n"
                    f"Week: {feedback.weekly_log.week_number}\n"
                    f"Title: {feedback.weekly_log.title}\n"
                    f"Supervisor: {supervisor_name}\n"
                    f"Decision: {feedback.decision}\n"
                    f"Score: {feedback.score if feedback.score is not None else 'No score'}\n"
                    f"Comment: {feedback.comment}\n\n"
                    f"Please log in to ILES to view the feedback."
                ),
                [student_email],
            )


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
    permission_classes = [IsAuthenticated]

    search_fields = (
        "evaluation_type",
        "status",
        "placement__student__registration_number",
        "evaluator__user__username",
    )

    ordering = ("-created_at",)

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or user.is_superuser or is_administrator(user):
            return self.queryset.all().order_by("-created_at")

        if is_student(user):
            profile = get_student_profile(user)
            if profile:
                return self.queryset.filter(placement__student=profile).order_by("-created_at")
            return self.queryset.none()

        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if profile:
                return self.queryset.filter(
                    placement__supervisor_assignments__supervisor=profile,
                    placement__supervisor_assignments__is_active=True,
                ).distinct().order_by("-created_at")
            return self.queryset.none()

        return self.queryset.none()

    def perform_create(self, serializer):
        if is_supervisor(self.request.user):
            evaluation = serializer.save(evaluator=get_supervisor_profile(self.request.user))
        elif self.request.user.is_staff or self.request.user.is_superuser or is_administrator(self.request.user):
            evaluation = serializer.save()
        else:
            raise PermissionDenied("Only supervisors or administrators can create evaluations.")

        admin_emails = User.objects.filter(
            role=UserRole.ADMINISTRATOR,
        ).exclude(email="").values_list("email", flat=True)

        send_iles_email(
            "Supervisor evaluation submitted",
            f"An evaluation was submitted for {evaluation.placement.student.registration_number}.",
            admin_emails,
        )

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
    )

    serializer_class = FinalResultSerializer
    permission_classes = [IsAuthenticated]

    search_fields = (
        "placement__student__registration_number",
        "placement__company__company_name",
    )

    ordering = ("-published_at", "-created_at")

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or user.is_superuser or is_administrator(user):
            return self.queryset.all().order_by("-published_at", "-created_at")

        if is_student(user):
            profile = get_student_profile(user)
            if profile:
                return self.queryset.filter(placement__student=profile).order_by(
                    "-published_at", "-created_at"
                )
            return self.queryset.none()

        if is_supervisor(user):
            profile = get_supervisor_profile(user)
            if profile:
                return self.queryset.filter(
                    placement__supervisor_assignments__supervisor=profile,
                    placement__supervisor_assignments__is_active=True,
                ).distinct().order_by("-published_at", "-created_at")
            return self.queryset.none()

        return self.queryset.none()

    @action(detail=False, methods=["get"], url_path="my-results")
    def my_results(self, request):
        if not is_student(request.user):
            return Response(
                {"detail": "Only students can access their own results."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_profile = get_student_profile(request.user)

        if not student_profile:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        placement = (
            InternshipPlacement.objects
            .filter(student=student_profile)
            .order_by("-created_at")
            .first()
        )

        if not placement:
            return Response(
                {"detail": "No internship placement found for this student."},
                status=status.HTTP_404_NOT_FOUND,
            )

        final_result, created = FinalResult.objects.get_or_create(
            placement=placement
        )

        final_result.weekly_logs_score = final_result.calculate_weekly_logs_average()
        final_result.recalculate_final_mark()
        final_result.save()

        serializer = self.get_serializer(final_result)
        return Response(serializer.data)
    
    @action(
        detail=False,
        methods=["get"],
        url_path="student/(?P<student_id>[^/.]+)/result",
    )
    def student_result(self, request, student_id=None):
        
        if not (
            request.user.is_staff
            or request.user.is_superuser
            or is_administrator(request.user)
        ):
            return Response(
                {"detail": "Administrator access is required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_profile = StudentProfile.objects.filter(id=student_id).first()

        if not student_profile:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        placement = (
            InternshipPlacement.objects
            .filter(student=student_profile)
            .order_by("-created_at")
            .first()
        )

        if not placement:
            return Response(
                {"detail": "No internship placement found for this student."},
                status=status.HTTP_404_NOT_FOUND,
            )

        final_result, created = FinalResult.objects.get_or_create(
            placement=placement
        )

        final_result.save()

        serializer = self.get_serializer(final_result)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        final_result = self.get_object()

        if not (request.user.is_staff or request.user.is_superuser or is_administrator(request.user)):
            return Response(
                {"detail": "Administrator access is required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        final_result.published_by = get_admin_profile(request.user)
        final_result.published_at = timezone.now()
        final_result.save()

        send_iles_email(
            "Final internship result published",
            f"Your final internship mark is {final_result.final_mark}.",
            [final_result.placement.student.user.email],
        )

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