from __future__ import annotations

from rest_framework import filters, viewsets
from rest_framework.permissions import AllowAny

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


class SearchOrderingMixin:
    """Shared mixin to enable search and ordering in viewsets."""

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering = ("-id",)


class UserViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    search_fields = ("username", "first_name", "last_name", "email", "role")
    ordering = ("username",)

    def get_queryset(self):
        return User.objects.all().order_by("username")


class StudentProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related("user").all()
    serializer_class = StudentProfileSerializer
    permission_classes = [AllowAny]
    search_fields = (
        "registration_number",
        "course",
        "department",
        "user__username",
        "user__email",
    )
    ordering = ("registration_number",)

    def get_queryset(self):
        return StudentProfile.objects.select_related("user").all().order_by(
            "registration_number"
        )


class SupervisorProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = SupervisorProfile.objects.select_related("user").all()
    serializer_class = SupervisorProfileSerializer
    permission_classes = [AllowAny]
    search_fields = (
        "organization_name",
        "title",
        "user__username",
        "user__email",
        "supervisor_type",
    )
    ordering = ("user__username",)

    def get_queryset(self):
        return SupervisorProfile.objects.select_related("user").all().order_by(
            "user__username"
        )


class AdministratorProfileViewSet(SearchOrderingMixin, viewsets.ModelViewSet):
    queryset = AdministratorProfile.objects.select_related("user").all()
    serializer_class = AdministratorProfileSerializer
    permission_classes = [AllowAny]
    search_fields = ("office_name", "user__username", "user__email")
    ordering = ("user__username",)

    def get_queryset(self):
        return AdministratorProfile.objects.select_related("user").all().order_by(
            "user__username"
        )