from django.contrib import admin
from .models import Booking, Marhoomeen, Venue


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