from rest_framework.permissions import BasePermission

from .models import (
    UserRole,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
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


class UserPermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if is_administrator(request.user):
            return True

        return obj == request.user


class StudentProfilePermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if is_administrator(request.user):
            return True

        if is_student(request.user):
            return obj.user == request.user

        return False


class SupervisorProfilePermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if is_administrator(request.user):
            return True

        if is_supervisor(request.user):
            return obj.user == request.user

        return False


class AdministratorProfilePermission(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and is_administrator(request.user)
        )

    def has_object_permission(self, request, view, obj):
        return is_administrator(request.user)