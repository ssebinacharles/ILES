from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .auth_views import login_view, logout_view, current_user_view, register_view

from .views import (
    UserViewSet,
    StudentProfileViewSet,
    SupervisorProfileViewSet,
    AdministratorProfileViewSet,
)


router = DefaultRouter()

router.register(r"users", UserViewSet, basename="users")
router.register(r"students", StudentProfileViewSet, basename="students")
router.register(r"supervisors", SupervisorProfileViewSet, basename="supervisors")
router.register(r"administrators", AdministratorProfileViewSet, basename="administrators")


urlpatterns = [
    # Authentication endpoints
    path("auth/login/", login_view, name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/me/", current_user_view, name="current-user"),
    path("auth/register/", register_view, name="register"),

    # ViewSet endpoints
    path("", include(router.urls)),
]