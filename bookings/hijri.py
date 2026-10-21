from bisect import bisect_right

from hijridate import Gregorian

from .models import HijriMonth


def load_months():
    return list(HijriMonth.objects.order_by("start_date"))


def hijri_for(day, months=None):
    if months is None:
        months = load_months()
    i = bisect_right([m.start_date for m in months], day) - 1
    if i >= 0:
        m = months[i]
        days_in = (day - m.start_date).days
        if days_in <= 29:  # a month is never longer than 30 days
            return {"day": days_in + 1, "month": m.month, "year": m.year}
    # no row for this date yet: use the library estimate
    h = Gregorian(day.year, day.month, day.day).to_hijri()
    return {"day": h.day, "month": h.month, "year": h.year}