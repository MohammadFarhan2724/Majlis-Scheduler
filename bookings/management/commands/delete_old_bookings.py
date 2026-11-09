from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking


class Command(BaseCommand):
    help = "Delete bookings that ended more than 7 days ago"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true",
                            help="Only show what would be deleted")

    def handle(self, *args, **options):
        cutoff = timezone.localdate() - timedelta(days=7)
        old = Booking.objects.filter(date__lt=cutoff)
        count = 0
        for b in old:
            if options["dry_run"]:
                self.stdout.write(f"Would delete: {b}")
            else:
                b.parcha.delete(save=False)
                b.parcha_thumb.delete(save=False)
                b.delete()
            count += 1
        verb = "Would delete" if options["dry_run"] else "Deleted"
        self.stdout.write(f"{verb} {count} bookings")