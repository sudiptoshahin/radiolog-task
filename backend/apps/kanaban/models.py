
from django.db import models
from uuid import uuid4
from utils.constants import Constants
from apps.user.models import User
from common.mixins import TimeStampedModel
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils.text import slugify

class Task(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=200, blank=False, null=False)
    priority = models.CharField(max_length=20, choices=Constants.TASK_PRIORITIES)
    due_date = models.DateTimeField(blank=False, null=False)
    tags = models.ManyToManyField("Tag", related_name="tasks", blank=False)

    REQUIRED_FIELDS = ("title", "priority", "due_date", "tags")

    class Meta:
        verbose_name = _("Task")
        verbose_name_plural = _("Tasks")
        ordering = ("-created_at",)

        constraints = (
            models.UniqueConstraint(fields=("title",), name="uniq_task_title"),
        )

        indexes = (
            models.Index(fields=("id",)),
            models.Index(fields=("due_date",)),
        )

    def __str__(self):
        return self.title

    def clean_title(self):
        if self.title:
            self.title = self.title.strip()
        if not self.title:
            raise ValidationError(
                {"title": _("Task title can not be empty!")},
                code="required"
            )
        qs = Task.objects.exclude(pk=self.pk).filter(title__iexact=self.title)
        if qs.exists():
            raise ValidationError(
                {"title": _("Title already exists!")},
                code="duplicate_title"
            )

    def clean_priority(self):
        if not self.priority:
            raise ValidationError(
                {"priority": _("Please choose a priority.")},
                code="required"
            )
        valid_values = dict(Constants.TASK_PRIORITIES)
        if self.priority not in valid_values:
            raise ValidationError(
                {"priority": _("Invalid priority selected.")},
                code="invalid"
            )

    def clean_due_date(self):
        if not self.due_date:
            raise ValidationError(
                {"due_date": _("Please select a due date.")},
                code="required"
            )

    def clean(self):
        errors = {}

        for clean_method in (
            self.clean_title,
            self.clean_priority,
            self.clean_due_date
        ):
            try:
                clean_method()
            except ValidationError as e:
                errors.update(e.message_dict)

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        # exclude m2m fields from full_clean since they can't be
        # validated properly before the instance has a pk
        self.full_clean(exclude=["tags"] if self.pk is None else None)
        super().save(*args, **kwargs)


class Tag(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    label = models.CharField(max_length=20, blank=False, null=False)
    value = models.SlugField(max_length=50, unique=True, blank=True, editable=False)

    REQUIRED_FIELDS = ("label",)

    class Meta:
        verbose_name = _("Tag")
        verbose_name_plural = _("Tags")

        constraints = (
            models.UniqueConstraint(fields=("label",), name="uniq_tag_label"),
            models.UniqueConstraint(fields=("value",), name="uniq_tag_value"),
        )

        indexes = (
            models.Index(fields=("id",)),
            models.Index(fields=("value",)),
        )

    def __str__(self):
        return self.label

    def clean_label(self):
        if self.label:
            self.label = self.label.strip()
        if not self.label:
            raise ValidationError(
                {"label": _("Tag label can not be empty!")},
                code="required"
            )
        qs = Tag.objects.exclude(pk=self.pk).filter(label__iexact=self.label)
        if qs.exists():
            raise ValidationError(
                {"label": _("Label already exists!")},
                code="duplicate_label"
            )

    def clean_value(self):
        if not self.value:
            raise ValidationError(
                {"value": _("Tag value could not be generated.")},
                code="required"
            )
        qs = Tag.objects.exclude(pk=self.pk).filter(value=self.value)
        if qs.exists():
            raise ValidationError(
                {"value": _("Value already exists!")},
                code="duplicate_value"
            )

    def clean(self):
        errors = {}

        try:
            self.clean_label()
        except ValidationError as e:
            errors.update(e.message_dict)

        # Generate slug from label before validating it
        if self.label:
            self.value = slugify(self.label).replace("-", "_")

        try:
            self.clean_value()
        except ValidationError as e:
            errors.update(e.message_dict)

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)