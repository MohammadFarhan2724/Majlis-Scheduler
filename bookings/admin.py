import secrets

from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

from .models import (
    AccountFlag, Booking, HijriMonth, Marhoomeen, PasswordResetRequest, Venue,
)


class MarhoomeenInline(admin.TabularInline):
    model = Marhoomeen
    extra = 1


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("organizer_name", "kind", "date", "period", "time_slot")
    inlines = [MarhoomeenInline]


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ("name_en", "city")

@admin.register(HijriMonth)
class HijriMonthAdmin(admin.ModelAdmin):
    list_display = ("year", "month", "start_date", "confirmed")
    list_filter = ("confirmed",)
    ordering = ("start_date",)

@admin.action(description="Reset password (gives a temporary password)")
def reset_password(modeladmin, request, queryset):
    User = get_user_model()
    for req in queryset:
        user = User.objects.filter(username=req.mobile).first()
        if user is None or user.is_staff:
            modeladmin.message_user(
                request, f"{req.mobile}: skipped (no normal account)",
                messages.WARNING)
            continue
        temp = "".join(secrets.choice("0123456789") for _ in range(8))
        user.set_password(temp)
        user.save()
        Token.objects.filter(user=user).delete()  # logs the user out everywhere
        AccountFlag.objects.update_or_create(
            user=user, defaults={"must_change_password": True})
        req.handled = True
        req.save()
        modeladmin.message_user(
            request, f"{req.mobile}: temporary password is {temp}",
            messages.SUCCESS)


@admin.register(PasswordResetRequest)
class PasswordResetRequestAdmin(admin.ModelAdmin):
    list_display = ("mobile", "created_at", "handled")
    list_filter = ("handled",)
    actions = [reset_password]