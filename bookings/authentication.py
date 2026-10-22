from datetime import timedelta

from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import AccountFlag

INACTIVITY_DAYS = 30
SAVE_EVERY = timedelta(hours=1)  # no database write on every single request


def touch_activity(user):
    AccountFlag.objects.update_or_create(
        user=user, defaults={"last_active": timezone.now()})


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        now = timezone.now()
        flag, _ = AccountFlag.objects.get_or_create(user=user)
        last = flag.last_active or token.created
        if now - last > timedelta(days=INACTIVITY_DAYS):
            token.delete()
            raise AuthenticationFailed("Session expired. Please log in again.")
        if flag.last_active is None or now - flag.last_active > SAVE_EVERY:
            flag.last_active = now
            flag.save(update_fields=["last_active"])
        return user, token