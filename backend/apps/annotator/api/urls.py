
from django.urls import path
from apps.annotator.api.views import get_anatomy_cases, get_types_with_cases, get_a_case, create_annotation

app_name = "annotator_api"

urlpatterns = [
    path('', get_anatomy_cases, name='cases'),
    path("types/", get_types_with_cases, name="types-with-cases"),
    path("case/<slug:slug>/", get_a_case, name="types-with-cases"),
    path("save/annotation", create_annotation, name="save-img-annotation")
]