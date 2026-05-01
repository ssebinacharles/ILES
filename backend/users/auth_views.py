from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.middleware.csrf import get_token
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    User,
    UserRole,
    StudentProfile,
    SupervisorProfile,
    AdministratorProfile,
    SupervisorType,
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
def register_view(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")
    phone_number = request.data.get("phone_number", "")
    role = request.data.get("role")

    if not username or not email or not password or not role:
        return Response(
            {
                "detail": "Username, email, password, and role are required."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if role not in [
        UserRole.STUDENT,
        UserRole.SUPERVISOR,
        UserRole.ADMINISTRATOR,
    ]:
        return Response(
            {
                "detail": "Invalid role for self-registration."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                role=role,
                is_verified=True,
            )
            user.set_password(password)
            user.full_clean()
            user.save()

            if role == UserRole.STUDENT:
                registration_number = request.data.get("registration_number")
                course = request.data.get("course")
                year_of_study = request.data.get("year_of_study")
                department = request.data.get("department")

                if not registration_number or not course or not year_of_study or not department:
                    return Response(
                        {
                            "detail": "Registration number, course, year of study, and department are required for students."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                profile = StudentProfile(
                    user=user,
                    registration_number=registration_number,
                    course=course,
                    year_of_study=year_of_study,
                    department=department,
                )
                profile.full_clean()
                profile.save()

            elif role == UserRole.SUPERVISOR:
                supervisor_type = request.data.get("supervisor_type")
                organization_name = request.data.get("organization_name", "")
                title = request.data.get("title", "")

                if supervisor_type not in [
                    SupervisorType.ACADEMIC,
                    SupervisorType.WORKPLACE,
                ]:
                    return Response(
                        {
                            "detail": "Supervisor type must be ACADEMIC or WORKPLACE."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                profile = SupervisorProfile(
                    user=user,
                    supervisor_type=supervisor_type,
                    organization_name=organization_name,
                    title=title,
                )
                profile.full_clean()
                profile.save()

            elif role == UserRole.ADMINISTRATOR:
                office_name = request.data.get("office_name", "Internship Office")

                profile = AdministratorProfile(
                    user=user,
                    office_name=office_name,
                )
                profile.full_clean()
                profile.save()

            login(request, user)
            csrf_token = get_token(request)

            return Response(
                {
                    "message": "Account created successfully.",
                    "csrfToken": csrf_token,
                    "user": build_user_payload(user),
                },
                status=status.HTTP_201_CREATED,
            )

    except IntegrityError:
        return Response(
            {
                "detail": "Username, email, or registration number already exists."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except DjangoValidationError as exc:
        if hasattr(exc, "message_dict"):
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "detail": exc.messages
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

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