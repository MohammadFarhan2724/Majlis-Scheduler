import calendar
import re
from collections import defaultdict
from datetime import date, timedelta

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes, action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .forms import RegisterForm
from .hijri import hijri_for, hijri_month_name, load_months
from .models import (
    SLOT_PERIOD, AccountFlag, Booking, MajlisType, MehfilType,
    PasswordResetRequest, TimeSlot, Venue,
)
from .serializers import BookingSerializer, VenueSerializer
from .throttles import (
    BookingCreateThrottle, LoginThrottle, PasswordChangeThrottle,
    RegisterThrottle, ResetRequestThrottle,
)
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in permissions.SAFE_METHODS or (
            obj.owner_id == request.user.id
        )


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Booking.objects.select_related("venue").prefetch_related("marhoomeen")
        today = timezone.localdate()
        if self.action == "list":
            qs = qs.filter(date__gte=today)
        elif self.action == "mine":
            qs = qs.filter(owner=self.request.user)
            if self.request.query_params.get("tab") == "completed":
                return qs.filter(date__lt=today).order_by("-date")
            qs = qs.filter(date__gte=today)
        return qs.order_by("date")

    @action(detail=False, methods=["get"],
            permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["hijri_months"] = load_months()
        return context

    def get_throttles(self):
        if self.action == "create":
            return [BookingCreateThrottle()]
        return super().get_throttles()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        instance.parcha.delete(save=False)
        instance.delete()


class VenueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    pagination_class = None


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([RegisterThrottle])
def register_api(request):
    form = RegisterForm(request.data)
    if not form.is_valid():
        errors = {f: [str(e) for e in errs] for f, errs in form.errors.items()}
        return Response(errors, status=400)
    user = get_user_model().objects.create_user(
        username=form.cleaned_data["mobile"],
        password=form.cleaned_data["password"],
    )
    token = Token.objects.create(user=user)
    return Response({"token": token.key}, status=201)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([LoginThrottle])
def login_api(request):
    user = authenticate(
        username=request.data.get("mobile", ""),
        password=request.data.get("password", ""),
    )
    if user is None:
        return Response({"detail": "Wrong mobile number or password."}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    must_change = AccountFlag.objects.filter(
        user=user, must_change_password=True).exists()
    return Response({"token": token.key, "must_change_password": must_change})

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([ResetRequestThrottle])
def password_reset_request_api(request):
    mobile = str(request.data.get("mobile", "")).strip()
    if not re.fullmatch(r"[6-9]\d{9}", mobile):
        return Response(
            {"mobile": ["Enter a valid 10-digit mobile number."]}, status=400)
    exists = get_user_model().objects.filter(username=mobile).exists()
    waiting = PasswordResetRequest.objects.filter(mobile=mobile, handled=False)
    if exists and not waiting.exists():
        PasswordResetRequest.objects.create(mobile=mobile)
    # same answer whether the number exists or not
    return Response({"detail": "Request received. We will contact you on this number."})

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([PasswordChangeThrottle])
def change_password_api(request):
    old = request.data.get("old_password", "")
    new = request.data.get("new_password", "")
    if not request.user.check_password(old):
        return Response({"old_password": ["Wrong password."]}, status=400)
    try:
        validate_password(new, request.user)
    except DjangoValidationError as e:
        return Response({"new_password": list(e.messages)}, status=400)
    request.user.set_password(new)
    request.user.save()
    AccountFlag.objects.filter(user=request.user).update(must_change_password=False)
    Token.objects.filter(user=request.user).delete()
    token = Token.objects.create(user=request.user)
    return Response({"token": token.key})


def hijri_with_name(day, months=None):
    h = hijri_for(day, months)
    return {**h, "month_name": hijri_month_name(h["month"])}


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def today_api(request):
    today = timezone.localdate()
    return Response({"date": today.isoformat(), "hijri": hijri_with_name(today)})


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def hijri_api(request):
    try:
        day = date.fromisoformat(request.query_params.get("date", ""))
        hijri = hijri_with_name(day)
    except (ValueError, OverflowError):
        return Response({"detail": "Use date=YYYY-MM-DD."}, status=400)
    return Response({"date": day.isoformat(), "hijri": hijri})


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def calendar_api(request):
    today = timezone.localdate()
    try:
        year = int(request.query_params.get("year", today.year))
        month = int(request.query_params.get("month", today.month))
        first = date(year, month, 1)
    except ValueError:
        return Response({"detail": "Invalid year or month."}, status=400)

    days_in_month = calendar.monthrange(year, month)[1]
    last = date(year, month, days_in_month)

    taken = defaultdict(list)
    rows = Booking.objects.filter(date__range=(first, last)).values("date", "period")
    for row in rows:
        taken[row["date"]].append(row["period"])

    months = load_months()
    result = []
    for n in range(days_in_month):
        day = first + timedelta(days=n)
        periods = sorted(taken.get(day, []))
        result.append({
            "date": day.isoformat(),
            "hijri": hijri_with_name(day, months),
            "taken": periods,
            "full": len(periods) >= 2,
        })
    return Response(result)

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def options_api(request):
    def as_list(choices):
        return [{"code": code, "label": str(label)} for code, label in choices]

    return Response({
        "majlis_types": as_list(MajlisType.choices),
        "mehfil_types": as_list(MehfilType.choices),
        "time_slots": [
            {"code": code, "label": str(label), "period": SLOT_PERIOD[code]}
            for code, label in TimeSlot.choices
        ],
        "venues": VenueSerializer(Venue.objects.order_by("id"), many=True).data,
    })