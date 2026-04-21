# Create your tests here.
from __future__ import annotations
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    UserRole,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
    SupervisorType,
)


class UserModelTests(TestCase):
    """Tests for the custom ``User`` model."""

    def test_user_creation_and_str(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="jdoe",
            email="jdoe@example.com",
            password="Pass1234!",
            role=UserRole.STUDENT,
        )
        self.assertEqual(user.email, "jdoe@example.com")
        self.assertTrue(user.check_password("Pass1234!"))
        self.assertEqual(user.role, UserRole.STUDENT)
        self.assertEqual(str(user), f"{user.get_full_name() or user.username} ({user.role})")

    def test_email_is_unique(self):
        User = get_user_model()
        User.objects.create_user(
            username="u1",
            email="unique@example.com",
            password="Pass1234!",
            role=UserRole.STUDENT,
        )
        with self.assertRaises(Exception):
            User.objects.create_user(
                username="u2",
                email="unique@example.com",
                password="Pass1234!",
                role=UserRole.SUPERVISOR,
            )

class ProfileModelTests(TestCase):
    """Tests ensuring that profiles enforce correct user roles."""

    def setUp(self):
        User = get_user_model()
        self.student_user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="Pass1234!",
            role=UserRole.STUDENT,
        )
        self.supervisor_user = User.objects.create_user(
            username="supervisor",
            email="supervisor@example.com",
            password="Pass1234!",
            role=UserRole.SUPERVISOR,
        )
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="Pass1234!",
            role=UserRole.ADMINISTRATOR,
        )

    def test_student_profile_role_validation(self):
        # Valid linkage to student user
        profile = StudentProfile(
            user=self.student_user,
            registration_number="2026/001",
            course="BIT",
            year_of_study=3,
            department="Computing",
        )
        profile.full_clean()  # should not raise
        profile.save()
        # Invalid linkage to a non‑student user
        profile.user = self.supervisor_user
        with self.assertRaises(ValidationError):
            profile.full_clean()

def test_supervisor_profile_role_validation(self):
        # Valid linkage to supervisor user
        profile = SupervisorProfile(
            user=self.supervisor_user,
            supervisor_type=SupervisorType.ACADEMIC,
            organization_name="Acme University",
            title="Lecturer",
        )
        profile.full_clean()
        profile.save()
        # Invalid linkage to a non‑supervisor user
        profile.user = self.student_user
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_admin_profile_role_validation(self):
        # Valid linkage to administrator user
        profile = AdministratorProfile(user=self.admin_user, office_name="Internship Office")
        profile.full_clean()
        profile.save()
        # Invalid linkage to a non‑admin user
        profile.user = self.student_user
        with self.assertRaises(ValidationError):
            profile.full_clean()


class UserViewSetAPITests(APITestCase):
    """API tests for the user listing endpoint."""

    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="Pass1234!",
            role=UserRole.ADMINISTRATOR,
            is_staff=True,
            is_superuser=True,
        )
        self.student_user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="Pass1234!",
            role=UserRole.STUDENT,
        )
def test_admin_can_list_all_users(self):
        self.client.force_authenticate(user=self.admin_user)
        # The default router will register the UserViewSet under the basename "user"
        url = reverse("user-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_non_admin_sees_only_self(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse("user-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], self.student_user.username)
