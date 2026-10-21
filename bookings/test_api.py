import io
import shutil
import tempfile
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from .models import Booking, Venue, HijriMonth
from .hijri import hijri_for

User = get_user_model()
TEMP_MEDIA = tempfile.mkdtemp()
DAY = date.today() + timedelta(days=5)
PASSWORD = "Test@12345"


def image_file():
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "white").save(buf, "PNG")
    return SimpleUploadedFile("p.png", buf.getvalue(), content_type="image/png")


def payload(slot="09:00", day=DAY, **extra):
    data = {
        "kind": "majlis", "category": "aza", "organizer_name": "Ali",
        "khitabat": "Maulana", "other_venue": "Home",
        "date": day.isoformat(), "time_slot": slot, "parcha": image_file(),
    }
    data.update(extra)
    return data


def make_booking(owner, slot="09:00", day=DAY):
    return Booking.objects.create(
        kind="majlis", category="aza", organizer_name="A", khitabat="B",
        other_venue="Home", date=day, time_slot=slot,
        parcha="parcha/x.png", owner=owner,
    )


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class ApiTestBase(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def login_as(self, user):
        self.client.credentials()  # clear old login
        token = self.client.post(
            "/api/login/", {"mobile": user.username, "password": PASSWORD}
        ).data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def setUp(self):
        self.user1 = User.objects.create_user("9000000001", password=PASSWORD)
        self.user2 = User.objects.create_user("9000000002", password=PASSWORD)


class AuthApiTests(ApiTestBase):
    def test_register_gives_token(self):
        r = self.client.post(
            "/api/register/", {"mobile": "9111111111", "password": PASSWORD})
        self.assertEqual(r.status_code, 201)
        self.assertIn("token", r.data)

    def test_register_rejects_bad_number(self):
        r = self.client.post(
            "/api/register/", {"mobile": "12345", "password": PASSWORD})
        self.assertEqual(r.status_code, 400)

    def test_register_rejects_duplicate_number(self):
        r = self.client.post(
            "/api/register/", {"mobile": "9000000001", "password": PASSWORD})
        self.assertEqual(r.status_code, 400)

    def test_login_wrong_password(self):
        r = self.client.post(
            "/api/login/", {"mobile": "9000000001", "password": "wrong"})
        self.assertEqual(r.status_code, 400)

    def test_login_gives_token(self):
        r = self.client.post(
            "/api/login/", {"mobile": "9000000001", "password": PASSWORD})
        self.assertEqual(r.status_code, 200)
        self.assertIn("token", r.data)


class BookingApiTests(ApiTestBase):
    def test_anyone_can_see_list(self):
        make_booking(self.user1)
        r = self.client.get("/api/bookings/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data["results"] if "results" in r.data else r.data), 1)

    def test_old_bookings_are_hidden(self):
        make_booking(self.user1, day=date.today() - timedelta(days=3))
        r = self.client.get("/api/bookings/")
        data = r.data["results"] if "results" in r.data else r.data
        self.assertEqual(len(data), 0)

    def test_must_login_to_create(self):
        r = self.client.post("/api/bookings/", payload(), format="multipart")
        self.assertEqual(r.status_code, 401)

    def test_create_sets_owner_and_period(self):
        self.login_as(self.user1)
        r = self.client.post("/api/bookings/", payload("19:00"), format="multipart")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["period"], "evening")
        self.assertTrue(r.data["is_mine"])
        self.assertEqual(Booking.objects.get().owner, self.user1)

    def test_same_period_blocked(self):
        make_booking(self.user1, "09:00")
        self.login_as(self.user2)
        r = self.client.post("/api/bookings/", payload("10:30"), format="multipart")
        self.assertEqual(r.status_code, 400)
        self.assertIn("already taken", str(r.data))

    def test_different_period_allowed(self):
        make_booking(self.user1, "09:00")
        self.login_as(self.user2)
        r = self.client.post("/api/bookings/", payload("19:00"), format="multipart")
        self.assertEqual(r.status_code, 201)

    def test_day_full_after_two(self):
        make_booking(self.user1, "09:00")
        make_booking(self.user1, "19:00")
        self.login_as(self.user2)
        r = self.client.post("/api/bookings/", payload("12:30"), format="multipart")
        self.assertEqual(r.status_code, 400)
        self.assertIn("full", str(r.data))

    def test_past_date_rejected(self):
        self.login_as(self.user1)
        past = date.today() - timedelta(days=2)
        r = self.client.post(
            "/api/bookings/", payload(day=past), format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_isaal_needs_a_name(self):
        self.login_as(self.user1)
        r = self.client.post(
            "/api/bookings/", payload(isaal_e_sawaab="true"), format="multipart")
        self.assertEqual(r.status_code, 400)
        self.assertIn("marhoomeen_names", r.data)

    def test_isaal_with_names_saved(self):
        self.login_as(self.user1)
        data = payload(isaal_e_sawaab="true", marhoomeen_names=["Ahmad", "Zeeshan"])
        r = self.client.post("/api/bookings/", data, format="multipart")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["marhoomeen"], ["Ahmad", "Zeeshan"])

    def test_other_category_needs_text(self):
        self.login_as(self.user1)
        r = self.client.post(
            "/api/bookings/", payload(category="other"), format="multipart")
        self.assertEqual(r.status_code, 400)
        self.assertIn("other_category", r.data)

    def test_venue_or_other_venue_needed(self):
        self.login_as(self.user1)
        r = self.client.post(
            "/api/bookings/", payload(other_venue=""), format="multipart")
        self.assertEqual(r.status_code, 400)
        self.assertIn("other_venue", r.data)

    def test_fixed_venue_works(self):
        venue = Venue.objects.create(name_en="Ghulam Askari Hall")
        self.login_as(self.user1)
        r = self.client.post(
            "/api/bookings/",
            payload(other_venue="", venue=venue.pk), format="multipart")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["venue_detail"]["name_en"], "Ghulam Askari Hall")


