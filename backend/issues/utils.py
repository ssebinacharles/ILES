from django.conf import settings
from django.core.mail import send_mail


def send_iles_email(subject, message, recipients):
    cleaned_recipients = []

    for email in recipients:
        if email and "@" in email:
            cleaned_recipients.append(email)

    if not cleaned_recipients:
        return

    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@iles.test"),
        recipient_list=cleaned_recipients,
        fail_silently=True,
    )