from __future__ import annotations

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class UserRole(models.TextChoices):
    """Enumeration of the roles supported by the system."""

    STUDENT = "STUDENT", _("Student")
    SUPERVISOR = "SUPERVISOR", _("Supervisor")
    ADMINISTRATOR = "ADMINISTRATOR", _("Administrator")


class User(AbstractUser):

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices)
    phone_number = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ["username"]
        permissions = [
            ("can_manage_roles", "Can manage user roles"),
        ]

    def __str__(self) -> str:  # pragma: no cover - trivial representation
        return f"{self.get_full_name() or self.username} ({self.role})"

    @property
    def is_student(self) -> bool:
        return self.role == UserRole.STUDENT

    @property
    def is_supervisor(self) -> bool:
        return self.role == UserRole.SUPERVISOR

    @property
    def is_administrator(self) -> bool:
        return self.role == UserRole.ADMINISTRATOR


class StudentProfile(TimeStampedModel):
    """Profile information specific to student users."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    registration_number = models.CharField(max_length=50, unique=True)
    course = models.CharField(max_length=150)
    year_of_study = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    department = models.CharField(max_length=150)

    class Meta:
        ordering = ["registration_number"]

    def clean(self) -> None:
        """Ensure that this profile is linked to a student user."""

        if self.user and self.user.role != UserRole.STUDENT:
            raise ValidationError("StudentProfile can only be linked to a STUDENT user.")

    def __str__(self) -> str:  # pragma: no cover - trivial representation
        return f"{self.registration_number} - {self.user.get_full_name() or self.user.username}"


class SupervisorType(models.TextChoices):
    """Type of supervisor assignment."""

    ACADEMIC = "ACADEMIC", _("Academic Supervisor")
    WORKPLACE = "WORKPLACE", _("Workplace Supervisor")


class SupervisorProfile(TimeStampedModel):
    """Profile information for supervisors."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="supervisor_profile",
    )
    supervisor_type = models.CharField(max_length=20, choices=SupervisorType.choices)
    organization_name = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["user__username"]

    def clean(self) -> None:
        """Ensure that this profile is linked to a supervisor user."""

        if self.user and self.user.role != UserRole.SUPERVISOR:
            raise ValidationError("SupervisorProfile can only be linked to a SUPERVISOR user.")

    def __str__(self) -> str:  # pragma: no cover - trivial representation
        return f"{self.user.get_full_name() or self.user.username} - {self.supervisor_type}"


class AdministratorProfile(TimeStampedModel):
    """Profile information for administrative staff."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="administrator_profile",
    )
    office_name = models.CharField(max_length=150, default="Internship Office")

    class Meta:
        ordering = ["user__username"]

    def clean(self) -> None:
        """Ensure that this profile is linked to an administrator user."""

        if self.user and self.user.role != UserRole.ADMINISTRATOR:
            raise ValidationError(
                "AdministratorProfile can only be linked to an ADMINISTRATOR user."
            )

    def __str__(self) -> str:  # pragma: no cover - trivial representation
        return self.user.get_full_name() or self.user.username