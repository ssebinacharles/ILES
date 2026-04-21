from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    AdministratorProfile,
    Company,
    Evaluation,
    EvaluationCriterion,
    EvaluationScore,
    EvaluationType,
    FinalResult,
    InternshipPlacement,
    PlacementStatus,
    StudentProfile,
    SupervisorAssignment,
    SupervisorProfile,
    SupervisorType,
    UserRole,
    WeeklyLog,
    WeeklyLogStatus,
)

User = get_user_model()

class BaseILESTestDataMixin:
    """Reusable setup data for API and model tests."""

    def setUp(self):
        super().setUp()

        self.student_user = User.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="Pass1234!",
            role=UserRole.STUDENT,
        )
        self.other_student_user = User.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="Pass1234!",
            role=UserRole.STUDENT,
        )
        self.academic_user = User.objects.create_user(
            username="academic1",
            email="academic1@example.com",
            password="Pass1234!",
            role=UserRole.SUPERVISOR,
        )
        self.workplace_user = User.objects.create_user(
            username="workplace1",
            email="workplace1@example.com",
            password="Pass1234!",
            role=UserRole.SUPERVISOR,
        )
        self.admin_user = User.objects.create_user(
            username="admin1",
            email="admin1@example.com",
            password="Pass1234!",
            role=UserRole.ADMINISTRATOR,
            is_staff=True,
        )

        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            registration_number="2026/001",
            course="BIT",
            year_of_study=3,
            department="Computing",
        )
        self.other_student_profile = StudentProfile.objects.create(
            user=self.other_student_user,
            registration_number="2026/002",
            course="BIT",
            year_of_study=3,
            department="Computing",
        )
        self.academic_profile = SupervisorProfile.objects.create(
            user=self.academic_user,
            supervisor_type=SupervisorType.ACADEMIC,
            organization_name="Makerere University",
            title="Lecturer",
        )
        self.workplace_profile = SupervisorProfile.objects.create(
            user=self.workplace_user,
            supervisor_type=SupervisorType.WORKPLACE,
            organization_name="Acme Corp",
            title="Manager",
        )
        self.admin_profile = AdministratorProfile.objects.create(
            user=self.admin_user,
            office_name="Internship Office",
        )
