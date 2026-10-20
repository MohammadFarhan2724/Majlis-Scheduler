from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import api_views

router = DefaultRouter()
router.register("bookings", api_views.BookingViewSet, basename="api-booking")
router.register("venues", api_views.VenueViewSet, basename="api-venue")

urlpatterns = [
    path("register/", api_views.register_api),
    path("login/", api_views.login_api),
    path("", include(router.urls)),
]