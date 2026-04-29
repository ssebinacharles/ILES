from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import (
    UserRole,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
)


def get_user_profile_data(user):
    profile_data = None

    if user.role == UserRole.STUDENT:
        try:
            profile = StudentProfile.objects.get(user=user)
            profile_data = {
                "profile_id": profile.id,
                "registration_number": profile.registration_number,
                "course": profile.course,
                "year_of_study": profile.year_of_study,
                "department": profile.department,
            }
        except StudentProfile.DoesNotExist:
            profile_data = None

    elif user.role == UserRole.SUPERVISOR:
        try:
            profile = SupervisorProfile.objects.get(user=user)
            profile_data = {
                "profile_id": profile.id,
                "supervisor_type": profile.supervisor_type,
                "organization_name": profile.organization_name,
                "title": profile.title,
            }
        except SupervisorProfile.DoesNotExist:
            profile_data = None

    elif user.role == UserRole.ADMINISTRATOR:
        try:
            profile = AdministratorProfile.objects.get(user=user)
            profile_data = {
                "profile_id": profile.id,
                "office_name": profile.office_name,
            }
        except AdministratorProfile.DoesNotExist:
            profile_data = None

    return profile_data


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")
    requested_role = request.data.get("requested_role", "").strip()
    requested_supervisor_type = request.data.get("supervisor_type", "").strip()

    if not username or not password:
        return Response(
            {"detail": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"detail": "This user account is inactive."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # System admin means Django superuser/staff.
    if requested_role == "SYSTEM_ADMIN":
        if not user.is_superuser and not user.is_staff:
            return Response(
                {"detail": "Only system administrators can use this login."},
                status=status.HTTP_403_FORBIDDEN,
            )

    # Normal role checks.
    elif requested_role and user.role != requested_role:
        return Response(
            {
                "detail": f"This login is for {requested_role}, but this account is {user.role}."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # Supervisor type check: ACADEMIC or WORKPLACE.
    if user.role == UserRole.SUPERVISOR and requested_supervisor_type:
        try:
            supervisor_profile = SupervisorProfile.objects.get(user=user)
        except SupervisorProfile.DoesNotExist:
            return Response(
                {"detail": "Supervisor profile not found for this user."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if supervisor_profile.supervisor_type != requested_supervisor_type:
            return Response(
                {
                    "detail": f"This login is for {requested_supervisor_type} supervisor, but this account is {supervisor_profile.supervisor_type}."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    login(request, user)

    return Response(
        {
            "message": "Login successful.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "profile": get_user_profile_data(user),
            },
        },
        status=status.HTTP_200_OK,
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def logout_user(request):
    logout(request)
    return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)