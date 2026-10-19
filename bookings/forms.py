from django import forms
from django.core.exceptions import ValidationError
from .models import Booking, Venue, SLOT_PERIOD
import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterForm(forms.Form):
    mobile = forms.CharField(max_length=10, label="Mobile number")
    password = forms.CharField(widget=forms.PasswordInput)

    def clean_mobile(self):
        mobile = self.cleaned_data["mobile"].strip()
        if not re.fullmatch(r"[6-9]\d{9}", mobile):
            raise ValidationError("Enter a valid 10-digit mobile number.")
        if User.objects.filter(username=mobile).exists():
            raise ValidationError("This number is already registered.")
        return mobile

    def clean_password(self):
        password = self.cleaned_data["password"]
        validate_password(password)
        return password


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
            same_day = Booking.objects.filter(date=date).exclude(pk=self.instance.pk)
            if same_day.filter(period=period).exists():
                raise ValidationError("This spot is already taken.")
            if same_day.count() >= 2:
                raise ValidationError("This day is already full.")
        return data