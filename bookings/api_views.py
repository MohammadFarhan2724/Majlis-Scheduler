from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .forms import RegisterForm
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