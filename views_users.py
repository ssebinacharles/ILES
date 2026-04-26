from __future__ import annotations

from django.utils import timezone  # noqa: F401  # imported for completeness
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    User,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
)
from .serializers import (
    UserSerializer,
    StudentProfileSerializer,
    SupervisorProfileSerializer,
    AdministratorProfileSerializer,
)
from .permissions import (  # type: ignore  # these are expected to exist in the project
    UserPermission,
    StudentProfilePermission,
    SupervisorProfilePermission,
    AdministratorProfilePermission,
    is_administrator,
    is_student,
    is_supervisor,
    get_student_profile,
    get_supervisor_profile,
    get_admin_profile,
)


class SearchOrderingMixin:
    """Shared mixin to enable search and ordering in viewsets."""

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # Default ordering can be overridden per viewset
    ordering = ("-id",)


class UserViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    """Viewset for CRUD operations on :class:`User` instances."""

    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, UserPermission]
    search_fields = ("username", "first_name", "last_name", "email")
    ordering = ("username",)

    def get_queryset(self):
        # Administrators can view all users, others can only see themselves
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        return self.queryset.filter(pk=user.pk)


class StudentProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    """Viewset for CRUD operations on :class:`StudentProfile` instances."""

    queryset = StudentProfile.objects.select_related("user").all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated, StudentProfilePermission]
    search_fields = (
        "registration_number",
        "course",
        "department",
        "user__username",
    )

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_student(user):
            # A student may only see their own profile
            profile = get_student_profile(user)
            if profile is not None:
                return self.queryset.filter(user=user)
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        # If a student is creating their own profile, automatically link it
        if is_student(user):
            serializer.save(user=user)
        else:
            serializer.save()


class SupervisorProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    """Viewset for CRUD operations on :class:`SupervisorProfile` instances."""

    queryset = SupervisorProfile.objects.select_related("user").all()
    serializer_class = SupervisorProfileSerializer
    permission_classes = [IsAuthenticated, SupervisorProfilePermission]
    search_fields = (
        "organization_name",
        "title",
        "user__username",
    )

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        if is_supervisor(user):
            # Supervisors only see their own profile
            return self.queryset.filter(user=user)
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if is_supervisor(user):
            serializer.save(user=user)
        else:
            serializer.save()


class AdministratorProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    """Viewset for CRUD operations on :class:`AdministratorProfile` instances."""

    queryset = AdministratorProfile.objects.select_related("user").all()
    serializer_class = AdministratorProfileSerializer
    permission_classes = [IsAuthenticated, AdministratorProfilePermission]
    search_fields = ("office_name", "user__username")

    def get_queryset(self):
        user = self.request.user
        if is_administrator(user):
            return self.queryset
        return self.queryset.none()
