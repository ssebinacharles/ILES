from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
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
    SupervisorAssignmentViewSet,
    WeeklyLogViewSet,
)

router = DefaultRouter()

router.register("companies", CompanyViewSet, basename="company")
router.register("placements", InternshipPlacementViewSet, basename="placement")
router.register(
    "supervisor-assignments",
    SupervisorAssignmentViewSet,
    basename="supervisor-assignment",
)
router.register("weekly-logs", WeeklyLogViewSet, basename="weekly-log")
router.register("feedback", FeedbackViewSet, basename="feedback")
router.register(
    "evaluation-criteria",
    EvaluationCriterionViewSet,
    basename="evaluation-criterion",
)
router.register("evaluations", EvaluationViewSet, basename="evaluation")
router.register(
    "evaluation-scores",
    EvaluationScoreViewSet,
    basename="evaluation-score",
)
router.register("final-results", FinalResultViewSet, basename="final-result")
router.register("audit-logs", AuditLogViewSet, basename="audit-log")
router.register(
    "report-definitions",
    ReportDefinitionViewSet,
    basename="report-definition",
)
router.register(
    "generated-reports",
    GeneratedReportViewSet,
    basename="generated-report",
)

urlpatterns = [
    path("", include(router.urls)),
]