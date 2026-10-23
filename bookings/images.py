import io
import uuid

from django.core.files.base import ContentFile
from PIL import Image, ImageOps
from rest_framework import serializers

MAX_UPLOAD_MB = 10
MAX_SIDE = 2000
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def clean_image(upload):
    if upload.size > MAX_UPLOAD_MB * 1024 * 1024:
        raise serializers.ValidationError(
            f"Image is too big (maximum {MAX_UPLOAD_MB} MB).")
    try:
        upload.seek(0)
        img = Image.open(upload)
        if img.format not in ALLOWED_FORMATS:
            raise ValueError("format")
        img = ImageOps.exif_transpose(img)  # fixes sideways phone photos
        img.thumbnail((MAX_SIDE, MAX_SIDE))
        if img.mode != "RGB":  # JPEG has no transparency
            rgba = img.convert("RGBA")
            background = Image.new("RGB", img.size, "white")
            background.paste(rgba, mask=rgba.split()[-1])
            img = background
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=85, optimize=True)  # saved without EXIF
    except Exception:
        raise serializers.ValidationError(
            "Please upload a valid JPG, PNG or WEBP image.")
    return ContentFile(buf.getvalue(), name=f"{uuid.uuid4().hex}.jpg")