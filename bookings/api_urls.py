from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import api_views

router = DefaultRouter()
router.register("bookings", api_views.BookingViewSet, basename="api-booking")
router.register("venues", api_views.VenueViewSet, basename="api-venue")

urlpatterns = [
    path("register/", api_views.register_api),
    path("login/", api_views.login_api),
    path("calendar/", api_views.calendar_api),
    path("options/", api_views.options_api),
    path("today/", api_views.today_api),
    path("hijri/", api_views.hijri_api),
    path("password-reset-request/", api_views.password_reset_request_api),
    path("change-password/", api_views.change_password_api),
    path("", include(router.urls)),
]