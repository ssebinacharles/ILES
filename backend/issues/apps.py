from django.apps import AppConfig


class IssuesConfig(AppConfig):

    # Use BigAutoField for automatic primary key fields by default.
    default_auto_field = "django.db.models.BigAutoField"
    
    name = "issues"
    # Provide a human readable verbose name for the admin interface.
    verbose_name = "Issues"

    def ready(self) -> None:
        
        from . import signals  