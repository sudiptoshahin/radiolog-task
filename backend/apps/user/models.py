from django.db import models
from common.mixins import TimeStampedModel
from django.contrib.auth.models import AbstractUser
from uuid import uuid4
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class User(AbstractUser, TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    username = models.CharField(max_length=100, blank=False, null=False)
    email = models.EmailField(max_length=200, blank=False, null=False, unique=True)

    # If a user goes to your login page, they will enter their email and password 
    # instead of a username and password.
    USERNAME_FIELD = "username"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("username", ), name="uniq_user_username"),
            models.UniqueConstraint(fields=("email", ), name="uniq_user_email"),
        ]

        indexes = [
            models.Index(fields=("username", )),
            models.Index(fields=("email", )),
        ]

        ordering = ["-created_at"]
        verbose_name = _("User")
        verbose_name_plural = _("Users")


    def clean_username(self):
        if self.username:
            self.username = self.username.strip()
        
        if not self.username:
            raise ValidationError(
                {"username": _("Username cannot be blank.")},
                code="required"
            )
        
        qs = User.objects.exclude(pk=self.pk).filter(username__iexact=self.username)
        if qs.exists():
            raise ValidationError(
                {"username": _("Username already exists!")},
                code="duplicate_username"
            )
        
    def clean_email(self):
        if self.email:
            self.email = self.email.strip().lower()

        qs = User.objects.exclude(pk=self.pk).filter(email__iexact=self.email)
        if qs.exists():
            raise ValidationError(
                {"email": _("User with this email already exists.")},
                code="duplicate_email"
            )
        
    def clean(self):
        super().clean()
        errors = {}

        for validator in (self.clean_username, self.clean_email, self.clean_role):
            try:
                validator()
            except ValidationError as e:
                errors.update(
                    e.message_dict if hasattr(e, "message_dict") else {"__all__": e.message}
                )
        if errors:
            raise ValidationError(errors)
        
    def save(self, *args, **kwargs):
        self.full_clean()
        # if needed then modify
        super().save(*args, **kwargs)

    def __str__(self)-> str:
        return self.username