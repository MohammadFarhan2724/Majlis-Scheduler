from django.urls import path
from . import views

urlpatterns = [
    path("", views.booking_list, name="booking_list"),
    path("new/", views.create_booking, name="create_booking"),
]