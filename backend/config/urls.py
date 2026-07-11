
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),

    path("users/", include("apps.user.urls", namespace="user_manage")),
    
    # API's
    path("api/v1/users/", include("apps.user.api.urls", namespace="user_api")),
    path("api/v1/kanabans/", include("apps.kanaban.api.urls", namespace="kanaban_api")),
    path("api/v1/annotators/", include("apps.annotator.api.urls", namespace="annotator_api"))
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

