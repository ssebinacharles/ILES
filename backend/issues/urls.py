from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdministratorProfileViewSet,
    AuditLogViewSet,
    CompanyViewSet,
    EvaluationCriterionViewSet,
    EvaluationScoreViewSet,
    EvaluationViewSet,
    FeedbackViewSet,
    FinalResultViewSet,
    GeneratedReportViewSet,
    InternshipPlacementViewSet,
    ReportDefinitionViewSet,
    StudentProfileViewSet,
    SupervisorAssignmentViewSet,
    SupervisorProfileViewSet,
    UserViewSet,
    WeeklyLogViewSet,
)

app_name = "issues"

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="users")
router.register(r"student-profiles", StudentProfileViewSet, basename="student-profiles")
router.register(r"supervisor-profiles", SupervisorProfileViewSet, basename="supervisor-profiles")
router.register(r"administrator-profiles", AdministratorProfileViewSet, basename="administrator-profiles")
router.register(r"companies", CompanyViewSet, basename="companies")
router.register(r"placements", InternshipPlacementViewSet, basename="placements")
router.register(r"supervisor-assignments", SupervisorAssignmentViewSet, basename="supervisor-assignments")
router.register(r"weekly-logs", WeeklyLogViewSet, basename="weekly-logs")
router.register(r"feedback", FeedbackViewSet, basename="feedback")
router.register(r"evaluation-criteria", EvaluationCriterionViewSet, basename="evaluation-criteria")
router.register(r"evaluations", EvaluationViewSet, basename="evaluations")
router.register(r"evaluation-scores", EvaluationScoreViewSet, basename="evaluation-scores")
router.register(r"final-results", FinalResultViewSet, basename="final-results")
router.register(r"audit-logs", AuditLogViewSet, basename="audit-logs")
router.register(r"report-definitions", ReportDefinitionViewSet, basename="report-definitions")
router.register(r"generated-reports", GeneratedReportViewSet, basename="generated-reports")

urlpatterns = [
    path("", include(router.urls)),
]
