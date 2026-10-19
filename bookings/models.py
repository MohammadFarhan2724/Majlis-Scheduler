from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class MajlisType(models.TextChoices):
    AZA = "aza", _("Majlis e Aza")
    SAYYUM = "sayyum", _("Majlis e Sayyum")
    DASWAN = "daswan", _("Majlis e Daswan")
    BEESWAN = "beeswan", _("Majlis e Beeswan")
    CHEHULLUM = "chehullum", _("Majlis e Chehullum")
    TARHEEM = "tarheem", _("Majlis e Tarheem")
    SHASHMAHI = "shashmahi", _("Majlis e Shashmahi")
    BARSI = "barsi", _("Majlis e Barsi")
    NAUCHANDI = "nauchandi", _("Nauchandi Majlis")
    OTHER = "other", _("Others")


class MehfilType(models.TextChoices):
    NOOR = "noor", _("Mehfil e Noor")
    SADEQAIN = "sadeqain", _("Jashn e Sadeqain")
    ABBAS = "abbas", _("Jashn e Abbas")
    OTHER = "other", _("Others")


class Kind(models.TextChoices):
    MAJLIS = "majlis", _("Majlis")
    MEHFIL = "mehfil", _("Mehfil")


class Period(models.TextChoices):
    MORNING = "morning", _("Morning")
    AFTERNOON = "afternoon", _("Afternoon")
    EVENING = "evening", _("Evening")


class TimeSlot(models.TextChoices):
    M_830 = "08:30", _("8:30 AM")
    M_900 = "09:00", _("9:00 AM")
    M_930 = "09:30", _("9:30 AM")
    M_1000 = "10:00", _("10:00 AM")
    M_1030 = "10:30", _("10:30 AM")
    A_1230 = "12:30", _("12:30 PM")
    A_100 = "13:00", _("1:00 PM")
    A_ZOHRAIN = "after_zohrain", _("After Namaz e Zohrain")
    E_700 = "19:00", _("7:00 PM")
    E_715 = "19:15", _("7:15 PM")
    E_730 = "19:30", _("7:30 PM")
    E_800 = "20:00", _("8:00 PM")
    E_MAGHRIBAIN = "after_maghribain", _("After Namaz e Maghribain")


# Which part of the day each slot belongs to
SLOT_PERIOD = {
    "08:30": "morning", "09:00": "morning", "09:30": "morning",
    "10:00": "morning", "10:30": "morning",
    "12:30": "afternoon", "13:00": "afternoon", "after_zohrain": "afternoon",
    "19:00": "evening", "19:15": "evening", "19:30": "evening",
    "20:00": "evening", "after_maghribain": "evening",
}

class Venue(models.Model):
    name_en = models.CharField(max_length=100)
    name_hi = models.CharField(max_length=100, blank=True)
    name_ur = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=50, default="Barabanki")

    def __str__(self):
        return self.name_en

class Booking(models.Model):
    kind = models.CharField(max_length=10, choices=Kind.choices)
    category = models.CharField(max_length=30)
    other_category = models.CharField(max_length=100, blank=True)
    organizer_name = models.CharField(max_length=100)
    khitabat = models.CharField(max_length=100)
    venue = models.ForeignKey(Venue, null=True, blank=True, on_delete=models.PROTECT)
    other_venue = models.CharField(max_length=150, blank=True)
    date = models.DateField()
    time_slot = models.CharField(max_length=20, choices=TimeSlot.choices)
    period = models.CharField(max_length=10, choices=Period.choices, editable=False)
    parcha = models.ImageField(upload_to="parcha/")
    isaal_e_sawaab = models.BooleanField(default=False)
    after_majlis = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["date", "period"], name="one_per_period")
        ]

    def clean(self):
        if self.category == "other" and not self.other_category:
            raise ValidationError("Please write the type.")
        if self.venue is None and not self.other_venue:
            raise ValidationError("Please select a venue or write one.")

    def save(self, *args, **kwargs):
        self.period = SLOT_PERIOD[self.time_slot]  # set automatically
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.organizer_name} - {self.date} ({self.period})"


class Marhoomeen(models.Model):
    booking = models.ForeignKey(
        Booking, related_name="marhoomeen", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name