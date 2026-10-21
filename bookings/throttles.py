from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class IpThrottle(SimpleRateThrottle):
    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope, "ident": self.get_ident(request)}


class MobileThrottle(SimpleRateThrottle):
    """Limits by the mobile number typed in the request."""

    def get_cache_key(self, request, view):
        mobile = str(request.data.get("mobile", "")).strip()[:15]
        ident = mobile or self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class LoginThrottle(MobileThrottle):
    scope = "login"


class RegisterThrottle(IpThrottle):
    scope = "register"


class ResetRequestThrottle(IpThrottle):
    scope = "password_reset"


class PasswordChangeThrottle(UserRateThrottle):
    scope = "password_change"


class BookingCreateThrottle(UserRateThrottle):
    scope = "booking_create"