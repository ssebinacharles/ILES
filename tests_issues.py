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
class PlacementModelTests(BaseILESTestDataMixin, TestCase):
    """Model-focused tests for score and result calculations."""

    def test_evaluation_score_save_updates_weighted_score(self):
        score = EvaluationScore.objects.create(
            evaluation=self.evaluation,
            criterion=self.criterion,
            raw_score=Decimal("80.00"),
        )
        self.assertEqual(score.weighted_score, Decimal("40.00"))

    def test_final_result_recalculates_total_mark_on_save(self):
        final_result = FinalResult.objects.create(
            placement=self.placement,
            published_by=self.admin_profile,
            weekly_logs_score=Decimal("20.00"),
            supervisor_evaluation_score=Decimal("25.00"),
            final_report_score=Decimal("30.00"),
            workplace_assessment_score=Decimal("15.00"),
        )
        self.assertEqual(final_result.final_mark, Decimal("90.00"))


class PlacementAPITests(BaseILESTestDataMixin, APITestCase):
    """API tests for placements and role-based access."""

    def test_student_sees_only_own_placements(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(reverse("placements-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.placement.id)

    def test_student_cannot_view_other_student_placement_detail(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(reverse("placements-detail", args=[self.other_placement.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_approve_placement(self):
        pending = InternshipPlacement.objects.create(
            student=self.student_profile,
            company=self.company,
            org_department="Networks",
            start_date="2026-09-01",
            end_date="2026-11-30",
            status=PlacementStatus.PENDING,
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(reverse("placements-approve", args=[pending.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending.refresh_from_db()
        self.assertEqual(pending.status, PlacementStatus.APPROVED)
        self.assertEqual(pending.approved_by_id, self.admin_profile.id)


class WeeklyLogAPITests(BaseILESTestDataMixin, APITestCase):
    """API tests for weekly logs and supervisor visibility."""

    def test_student_can_submit_own_weekly_log(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(reverse("weekly-logs-submit", args=[self.weekly_log.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.weekly_log.refresh_from_db()
        self.assertEqual(self.weekly_log.status, WeeklyLogStatus.SUBMITTED)
        self.assertIsNotNone(self.weekly_log.submitted_at)

    def test_assigned_supervisor_can_list_related_weekly_logs(self):
        self.client.force_authenticate(user=self.academic_user)
        response = self.client.get(reverse("weekly-logs-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.weekly_log.id)


class FeedbackAPITests(BaseILESTestDataMixin, APITestCase):
    """API tests for feedback creation."""

    def test_supervisor_can_create_feedback_for_assigned_log(self):
        self.client.force_authenticate(user=self.academic_user)
        response = self.client.post(
            reverse("feedback-list"),
            {
                "weekly_log_id": self.weekly_log.id,
                "decision": "COMMENT",
                "comment": "Good start, add more detail next week.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.weekly_log.feedback_entries.count(), 1)


class EvaluationAPITests(BaseILESTestDataMixin, APITestCase):
    """API tests for evaluations and scores."""

    def test_supervisor_can_create_evaluation_score_for_own_evaluation(self):
        self.client.force_authenticate(user=self.academic_user)
        response = self.client.post(
            reverse("evaluation-scores-list"),
            {
                "evaluation_id": self.evaluation.id,
                "criterion_id": self.criterion.id,
                "raw_score": "80.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.evaluation.refresh_from_db()
        self.assertEqual(self.evaluation.scores.count(), 1)

    def test_supervisor_can_submit_own_evaluation(self):
        self.client.force_authenticate(user=self.academic_user)
        response = self.client.post(reverse("evaluations-submit", args=[self.evaluation.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.evaluation.refresh_from_db()
        self.assertEqual(self.evaluation.status, EvaluationStatus.SUBMITTED)
        self.assertIsNotNone(self.evaluation.submitted_at)


class FinalResultAPITests(BaseILESTestDataMixin, APITestCase):
    """API tests for final result publication and audit visibility."""

    def setUp(self):
        super().setUp()
        self.final_result = FinalResult.objects.create(
            placement=self.placement,
            published_by=None,
            weekly_logs_score=Decimal("20.00"),
            supervisor_evaluation_score=Decimal("20.00"),
            final_report_score=Decimal("30.00"),
            workplace_assessment_score=Decimal("15.00"),
        )

    def test_admin_can_publish_final_result(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(reverse("final-results-publish", args=[self.final_result.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.final_result.refresh_from_db()
        self.assertEqual(self.final_result.published_by_id, self.admin_profile.id)
        self.assertIsNotNone(self.final_result.published_at)

    def test_student_cannot_access_audit_logs(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(reverse("audit-logs-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ReportingAPITests(BaseILESTestDataMixin, APITestCase):
    """API tests for reporting endpoints."""

    def test_admin_can_trigger_report_generation(self):
        report_definition = ReportDefinition.objects.create(
            name="Weekly Summary",
            report_type="INTERNSHIP_PROGRESS",
            frequency="ON_DEMAND",
            created_by=self.admin_user,
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            reverse("report-definitions-run-now", args=[report_definition.id]),
            {"output_format": "PDF"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GeneratedReport.objects.count(), 1)
