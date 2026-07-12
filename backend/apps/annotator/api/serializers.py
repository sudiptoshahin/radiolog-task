from rest_framework import serializers
from apps.annotator.models import AnatomyCase, AnatomyImage, AnnotatedImage
from django.core.exceptions import ValidationError

class AnatomyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnatomyImage
        fields = ("id", "case", "image")
        read_only_fields = ("id", )


class AnnotatedImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnotatedImage
        fields = ("id", "case", "image",)
        read_only_fields = ("id", )


class AnatomyCaseSerializer(serializers.ModelSerializer):
    images = AnatomyImageSerializer(many=True, read_only=True)
    annotated_images = AnnotatedImageSerializer(many=True, read_only=True)
    class Meta:
        model = AnatomyCase
        fields = (
            "id", "title", "slug", "case_type", "description", 
            "images", "annotated_images", "created_at", "updated_at"
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_title(self, value):
        if not value:
            raise serializers.ValidationError({
                "Case title cannot be empty!"
            })
        value = value.strip()

        qs = AnatomyCase.objects.filter(title__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({
                "Case title already exists!"
            })
        
        return value
    

class AnatomyCaseWriterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnatomyCase
        fields = ("id", "title", "slug", "case_type", "description")
        read_only_fields = ("id", "slug")

    def validate_title(self, value):
        if not value:
            raise serializers.ValidationError({
                "Case title cannot be empty!"
            })
        value = value.strip()

        qs = AnatomyCase.objects.filter(title__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({
                "Case title already exists!"
            })
        
        return value
    

class AnatomyCaseListSerializer(serializers.ModelSerializer):
    images = AnatomyImageSerializer(many=True, read_only=True)
    annotated_images = AnnotatedImageSerializer(many=True, read_only=True)

    class Meta:
        model = AnatomyCase
        fields = (
            "id", "title", "slug", "case_type", "images",
            "annotated_images", "created_at"
        )

        read_only_fields = fields