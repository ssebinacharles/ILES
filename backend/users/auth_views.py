from django.middleware.csrf import get_token
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    UserRole,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
)


def build_user_payload(user):
    payload = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "phone_number": getattr(user, "phone_number", ""),
        "profile": None,
    }

    if user.role == UserRole.STUDENT:
        profile = StudentProfile.objects.filter(user=user).first()

        if profile:
            payload["profile"] = {
                "profile_id": profile.id,
                "registration_number": profile.registration_number,
                "course": profile.course,
                "year_of_study": profile.year_of_study,
                "department": profile.department,
            }

    elif user.role == UserRole.SUPERVISOR:
        profile = SupervisorProfile.objects.filter(user=user).first()

        if profile:
            payload["profile"] = {
                "profile_id": profile.id,
                "supervisor_type": profile.supervisor_type,
                "organization_name": profile.organization_name,
                "title": profile.title,
            }

    elif user.role == UserRole.ADMINISTRATOR:
        profile = AdministratorProfile.objects.filter(user=user).first()

        if profile:
            payload["profile"] = {
                "profile_id": profile.id,
                "office_name": profile.office_name,
            }

    return payload


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    expected_role = request.data.get("role")
    expected_supervisor_type = request.data.get("supervisor_type")

    if not username or not password:
        return Response(
            {"detail": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if expected_role and not user.is_superuser and user.role != expected_role:
        return Response(
            {"detail": f"This account is not registered as {expected_role}."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if user.role == UserRole.SUPERVISOR and expected_supervisor_type:
        profile = SupervisorProfile.objects.filter(user=user).first()

        if not profile:
            return Response(
                {"detail": "Supervisor profile not found."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if profile.supervisor_type != expected_supervisor_type:
            return Response(
                {
                    "detail": f"This supervisor is not a {expected_supervisor_type} supervisor."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    login(request, user)

    csrf_token = get_token(request)

    return Response(
        {
            "message": "Login successful.",
            "csrfToken": csrf_token,
            "user": build_user_payload(user),
        }
    )
    


@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Logout successful."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    return Response(build_user_payload(request.user))