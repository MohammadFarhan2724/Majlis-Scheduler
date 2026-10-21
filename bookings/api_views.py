import calendar
from collections import defaultdict
from datetime import date, timedelta

from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .forms import RegisterForm
from .hijri import hijri_for, hijri_month_name, load_months
from .models import Booking, Venue
from .serializers import BookingSerializer, VenueSerializer


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
        if self.action == "list":
            cutoff = timezone.localdate() - timedelta(days=1)
            qs = qs.filter(date__gte=cutoff)
        return qs.order_by("date")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["hijri_months"] = load_months()
        return context

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
def login_api(request):
    user = authenticate(
        username=request.data.get("mobile", ""),
        password=request.data.get("password", ""),
    )
    if user is None:
        return Response({"detail": "Wrong mobile number or password."}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
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