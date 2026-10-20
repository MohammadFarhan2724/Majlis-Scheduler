from django.contrib.auth import views as auth_views
from django.urls import path
from . import views

urlpatterns = [
    path("", views.booking_list, name="booking_list"),
    path("new/", views.save_booking, name="create_booking"),
    path("edit/<int:pk>/", views.save_booking, name="edit_booking"),
    path("delete/<int:pk>/", views.delete_booking, name="delete_booking"),
    path("register/", views.register, name="register"),
    path("login/", auth_views.LoginView.as_view(
        template_name="bookings/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
]