from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet,
    StudentProfileViewSet,
    SupervisorProfileViewSet,
    AdministratorProfileViewSet,
)

router = DefaultRouter()

router.register(r"users", UserViewSet, basename="user")
router.register(r"students", StudentProfileViewSet, basename="student-profile")
router.register(r"supervisors", SupervisorProfileViewSet, basename="supervisor-profile")
router.register(r"administrators", AdministratorProfileViewSet, basename="administrator-profile")

urlpatterns = [
    path("", include(router.urls)),
]