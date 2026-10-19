from django import forms
from django.core.exceptions import ValidationError
from .models import Booking, Venue, SLOT_PERIOD


class BookingForm(forms.ModelForm):
    venue = forms.ModelChoiceField(
        queryset=Venue.objects.all(),
        required=False,
        empty_label="Others",
    )

    class Meta:
        model = Booking
        fields = [
            "kind", "category", "other_category", "organizer_name",
            "khitabat", "venue", "other_venue", "date", "time_slot",
            "parcha", "isaal_e_sawaab", "after_majlis",
        ]
        widgets = {"date": forms.DateInput(attrs={"type": "date"})}

    def clean(self):
        data = super().clean()
        date = data.get("date")
        slot = data.get("time_slot")
        if date and slot:
            period = SLOT_PERIOD[slot]
            same_day = Booking.objects.filter(date=date)
            if same_day.filter(period=period).exists():
                raise ValidationError("This spot is already taken.")
            if same_day.count() >= 2:
                raise ValidationError("This day is already full.")
        return data