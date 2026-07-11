from rest_framework import serializers
from apps.kanaban.models import Tag, Task
from utils.constants import Constants

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "label", "value")
        read_only_fields = ("id", "value")

    def validate_label(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Tag label can not be empty!")

        qs = Tag.objects.filter(label__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Label already exists!")

        return value

    def create(self, validated_data):
        # Tag.save() calls full_clean(), which regenerates `value` from
        # `label` and re-validates everything at the model layer too —
        # this gives defense-in-depth against race conditions/direct ORM use.
        return Tag.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.label = validated_data.get("label", instance.label)
        instance.save()
        return instance


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task CRUD.

    `tags` is a single unified field for both read and write:
      - Write (create/update): send a list of Tag UUIDs
            "tags": ["7c9e6679-...", "3fa85f64-..."]
      - Read (response): full nested Tag objects are returned
            "tags": [{"id": "...", "label": "Bug", "value": "bug", ...}, ...]
    """

    tags = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=True,
        allow_empty=False,
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "priority",
            "due_date",
            "tags",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Task title can not be empty!")

        qs = Task.objects.filter(title__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Title already exists!")

        return value

    def validate_priority(self, value):
        valid_values = dict(Task._meta.get_field("priority").choices or {})
        if value not in valid_values:
            raise serializers.ValidationError("Invalid priority selected.")
        return value
    
    def validate_status(self, value):
        value = value.strip()

        if not any(value != status[0] for status in Constants.TASK_STATUS):
            raise serializers.ValidationError("Choose a correct status!")

        return value

    def to_internal_value(self, data):
        internal = super().to_internal_value(data)

        tag_uuids = internal.pop("tags", None)
        if tag_uuids is not None:
            tags = list(Tag.objects.filter(id__in=tag_uuids))
            found_ids = {str(tag.id) for tag in tags}
            missing = [str(uid) for uid in tag_uuids if str(uid) not in found_ids]
            if missing:
                raise serializers.ValidationError(
                    {"tags": [f"Invalid tag id(s): {', '.join(missing)}"]}
                )
            internal["tags"] = tags

        return internal

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["tags"] = TagSerializer(instance.tags.all(), many=True).data
        return representation

    def create(self, validated_data):
        tags = validated_data.pop("tags")
        task = Task.objects.create(**validated_data)
        task.tags.set(tags)
        return task

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tags is not None:
            instance.tags.set(tags)

        return instance