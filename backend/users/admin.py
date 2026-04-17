from django.contrib import admin
from __future__ import annotations

from typing import Any

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import (
    User,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
)

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin): 
# Register your models here.
    model = User
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_staff",
        "is_active",
    )
    list_filter = ("role", "is_staff", "is_active", "is_superuser")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)

    # Extend the default fieldsets to expose our custom fields when
    # editing an existing user.
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            _("Additional information"),
            {
                "fields": (
                    "role",
                    "phone_number",
                    "is_verified",
                ),
            },
        ),
    )

    
add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            _("Additional information"),
            {
                "classes": ("wide",),
                "fields": ("role", "phone_number"),
            },
        ),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    """Admin configuration for student profiles."""
    list_display = (
        "user",
        "registration_number",
        "course",
        "year_of_study",
        "department",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "user__username",
        "registration_number",
        "course",
        "department",
    )
    list_filter = ("course", "year_of_study", "department")
    readonly_fields = ("created_at", "updated_at")


@admin.register(SupervisorProfile)
class SupervisorProfileAdmin(admin.ModelAdmin):
    """Admin configuration for supervisor profiles."""

    list_display = (
        "user",
        "supervisor_type",
        "organization_name",
        "title",
        "created_at",
        "updated_at",
    )
    