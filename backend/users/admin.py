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
