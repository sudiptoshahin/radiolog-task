from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Tag, Task

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("label", "value", "created_at", "updated_at")
    list_display_links = ("label",)
    search_fields = ("label", "value")
    ordering = ("label",)
    readonly_fields = ("id", "value", "created_at", "updated_at")

    fieldsets = (
        (None, {
            "fields": ("label", "value"),
        }),
        (_("Metadata"), {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        # 'value' is auto-generated from 'label', never editable directly
        return self.readonly_fields
    

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "priority", "due_date", "tag_list", "created_at")
    list_display_links = ("title",)
    list_filter = ("priority", "due_date", "tags")
    search_fields = ("title",)
    ordering = ("-created_at",)
    date_hierarchy = "due_date"
    readonly_fields = ("id", "created_at", "updated_at")
    autocomplete_fields = ("tags",)

    fieldsets = (
        (None, {
            "fields": ("title", "priority", "due_date", "tags"),
        }),
        (_("Metadata"), {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        # Prefetch tags to avoid N+1 queries when rendering tag_list per row
        return super().get_queryset(request).prefetch_related("tags")

    @admin.display(description=_("Tags"))
    def tag_list(self, obj):
        return ", ".join(tag.label for tag in obj.tags.all())