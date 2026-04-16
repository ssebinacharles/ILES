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

class IsAcademicSupervisor(BasePermission):
    message = "Academic supervisor access is required."

    def has_permission(self, request, view) -> bool:
        return is_academic_supervisor(request.user)

class IsWorkplaceSupervisor(BasePermission):
    message = "Workplace supervisor access is required."

    def has_permission(self, request, view) -> bool:
        return is_workplace_supervisor(request.user)


class UserPermission(BasePermission):
    """Admins manage all users; users may view/update their own account."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj: User) -> bool:
        if is_administrator(request.user):
            return True
        if request.method in SAFE_METHODS or request.method in {"PUT", "PATCH"}:
            return obj.pk == request.user.pk
        return False

class StudentProfilePermission(BasePermission):
    """Admins manage student profiles; students may view/update their own profile."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        if is_administrator(request.user):
            return True
        if is_student(request.user) and obj.user_id == request.user.id:
            return request.method in SAFE_METHODS or request.method in {"PUT", "PATCH"}
        return False

class SupervisorProfilePermission(BasePermission):
    """Admins manage supervisor profiles; supervisors may view/update their own."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        if is_administrator(request.user):
            return True
        if is_supervisor(request.user) and obj.user_id == request.user.id:
            return request.method in SAFE_METHODS or request.method in {"PUT", "PATCH"}
        return False

class AdministratorProfilePermission(BasePermission):
    """Only administrators may access administrator profiles."""

    def has_permission(self, request, view) -> bool:
        return is_administrator(request.user)

    def has_object_permission(self, request, view, obj) -> bool:
        return is_administrator(request.user)


class CompanyPermission(BasePermission):
    """Authenticated users may read companies; admins manage them."""

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return is_administrator(request.user)

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return is_administrator(request.user)

class PlacementPermission(BasePermission):
    """Placement access based on role and ownership/assignment."""

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return is_student(request.user) or is_administrator(request.user)
        return True

    def has_object_permission(self, request, view, obj: InternshipPlacement) -> bool:
        if request.method in SAFE_METHODS:
            return can_access_placement(request.user, obj)
        if is_administrator(request.user):
            return True
        if is_student(request.user):
            profile = get_student_profile(request.user)
            if not profile or obj.student_id != profile.id:
                return False
            return obj.status in {"PENDING", "REJECTED"}
        return False
        
class SupervisorAssignmentPermission(BasePermission):
    """Assignments are managed by admins; assignees and owners may read them."""

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return is_administrator(request.user)

    def has_object_permission(self, request, view, obj: SupervisorAssignment) -> bool:
        if request.method in SAFE_METHODS:
            return can_access_placement(request.user, obj.placement)
        return is_administrator(request.user)

class WeeklyLogPermission(BasePermission):
    """Students manage their own logs, supervisors/admins review them."""

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return is_student(request.user) or is_administrator(request.user)
        return True

    def has_object_permission(self, request, view, obj: WeeklyLog) -> bool:
        if request.method in SAFE_METHODS:
            return can_access_weekly_log(request.user, obj)
        if is_administrator(request.user):
            return True
        if is_student(request.user):
            profile = get_student_profile(request.user)
            if not profile or obj.placement.student_id != profile.id:
                return False
            return obj.status in {"DRAFT", "REJECTED", "SUBMITTED"}
        return False

class FeedbackPermission(BasePermission):
    """Assigned supervisors/admins create feedback; students may view it."""

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return is_supervisor(request.user) or is_administrator(request.user)

    def has_object_permission(self, request, view, obj: Feedback) -> bool:
        if request.method in SAFE_METHODS:
            return can_access_feedback(request.user, obj)
        if is_administrator(request.user):
            return True
        if is_supervisor(request.user):
            profile = get_supervisor_profile(request.user)
            return bool(profile and obj.supervisor_id == profile.id)
        return False

class EvaluationCriterionPermission(BasePermission):
    """Evaluation criteria are readable by authenticated users, writable by admins."""

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return is_administrator(request.user)

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return is_administrator(request.user)

class EvaluationPermission(BasePermission):
    """Evaluations are created by assigned supervisors and managed by admins."""

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return is_supervisor(request.user) or is_administrator(request.user)
        return True
