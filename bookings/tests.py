from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse

from .forms import BookingForm
from .models import Booking

User = get_user_model()
DAY = date.today() + timedelta(days=5)


def make_booking(owner, slot="09:00", day=DAY):
    return Booking.objects.create(
        kind="majlis", category="aza", organizer_name="A", khitabat="B",
        other_venue="Home", date=day, time_slot=slot,
        parcha="parcha/x.jpg", owner=owner,
    )


def form_data(slot, day=DAY):
    return {
        "kind": "majlis", "category": "aza", "organizer_name": "X",
        "khitabat": "Y", "other_venue": "Home", "date": day, "time_slot": slot,
    }


class SlotRuleTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("9000000001", password="pass12345!")

    def test_same_period_is_blocked(self):
        make_booking(self.user, "09:00")
        form = BookingForm(form_data("10:30"))
        form.is_valid()
        self.assertIn("This spot is already taken.", form.non_field_errors())

    def test_different_period_is_allowed(self):
        make_booking(self.user, "09:00")
        form = BookingForm(form_data("19:00"))
        form.is_valid()
        self.assertEqual(len(form.non_field_errors()), 0)

    def test_day_full_after_two_bookings(self):
        make_booking(self.user, "09:00")
        make_booking(self.user, "19:00")
        form = BookingForm(form_data("12:30"))
        form.is_valid()
        self.assertIn("This day is already full.", form.non_field_errors())

    def test_database_blocks_double_booking(self):
        make_booking(self.user, "09:00")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                make_booking(self.user, "10:00")


class OwnerLockTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user("9000000001", password="pass12345!")
        self.user2 = User.objects.create_user("9000000002", password="pass12345!")
        self.booking = make_booking(self.user1)

    def test_other_user_cannot_edit(self):
        self.client.login(username="9000000002", password="pass12345!")
        response = self.client.get(reverse("edit_booking", args=[self.booking.pk]))
        self.assertEqual(response.status_code, 404)

    def test_other_user_cannot_delete(self):
        self.client.login(username="9000000002", password="pass12345!")
        response = self.client.post(reverse("delete_booking", args=[self.booking.pk]))
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Booking.objects.filter(pk=self.booking.pk).exists())

    def test_owner_can_delete(self):
        self.client.login(username="9000000001", password="pass12345!")
        self.client.post(reverse("delete_booking", args=[self.booking.pk]))
        self.assertFalse(Booking.objects.filter(pk=self.booking.pk).exists())