from rest_framework import serializers
from apps.kanaban.models import Tag, Task


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "label", "value", "created_at", "updated_at")
        read_only_fields = ("id", "value", "created_at", "updated_at")

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
    - Read: `tags` is expanded into full nested TagSerializer objects.
    - Write: `tags` accepts a list of Tag IDs via `tag_ids`.
    This read/write split is the standard DRF pattern for M2M relations
    where you want rich output but simple input.
    """

    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags",
        queryset=Tag.objects.all(),
        many=True,
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
            "tag_ids",
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

    def validate_tag_ids(self, value):
        if not value:
            raise serializers.ValidationError("Please add at least one tag.")
        return value

    def create(self, validated_data):
        # 'tags' here is a list of Tag instances resolved by
        # PrimaryKeyRelatedField (via source="tags" on tag_ids)
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