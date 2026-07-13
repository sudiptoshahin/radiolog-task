from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from apps.annotator.models import (
    AnatomyCase,
    AnatomyCaseType,
    AnatomyImage,
    # AnnotatedImage,
)


class ImagePreviewMixin:
    """Shared thumbnail preview for any model with an `image` field."""

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 80px; max-width: 120px; '
                'object-fit: cover; border-radius: 4px;" />',
                obj.image.url,
            )
        return "-"

    image_preview.short_description = _("Preview")


class AnatomyImageInline(ImagePreviewMixin, admin.TabularInline):
    model = AnatomyImage
    extra = 1
    fields = ("image_preview", "image", "image_width", "image_height")
    readonly_fields = ("image_preview", "image_width", "image_height")
    show_change_link = True


# class AnnotatedImageInline(ImagePreviewMixin, admin.TabularInline):
#     model = AnnotatedImage
#     extra = 1
#     fields = ("image_preview", "image", "image_width", "image_height")
#     readonly_fields = ("image_preview", "image_width", "image_height")
#     show_change_link = True


@admin.register(AnatomyCaseType)
class AnatomyCaseTypeAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "created_at", "updated_at")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("title",)

    fieldsets = (
        (None, {
            "fields": ("title", "slug"),
        }),
        (_("Metadata"), {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


@admin.register(AnatomyCase)
class AnatomyCaseAdmin(admin.ModelAdmin):
    list_display = ("title", "case_type", "image_count", "annotated_image_count", "created_at")
    list_filter = ("case_type", "created_at")
    search_fields = ("title", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("id", "created_at", "updated_at")
    autocomplete_fields = ("case_type",)
    ordering = ("-created_at",)
    inlines = [AnatomyImageInline]

    fieldsets = (
        (None, {
            "fields": ("title", "slug", "case_type", "description"),
        }),
        (_("Metadata"), {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("case_type").prefetch_related("images", "annotated_images")

    @admin.display(description=_("Images"))
    def image_count(self, obj):
        return obj.images.count()

    @admin.display(description=_("Annotated Images"))
    def annotated_image_count(self, obj):
        return obj.annotated_images.count()


@admin.register(AnatomyImage)
class AnatomyImageAdmin(ImagePreviewMixin, admin.ModelAdmin):
    list_display = ("image_preview", "case", "image_width", "image_height")
    list_filter = ("case",)
    search_fields = ("case__title",)
    readonly_fields = ("id", "image_preview", "image_width", "image_height")
    autocomplete_fields = ("case",)
    list_select_related = ("case",)

    fields = ("case", "image", "image_preview", "image_width", "image_height", "id")


# @admin.register(AnnotatedImage)
# class AnnotatedImageAdmin(ImagePreviewMixin, admin.ModelAdmin):
#     list_display = ("image_preview", "case", "image_width", "image_height", "created_at")
#     list_filter = ("case", "created_at")
#     search_fields = ("case__title",)
#     readonly_fields = ("id", "image_preview", "image_width", "image_height", "created_at", "updated_at")
#     autocomplete_fields = ("case",)
#     list_select_related = ("case",)

#     fields = ("case", "image", "image_preview", "image_width", "image_height", "id", "created_at", "updated_at")