from datetime import timedelta

from django.contrib.auth import get_user_model, login
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from .forms import BookingForm, RegisterForm
from .models import Booking, Marhoomeen


def register(request):
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = get_user_model().objects.create_user(
            username=form.cleaned_data["mobile"],
            password=form.cleaned_data["password"],
        )
        login(request, user)
        return redirect("booking_list")
    return render(request, "bookings/register.html", {"form": form})


@login_required
def save_booking(request, pk=None):
    # Only the owner can open a booking for editing
    booking = get_object_or_404(Booking, pk=pk, owner=request.user) if pk else None
    form = BookingForm(request.POST or None, request.FILES or None, instance=booking)

    if request.method == "POST":
        names = [n.strip() for n in request.POST.getlist("marhoomeen") if n.strip()]
    else:
        names = [m.name for m in booking.marhoomeen.all()] if booking else []

    if request.method == "POST" and form.is_valid():
        if not form.cleaned_data["isaal_e_sawaab"]:
            names = []
        if form.cleaned_data["isaal_e_sawaab"] and not names:
            form.add_error(None, "Please write at least one Marhoom name.")
        else:
            try:
                with transaction.atomic():
                    obj = form.save(commit=False)
                    obj.owner = request.user
                    obj.save()
                    obj.marhoomeen.all().delete()
                    Marhoomeen.objects.bulk_create(
                        [Marhoomeen(booking=obj, name=n) for n in names]
                    )
                return redirect("booking_list")
            except IntegrityError:
                form.add_error(None, "This spot is already taken.")

    return render(request, "bookings/form.html", {
        "form": form,
        "names": names or [""],
        "editing": booking is not None,
    })


@login_required
@require_POST
def delete_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk, owner=request.user)
    booking.parcha.delete(save=False)
    booking.delete()
    return redirect("booking_list")


def booking_list(request):
    cutoff = timezone.localdate() - timedelta(days=1)
    bookings = Booking.objects.filter(date__gte=cutoff).order_by("date")
    return render(request, "bookings/list.html", {"bookings": bookings})