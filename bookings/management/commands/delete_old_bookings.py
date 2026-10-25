from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from bookings.models import Booking


class Command(BaseCommand):
    help = "Delete bookings older than 7 days"

    def handle(self, *args, **options):
        cutoff = timezone.localdate() - timedelta(days=7)
        old = Booking.objects.filter(date__lt=cutoff)
        count = old.count()
        for b in old:
            b.parcha.delete(save=False)
            b.parcha_thumb.delete(save=False)  # removes the image file too
            b.delete()
        self.stdout.write(f"Deleted {count} old bookings")