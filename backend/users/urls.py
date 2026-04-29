from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet,
    StudentProfileViewSet,
    SupervisorProfileViewSet,
    AdministratorProfileViewSet,
)

from .auth_views import login_user, logout_user


router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"students", StudentProfileViewSet, basename="student")
router.register(r"supervisors", SupervisorProfileViewSet, basename="supervisor")
router.register(r"administrators", AdministratorProfileViewSet, basename="administrator")


urlpatterns = [
    path("auth/login/", login_user, name="login-user"),
    path("auth/logout/", logout_user, name="logout-user"),
    path("", include(router.urls)),
]