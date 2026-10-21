from datetime import date

from django.core.management.base import BaseCommand
from django.utils import timezone
from hijridate import Gregorian, Hijri

from bookings.models import HijriMonth


class Command(BaseCommand):
    help = "Add the next Islamic months using the library estimate"

    def add_arguments(self, parser):
        parser.add_argument("--months", type=int, default=12)

    def handle(self, *args, **options):
        today = timezone.localdate()
        h = Gregorian(today.year, today.month, today.day).to_hijri()
        year, month = h.year, h.month
        added = 0
        for _ in range(options["months"]):
            g = Hijri(year, month, 1).to_gregorian()
            _, created = HijriMonth.objects.get_or_create(
                year=year, month=month,
                defaults={"start_date": date(g.year, g.month, g.day)},
            )
            added += created
            month += 1
            if month > 12:
                month, year = 1, year + 1
        self.stdout.write(f"Added {added} new months")