class OwnerLockApiTests(ApiTestBase):
    def setUp(self):
        super().setUp()
        self.booking = make_booking(self.user1)
        self.url = f"/api/bookings/{self.booking.pk}/"

    def test_other_user_cannot_edit(self):
        self.login_as(self.user2)
        r = self.client.patch(self.url, {"khitabat": "Changed"})
        self.assertEqual(r.status_code, 403)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.khitabat, "B")

    def test_other_user_cannot_delete(self):
        self.login_as(self.user2)
        r = self.client.delete(self.url)
        self.assertEqual(r.status_code, 403)
        self.assertTrue(Booking.objects.filter(pk=self.booking.pk).exists())

    def test_anonymous_cannot_delete(self):
        r = self.client.delete(self.url)
        self.assertEqual(r.status_code, 401)

    def test_owner_can_edit_without_new_image(self):
        self.login_as(self.user1)
        r = self.client.patch(self.url, {"khitabat": "Changed"})
        self.assertEqual(r.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.khitabat, "Changed")

    def test_owner_can_move_to_another_period(self):
        self.login_as(self.user1)
        r = self.client.patch(self.url, {"time_slot": "19:00"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["period"], "evening")

    def test_owner_can_delete(self):
        self.login_as(self.user1)
        r = self.client.delete(self.url)
        self.assertEqual(r.status_code, 204)
        self.assertFalse(Booking.objects.filter(pk=self.booking.pk).exists())

    class HijriTests(ApiTestBase):
        def test_library_fallback(self):
            self.assertEqual(
            hijri_for(date(2024, 3, 11), []),
            {"day": 1, "month": 9, "year": 1445})

        def test_table_decides_the_day(self):
            months = [
                HijriMonth(year=1445, month=8, start_date=date(2024, 2, 11)),
                HijriMonth(year=1445, month=9, start_date=date(2024, 3, 12)),
            ]
            # Shaban had 30 days, because Ramadan starts on 12 March
            self.assertEqual(
                hijri_for(date(2024, 3, 11), months),
                {"day": 30, "month": 8, "year": 1445})
            self.assertEqual(
                hijri_for(date(2024, 3, 12), months),
                {"day": 1, "month": 9, "year": 1445})

        def test_api_uses_the_table(self):
            booking = make_booking(self.user1, day=date(2024, 3, 12))
            HijriMonth.objects.create(
            year=1445, month=9, start_date=date(2024, 3, 12))
            r = self.client.get(f"/api/bookings/{booking.pk}/")
            self.assertEqual(r.data["hijri_date"]["day"], 1)