"""
URL configuration for iles_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

# Safe/guarded import: avoid failing project import if IssueViewSet is missing or broken.
try:
    from rest_framework.routers import DefaultRouter
    from issues.views import IssueViewSet  # may raise ImportError
    _issue_viewset_available = True
except Exception:
    IssueViewSet = None
    _issue_viewset_available = False

# Create router only once; register IssueViewSet only if available.
router = DefaultRouter()
if _issue_viewset_available and IssueViewSet is not None:
    router.register(r"issues", IssueViewSet, basename="issue")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/users/", include("users.urls")),
    path("api/issues/", include("issues.urls")),
]
