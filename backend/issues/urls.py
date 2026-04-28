from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CompanyViewSet,
    InternshipPlacementViewSet,
    SupervisorAssignmentViewSet,
    WeeklyLogViewSet,
    FeedbackViewSet,
    EvaluationCriterionViewSet,
    EvaluationViewSet,
    EvaluationScoreViewSet,
    FinalResultViewSet,
    AuditLogViewSet,
    ReportDefinitionViewSet,
    GeneratedReportViewSet,
)

router = DefaultRouter()

router.register(r"companies", CompanyViewSet, basename="company")
router.register(r"placements", InternshipPlacementViewSet, basename="placement")
router.register(r"supervisor-assignments", SupervisorAssignmentViewSet, basename="supervisor-assignment")
router.register(r"weekly-logs", WeeklyLogViewSet, basename="weekly-log")
router.register(r"feedback", FeedbackViewSet, basename="feedback")
router.register(r"evaluation-criteria", EvaluationCriterionViewSet, basename="evaluation-criterion")
router.register(r"evaluations", EvaluationViewSet, basename="evaluation")
router.register(r"evaluation-scores", EvaluationScoreViewSet, basename="evaluation-score")
router.register(r"final-results", FinalResultViewSet, basename="final-result")
router.register(r"audit-logs", AuditLogViewSet, basename="audit-log")
router.register(r"report-definitions", ReportDefinitionViewSet, basename="report-definition")
router.register(r"generated-reports", GeneratedReportViewSet, basename="generated-report")

urlpatterns = [
    path("", include(router.urls)),
]