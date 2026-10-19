from django.db import IntegrityError, transaction
from django.shortcuts import render, redirect
from django.utils import timezone
from .forms import BookingForm
from .models import Booking, Marhoomeen


def create_booking(request):
    form = BookingForm(request.POST or None, request.FILES or None)
    names = [n.strip() for n in request.POST.getlist("marhoomeen") if n.strip()]

    if request.method == "POST" and form.is_valid():
        if form.cleaned_data["isaal_e_sawaab"] and not names:
            form.add_error(None, "Please write at least one Marhoom name.")
        else:
            try:
                with transaction.atomic():
                    booking = form.save()
                    Marhoomeen.objects.bulk_create(
                        [Marhoomeen(booking=booking, name=n) for n in names]
                    )
                return redirect("booking_list")
            except IntegrityError:
                form.add_error(None, "This spot is already taken.")

    return render(request, "bookings/form.html", {"form": form})


from datetime import timedelta

def booking_list(request):
    cutoff = timezone.localdate() - timedelta(days=1)
    bookings = Booking.objects.filter(date__gte=cutoff).order_by("date")
    return render(request, "bookings/list.html", {"bookings": bookings})