from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.models import (
    UserRole,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
)

from .models import (
    InternshipPlacement,
    SupervisorAssignment,
    WeeklyLog,
    Feedback,
    Evaluation,
    EvaluationScore,
    FinalResult,
    AuditLog,
    ReportDefinition,
    GeneratedReport,
)


def is_administrator(user):
    return bool(
        user
        and user.is_authenticated
        and user.role == UserRole.ADMINISTRATOR
    )


def is_student(user):
    return bool(
        user
        and user.is_authenticated
        and user.role == UserRole.STUDENT
    )


def is_supervisor(user):
    return bool(
        user
        and user.is_authenticated
        and user.role == UserRole.SUPERVISOR
    )


def get_student_profile(user):
    if not user or not user.is_authenticated:
        return None

    try:
        return StudentProfile.objects.get(user=user)
    except StudentProfile.DoesNotExist:
        return None


def get_supervisor_profile(user):
    if not user or not user.is_authenticated:
        return None

    try:
        return SupervisorProfile.objects.get(user=user)
    except SupervisorProfile.DoesNotExist:
        return None


def get_admin_profile(user):
    if not user or not user.is_authenticated:
        return None

    try:
        return AdministratorProfile.objects.get(user=user)
    except AdministratorProfile.DoesNotExist:
        return None


def can_access_placement(user, placement):
    """
    Checks whether the logged-in user can access a given internship placement.
    """

    if not user or not user.is_authenticated:
        return False

    if is_administrator(user):
        return True

    if is_student(user):
        student_profile = get_student_profile(user)
        return bool(student_profile and placement.student_id == student_profile.id)

    if is_supervisor(user):
        supervisor_profile = get_supervisor_profile(user)

        if not supervisor_profile:
            return False

        return SupervisorAssignment.objects.filter(
            placement=placement,
            supervisor=supervisor_profile,
            is_active=True,
        ).exists()

    return False


class CompanyPermission(BasePermission):
    """
    Temporary simple company permission.
    Anyone can read companies.
    Only authenticated users can modify.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return bool(request.user and request.user.is_authenticated)


class PlacementPermission(BasePermission):
    """
    Placement access:
    - Admins can access all.
    - Students access their own placements.
    - Supervisors access assigned placements.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return can_access_placement(request.user, obj)


class SupervisorAssignmentPermission(BasePermission):
    """
    Admins can manage assignments.
    Students/supervisors can view related assignments.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user

        if is_administrator(user):
            return True

        if is_student(user):
            student_profile = get_student_profile(user)
            return bool(student_profile and obj.placement.student_id == student_profile.id)

        if is_supervisor(user):
            supervisor_profile = get_supervisor_profile(user)
            return bool(supervisor_profile and obj.supervisor_id == supervisor_profile.id)

        return False


class WeeklyLogPermission(BasePermission):
    """
    Weekly log access is based on the related placement.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return can_access_placement(request.user, obj.placement)


class FeedbackPermission(BasePermission):
    """
    Feedback access is based on the weekly log's placement.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return can_access_placement(request.user, obj.weekly_log.placement)


class EvaluationCriterionPermission(BasePermission):
    """
    All authenticated users can view criteria.
    Admins can modify.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        return is_administrator(request.user)


class EvaluationPermission(BasePermission):
    """
    Evaluation access is based on the related placement.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return can_access_placement(request.user, obj.placement)


class EvaluationScorePermission(BasePermission):
    """
    Evaluation score access is based on the evaluation's placement.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return can_access_placement(request.user, obj.evaluation.placement)


class FinalResultPermission(BasePermission):
    """
    Final result access is based on the related placement.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return can_access_placement(request.user, obj.placement)


class AuditLogPermission(BasePermission):
    """
    Only administrators can view audit logs.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and is_administrator(request.user)
        )

    def has_object_permission(self, request, view, obj):
        return is_administrator(request.user)


class ReportPermission(BasePermission):
    """
    Only administrators can access reports.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and is_administrator(request.user)
        )

    def has_object_permission(self, request, view, obj):
        return is_administrator(request.user)