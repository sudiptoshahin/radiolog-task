from django.db import models
from uuid import uuid4
from utils.constants import Constants
from django.utils.deconstruct import deconstructible
import os
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from common.mixins import TimeStampedModel
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify

@deconstructible
class ImageUploadPath:
    def __init__(self, prefix: str):
        self.prefix = prefix
    # e.g. anatomy_images/2026/06/<uuid>.png
    def __call__(self, instance, filename):
        ext = filename.split(".")[-1].lower()
        filename = f"{uuid4()}.{ext}"

        return os.path.join(
            self.prefix,
            timezone.now().strftime("%Y/%m"),
            filename
        )

class AnatomyImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    case = models.ForeignKey("AnatomyCase", on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(
        upload_to=ImageUploadPath("anatomy_images"),
        validators=[
            FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"]),
        ],
        height_field="image_height",
        width_field="image_width"
    )
    image_height = models.PositiveIntegerField(editable=False, null=True, blank=True)
    image_width = models.PositiveIntegerField(editable=False, null=True, blank=True)

    class Meta:
        verbose_name = _("Anatomy Image")
        verbose_name_plural = _("Anatomy Images")



class AnatomyCase(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=150, unique=True, blank=True)
    case_type = models.CharField(max_length=100, choices=Constants.ANATOMY_CASE_TYPE)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = _("Anatomy Case")
        verbose_name_plural = _("Anatomy Cases")
        indexes = [
            models.Index(fields=("slug",)),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()
        self.title = self.title.strip() if self.title else self.title

        if not self.title:
            raise ValidationError({"title": _("Case title cannot be empty!")})

        qs = AnatomyCase.objects.exclude(pk=self.pk).filter(title__iexact=self.title)
        if qs.exists():
            raise ValidationError(
                {"title": _("Case title already exists!")},
                code="duplicate_title",
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class AnnotatedImage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    case = models.ForeignKey("AnatomyCase", on_delete=models.CASCADE, related_name="annotated_images")
    image = models.ImageField(
        upload_to=ImageUploadPath("annotated_images"),
        validators=[
            FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"]),
        ],
        height_field="image_height",
        width_field="image_width"
    )
    image_height = models.PositiveIntegerField(editable=False, null=True, blank=True)
    image_width = models.PositiveIntegerField(editable=False, null=True, blank=True)

    class Meta:
        verbose_name = _("Annotated Image")
        verbose_name_plural = _("Annotated Images")