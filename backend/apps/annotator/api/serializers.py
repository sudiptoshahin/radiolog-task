from rest_framework import serializers
from apps.annotator.models import AnatomyCase, AnatomyImage, Annotation, AnatomyCaseType
from django.core.exceptions import ValidationError
from utils.constants import Constants


# class AnnotatedImageSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = AnnotatedImage
#         fields = ("id", "case", "image",)
#         read_only_fields = ("id", )

class AnatomyCaseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnatomyCaseType
        fields = ("id", "title", "slug")
        read_only_fields = ("id", "slug")

    

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
    


class AnatomyCaseReadSerializer(serializers.ModelSerializer):
    image_count = serializers.IntegerField()
    # annotated_image_count = serializers.IntegerField()

    class Meta:
        model = AnatomyCase
        # fields = ("id", "title", "slug", "image_count", "annotated_image_count", "created_at")
        fields = ("id", "title", "slug", "image_count", "created_at")
        read_only_fields = fields


class AnatomyCaseTypesListSerializer(serializers.ModelSerializer):
    cases = AnatomyCaseReadSerializer(many=True)

    class Meta:
        model = AnatomyCaseType
        fields = ("id", "title", "slug", "cases", "created_at")
        read_only_fields = ("id", "slug", "created_at")


class AnnotationSerializer(serializers.ModelSerializer):
    closed = serializers.BooleanField(source="is_closed", required=False, default=False)

    class Meta:
        model = Annotation
        fields = (
            "id",
            "class_label",
            "annotated_color",
            "image",
            "points",
            "closed",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_annotated_color(self, value):
        value = value.strip()
        is_hex = value.startswith("#") and len(value) in (4, 7, 9)
        is_rgba = value.lower().startswith(("rgb(", "rgba("))
        if not (is_hex or is_rgba):
            raise serializers.ValidationError(
                "Color must be a hex code (e.g. #dc2626) or rgb()/rgba() value."
            )
        return value

    def validate_points(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError("Points must be a non-empty list of coordinates.")

        for point in value:
            if not isinstance(point, dict) or "x" not in point or "y" not in point:
                raise serializers.ValidationError(
                    "Each point must be an object with 'x' and 'y' keys."
                )
            if not isinstance(point["x"], (int, float)) or not isinstance(point["y"], (int, float)):
                raise serializers.ValidationError("Point coordinates must be numeric.")

        return value


class AnatomyImageSerializer(serializers.ModelSerializer):
    annotations = AnnotationSerializer(many=True, read_only=True)

    class Meta:
        model = AnatomyImage
        fields = ("id", "case", "image", "annotations")
        read_only_fields = ("id", "annotations")


class AnatomyCaseListSerializer(serializers.ModelSerializer):
    images = AnatomyImageSerializer(many=True, read_only=True)
    # annotated_images = AnnotatedImageSerializer(many=True, read_only=True)

    class Meta:
        model = AnatomyCase
        fields = (
            "id", "title", "slug", "case_type", "images", "created_at"
        )

        read_only_fields = fields


class AnatomyCaseSerializer(serializers.ModelSerializer):
    images = AnatomyImageSerializer(many=True, read_only=True)
    # annotated_images = AnnotatedImageSerializer(many=True, read_only=True)
    case_type = AnatomyCaseTypeSerializer(many=False)
    class Meta:
        model = AnatomyCase
        fields = (
            "id", "title", "slug", "case_type", "description", 
            "images", "created_at", "updated_at"
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