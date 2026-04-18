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
