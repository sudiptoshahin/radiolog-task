from django.contrib.auth import authenticate
from rest_framework import serializers
from apps.user.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password
        )

        if user is None:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."},
                code="authorization"
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "This account is inactive"},
                code="authorization"
            )
        
        attrs["user"] = user
        return attrs
    

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ("id", "username", "email")
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],  # Django's built-in strength checks
        style={"input_type": "password"},
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label=_("Confirm password"),
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "password2")
        read_only_fields = ("id",)
        extra_kwargs = {
            "username": {"required": True},
            "email": {"required": True},
        }

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                _("User with this email already exists."), code="duplicate_email"
            )
        return value

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                _("Username cannot be blank."), code="required"
            )
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                _("Username already exists!"), code="duplicate_username"
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password2": _("Password fields didn't match.")}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user