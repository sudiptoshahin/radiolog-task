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

class AnatomyCaseType(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=150, unique=True, blank=True, null=True)
    
    class Meta:
        verbose_name = _("Anatomy Case Type")
        verbose_name_plural = _("Anatomy Case Types")

        constraints = (
            models.UniqueConstraint(fields=("title", ), name="uniq_title"),
        )

        indexes = (
            models.Index(fields=("id", )),
            models.Index(fields=("slug", ))
        )

    def clean(self):
        if not self.title:
            raise ValidationError({"title": _("Title cannot be empty")})
        self.title = self.title.strip()
        qs = AnatomyCaseType.objects.filter(title__iexact=self.title)
        
        if qs.exists():
            raise ValidationError({"title": _("Case type is already exists")}, code="duplicate_case_type")
        
    def save(self, *args, **kwargs):
        super().full_clean()
        if not self.slug:
            self.slug = slugify(self.title)
        
        super().save(*args, **kwargs)


class AnatomyCase(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=150, unique=True, blank=True)
    # case_type = models.CharField(max_length=100, choices=Constants.ANATOMY_CASE_TYPE)
    case_type = models.ForeignKey("AnatomyCaseType", on_delete=models.SET_NULL, null=True, blank=True, related_name="cases")
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

class Annotation(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    image = models.ForeignKey("AnatomyImage", on_delete=models.CASCADE, related_name="annotations")
    class_label = models.CharField(max_length=100, choices=Constants.ANNOTATION_CLASS_LABELS, blank=False, null=False)
    annotated_color = models.CharField(max_length=20, blank=False, null=False)
    points = models.JSONField()
    is_closed = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("Annotation")
        verbose_name_plural = _("Annotations")
        indexes = (
            models.Index(fields=("image",)),
            models.Index(fields=("class_label",)),
        )