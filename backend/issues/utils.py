import logging

from django.conf import settings
from django.core.mail import send_mail


logger = logging.getLogger(__name__)


def send_iles_email(subject, message, recipients):
    """
    Sends ILES email notifications.

    If email sending fails, the system logs the error but does not crash
    the API request. This prevents feedback submission from failing just
    because email delivery failed.
    """

    cleaned_recipients = []

    for email in recipients:
        if email and "@" in email:
            cleaned_recipients.append(email)

    if not cleaned_recipients:
        return False

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@iles.test"),
            recipient_list=cleaned_recipients,
            fail_silently=False,
        )

        return True

    except Exception as error:
        logger.exception("ILES email notification failed: %s", error)
        return False