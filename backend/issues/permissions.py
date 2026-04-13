from __future__ import annotations

from typing import Optional

from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import (
    AdministratorProfile,
    Evaluation,
    EvaluationScore,
    Feedback,
    FinalResult,
    InternshipPlacement,
    SupervisorAssignment,
    SupervisorProfile,
    SupervisorType,
    User,
    UserRole,
    WeeklyLog,
)


def get_student_profile(user: User):
    """Return the student's profile if available, otherwise ``None``."""
    return getattr(user, "student_profile", None)


def get_supervisor_profile(user: User):
    """Return the supervisor's profile if available, otherwise ``None``."""
    return getattr(user, "supervisor_profile", None)


def get_admin_profile(user: User):
    """Return the administrator profile if available, otherwise ``None``."""
    return getattr(user, "administrator_profile", None)


def is_administrator(user: User) -> bool:
    return bool(user and user.is_authenticated and user.role == UserRole.ADMINISTRATOR)


def is_student(user: User) -> bool:
    return bool(user and user.is_authenticated and user.role == UserRole.STUDENT)


def is_supervisor(user: User) -> bool:
    return bool(user and user.is_authenticated and user.role == UserRole.SUPERVISOR)


def is_academic_supervisor(user: User) -> bool:
    profile = get_supervisor_profile(user)
    return bool(is_supervisor(user) and profile and profile.supervisor_type == SupervisorType.ACADEMIC)


def is_workplace_supervisor(user: User) -> bool:
    profile = get_supervisor_profile(user)
    return bool(is_supervisor(user) and profile and profile.supervisor_type == SupervisorType.WORKPLACE)


def supervisor_assigned_to_placement(user: User, placement: InternshipPlacement) -> bool:
    """Check whether the current supervisor is actively assigned to a placement."""
    profile = get_supervisor_profile(user)
    if not profile:
        return False
    return SupervisorAssignment.objects.filter(
        placement=placement,
        supervisor=profile,
        is_active=True,
    ).exists()


def can_access_placement(user: User, placement: InternshipPlacement) -> bool:
    """Return whether the user may view a placement."""
    if is_administrator(user):
        return True
    if is_student(user):
        profile = get_student_profile(user)
        return bool(profile and placement.student_id == profile.id)
    if is_supervisor(user):
        return supervisor_assigned_to_placement(user, placement)
    return False


def can_access_weekly_log(user: User, weekly_log: WeeklyLog) -> bool:
    return can_access_placement(user, weekly_log.placement)


def can_access_feedback(user: User, feedback: Feedback) -> bool:
    return can_access_weekly_log(user, feedback.weekly_log)


def can_access_evaluation(user: User, evaluation: Evaluation) -> bool:
    if can_access_placement(user, evaluation.placement):
        return True
    if is_supervisor(user):
        profile = get_supervisor_profile(user)
        return bool(profile and evaluation.evaluator_id == profile.id)
    return False


def can_access_evaluation_score(user: User, evaluation_score: EvaluationScore) -> bool:
    return can_access_evaluation(user, evaluation_score.evaluation)


def can_access_final_result(user: User, final_result: FinalResult) -> bool:
    return can_access_placement(user, final_result.placement)


class IsAdministrator(BasePermission):
    message = "Administrator access is required."

    def has_permission(self, request, view) -> bool:
        return is_administrator(request.user)


class IsStudent(BasePermission):
    message = "Student access is required."

    def has_permission(self, request, view) -> bool:
        return is_student(request.user)


class IsSupervisor(BasePermission):
    message = "Supervisor access is required."

    def has_permission(self, request, view) -> bool:
        return is_supervisor(request.user)
