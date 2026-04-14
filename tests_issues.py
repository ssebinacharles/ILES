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

        self.company = Company.objects.create(
            company_name="Acme Corp",
            location="Kampala",
            contact_email="info@acme.com",
        )

        self.placement = InternshipPlacement.objects.create(
            student=self.student_profile,
            company=self.company,
            approved_by=self.admin_profile,
            org_department="IT",
            start_date="2026-06-01",
            end_date="2026-08-31",
            status=PlacementStatus.APPROVED,
        )
        self.other_placement = InternshipPlacement.objects.create(
            student=self.other_student_profile,
            company=self.company,
            approved_by=self.admin_profile,
            org_department="Finance",
            start_date="2026-06-01",
            end_date="2026-08-31",
            status=PlacementStatus.APPROVED,
        )

        self.academic_assignment = SupervisorAssignment.objects.create(
            placement=self.placement,
            supervisor=self.academic_profile,
            assigned_by=self.admin_profile,
            assignment_role=SupervisorType.ACADEMIC,
            is_active=True,
        )
        self.workplace_assignment = SupervisorAssignment.objects.create(
            placement=self.placement,
            supervisor=self.workplace_profile,
            assigned_by=self.admin_profile,
            assignment_role=SupervisorType.WORKPLACE,
            is_active=True,
        )

        self.weekly_log = WeeklyLog.objects.create(
            placement=self.placement,
            week_number=1,
            title="Week 1",
            activities="Installed software and configured systems.",
            challenges="Limited internet connectivity.",
            lessons_learned="Improved troubleshooting skills.",
            status=WeeklyLogStatus.DRAFT,
        )

        self.criterion = EvaluationCriterion.objects.create(
            criterion_name="Professionalism",
            criterion_group="SUPERVISOR_EVALUATION",
            weight_percent=Decimal("50.00"),
            is_active=True,
        )
        self.evaluation = Evaluation.objects.create(
            placement=self.placement,
            evaluator=self.academic_profile,
            evaluation_type=EvaluationType.ACADEMIC_EVALUATION,
            remarks="Good progress.",
        )
