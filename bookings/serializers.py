from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import serializers

from .hijri import hijri_for
from .models import (
    SLOT_PERIOD, Booking, MajlisType, Marhoomeen, MehfilType, Venue,
)
from .images import clean_image


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = ["id", "name_en", "name_hi", "name_ur", "city", "map_url"]


class BookingSerializer(serializers.ModelSerializer):
    marhoomeen = serializers.SerializerMethodField()
    marhoomeen_names = serializers.ListField(
        child=serializers.CharField(max_length=200),
        write_only=True, required=False,
    )
    venue_detail = VenueSerializer(source="venue", read_only=True)
    is_mine = serializers.SerializerMethodField()
    hijri_date = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id", "kind", "category", "other_category", "organizer_name", "sogwaran",
            "khitabat", "venue", "venue_detail", "other_venue", "date",
            "hijri_date", "time_slot", "period", "parcha", "isaal_e_sawaab",
            "marhoomeen", "marhoomeen_names", "after_majlis", "is_mine",
        ]
        read_only_fields = ["period"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance is not None:
            self.fields["parcha"].required = False

    def get_marhoomeen(self, obj):
        return [m.name for m in obj.marhoomeen.all()]

    def get_is_mine(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and obj.owner_id == user.id)

    def get_hijri_date(self, obj):
        return hijri_for(obj.date, self.context.get("hijri_months"))

    def validate_parcha(self, value):
        return clean_image(value)

    def validate(self, attrs):
        inst = self.instance

        def val(name):
            if name in attrs:
                return attrs[name]
            return getattr(inst, name, None) if inst else None

        kind, category = val("kind"), val("category")
        valid = MajlisType.values if kind == "majlis" else MehfilType.values
        if category not in valid:
            raise serializers.ValidationError(
                {"category": "Invalid category for this type."})
        if category == "other" and not (val("other_category") or "").strip():
            raise serializers.ValidationError(
                {"other_category": "Please write the type."})
        if val("venue") is None and not (val("other_venue") or "").strip():
            raise serializers.ValidationError(
                {"other_venue": "Please select a venue or write one."})

        isaal = bool(val("isaal_e_sawaab")) and kind == "majlis"
        if "marhoomeen_names" in attrs:
            names = [n.strip() for n in attrs["marhoomeen_names"] if n.strip()]
        elif inst:
            names = [m.name for m in inst.marhoomeen.all()]
        else:
            names = []
        if isaal and not names:
            raise serializers.ValidationError(
                {"marhoomeen_names": "Write at least one name."})
        if isaal:
            if not (val("sogwaran") or "").strip():
                raise serializers.ValidationError(
                    {"sogwaran": "Please write the sogwaran names."})
        elif not (val("organizer_name") or "").strip():
            raise serializers.ValidationError(
                {"organizer_name": "Please write the organizer name."})
        attrs["organizer_name"] = "" if isaal else val("organizer_name").strip()
        attrs["sogwaran"] = val("sogwaran").strip() if isaal else ""
        attrs["isaal_e_sawaab"] = isaal
        attrs["marhoomeen_names"] = names if isaal else []

        day, slot = val("date"), val("time_slot")
        changed = inst is None or day != inst.date
        if "date" in attrs and changed and day < timezone.localdate():
            raise serializers.ValidationError({"date": "Date is in the past."})
        same_day = Booking.objects.filter(date=day)
        if inst:
            same_day = same_day.exclude(pk=inst.pk)
        if same_day.filter(period=SLOT_PERIOD[slot]).exists():
            raise serializers.ValidationError("This spot is already taken.")
        if same_day.count() >= 2:
            raise serializers.ValidationError("This day is already full.")
        return attrs

    def create(self, validated_data):
        names = validated_data.pop("marhoomeen_names", [])
        try:
            with transaction.atomic():
                booking = Booking.objects.create(**validated_data)
                Marhoomeen.objects.bulk_create(
                    [Marhoomeen(booking=booking, name=n) for n in names])
        except IntegrityError:
            raise serializers.ValidationError("This spot is already taken.")
        return booking

    def update(self, instance, validated_data):
        names = validated_data.pop("marhoomeen_names", None)
        if "parcha" in validated_data and instance.parcha:
            instance.parcha.delete(save=False)
        try:
            with transaction.atomic():
                for field, value in validated_data.items():
                    setattr(instance, field, value)
                instance.save()
                if names is not None:
                    instance.marhoomeen.all().delete()
                    Marhoomeen.objects.bulk_create(
                        [Marhoomeen(booking=instance, name=n) for n in names])
        except IntegrityError:
            raise serializers.ValidationError("This spot is already taken.")
        return instance