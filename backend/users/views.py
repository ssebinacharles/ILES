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
