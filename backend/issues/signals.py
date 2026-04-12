from __future__ import annotations

from typing import Any, Dict

from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.signals import (
    pre_save,
    post_save,
    post_delete,
)
from django.dispatch import receiver

from .models import (
    AuditLog,
    AuditAction,
    WeeklyLog,
    WeeklyLogStatus,
    Feedback,
    EvaluationScore,
    Evaluation,
    FinalResult,
)

def _model_label(instance: models.Model) -> str:
    
    meta = instance._meta
    return f"{meta.app_label}.{meta.object_name}"

def _capture_snapshot(instance: models.Model) -> Dict[str, Any]:
    
    snapshot: Dict[str, Any] = {}
    for field in instance._meta.fields:
        field_name = field.name
        # Use getattr to handle deferred fields and descriptors.
        snapshot[field_name] = getattr(instance, field_name)
    return snapshot

@receiver(pre_save)
def capture_pre_save_snapshot(sender: type[models.Model], instance: models.Model, **kwargs: Any) -> None:
    
    if not isinstance(instance, models.Model) or instance._meta.app_label != "issues":
        return
    # Store the snapshot on the instance for later comparison
    instance._pre_save_snapshot = _capture_snapshot(instance)

@receiver(post_save)
def create_audit_log_on_save(sender: type[models.Model], instance: models.Model, created: bool, **kwargs: Any) -> None:
    
    if not isinstance(instance, models.Model) or instance._meta.app_label != "issues":
        return
    # Do not audit the AuditLog model itself
    if isinstance(instance, AuditLog):
        return

    # Determine action type
    action = AuditAction.CREATE if created else AuditAction.UPDATE
    # Compute changed fields if possible
    changes: Dict[str, Any] = {}
    # Snapshot may not exist on brand new objects created outside of Django forms
    old_state: Dict[str, Any] | None = getattr(instance, "_pre_save_snapshot", None)
    if old_state is not None:
        new_state = _capture_snapshot(instance)
        for field_name, old_value in old_state.items():
            new_value = new_state.get(field_name)
            if new_value != old_value:
                changes[field_name] = {"from": old_value, "to": new_value}
    # Create the audit log record
    AuditLog.objects.create(
        actor=getattr(instance, "updated_by", None),
        action=action,
        content_type=ContentType.objects.get_for_model(instance),
        object_id=str(instance.pk),
        model_label=_model_label(instance),
        changes=changes,
    )

@receiver(post_delete)
def create_audit_log_on_delete(sender: type[models.Model], instance: models.Model, **kwargs: Any) -> None:
    """Create an ``AuditLog`` entry whenever a model in this app is deleted."""
    if not isinstance(instance, models.Model) or instance._meta.app_label != "issues":
        return
    if isinstance(instance, AuditLog):
        return
    AuditLog.objects.create(
        actor=getattr(instance, "updated_by", None),
        action=AuditAction.DELETE,
        content_type=ContentType.objects.get_for_model(instance),
        object_id=str(instance.pk),
        model_label=_model_label(instance),
        changes={},
    )

@receiver(post_save, sender=Feedback)
def update_feedback_latest(sender: type[Feedback], instance: Feedback, **kwargs: Any) -> None:
    
    Feedback.objects.filter(
        weekly_log=instance.weekly_log,
    ).exclude(pk=instance.pk).update(is_latest=False)

@receiver(post_save, sender=EvaluationScore)
@receiver(post_delete, sender=EvaluationScore)
def recalculate_evaluation_totals(sender: type[EvaluationScore], instance: EvaluationScore, **kwargs: Any) -> None:
    
    evaluation = instance.evaluation
    # Use the model's helper to recalculate
    try:
        evaluation.recalculate_scores()
    except Exception:
        pass
    evaluation.save(update_fields=["total_score", "weighted_score"])

@receiver(pre_save, sender=Evaluation)
def recalculate_before_evaluation_save(sender: type[Evaluation], instance: Evaluation, **kwargs: Any) -> None:
    
    try:
        instance.recalculate_scores()
    except Exception:
        pass

@receiver(post_save, sender=FinalResult)
@receiver(post_delete, sender=FinalResult)
def recalculate_final_mark(sender: type[FinalResult], instance: FinalResult, **kwargs: Any) -> None:
    """Recompute the ``final_mark`` on a ``FinalResult`` whenever it changes."""
    try:
        instance.recalculate_final_mark()
    except Exception:
        pass
    # Persist the new final mark
    instance.save(update_fields=["final_mark"])

@receiver(pre_save, sender=WeeklyLog)
def set_submitted_timestamp(sender: type[WeeklyLog], instance: WeeklyLog, **kwargs: Any) -> None:
    
    # Fetch the previous status from the instance snapshot if present
    previous_status: str | None = None
    old_state: Dict[str, Any] | None = getattr(instance, "_pre_save_snapshot", None)
    if old_state is not None:
        previous_status = old_state.get("status")
    # If transitioning to SUBMITTED and no timestamp yet, set it now
    if instance.status == WeeklyLogStatus.SUBMITTED and not instance.submitted_at:
        # Ensure we are not simply updating the same status; use timezone.now
        if previous_status != WeeklyLogStatus.SUBMITTED:
            from django.utils import timezone  # imported here to avoid circular import issues
            instance.submitted_at = timezone.now()
