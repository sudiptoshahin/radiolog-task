from django.contrib.auth import authenticate
from rest_framework import serializers
from apps.user.models import User


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

