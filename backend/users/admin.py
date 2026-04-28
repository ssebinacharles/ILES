from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import (
    User,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "phone_number",
        "is_active",
        "is_staff",
        "is_verified",
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_verified",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
        "phone_number",
    )

    ordering = ("username",)

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal information"),
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "phone_number",
                    "role",
                    "is_verified",
                )
            },
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "role",
                    "phone_number",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "registration_number",
        "course",
        "year_of_study",
        "department",
    )

    search_fields = (
        "user__username",
        "user__email",
        "registration_number",
        "course",
        "department",
    )

    list_filter = (
        "course",
        "department",
        "year_of_study",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(SupervisorProfile)
class SupervisorProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "supervisor_type",
        "organization_name",
        "title",
    )

    search_fields = (
        "user__username",
        "user__email",
        "organization_name",
        "title",
    )

    list_filter = (
        "supervisor_type",
        "organization_name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(AdministratorProfile)
class AdministratorProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "office_name",
    )

    search_fields = (
        "user__username",
        "user__email",
        "office_name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


admin.site.site_header = _("Internship Learning Evaluation System")
admin.site.site_title = _("ILES Admin Portal")
admin.site.index_title = _("Administration")