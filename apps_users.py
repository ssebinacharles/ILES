from django.apps import AppConfig


class UsersConfig(AppConfig):
    """Configuration for the users app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "users"
    verbose_name = "Users"

    def ready(self) -> None:  # pragma: no cover - placeholder for signals
        # Importing signals here would connect any custom signal handlers.
        # from . import signals  # noqa: F401
        return None
