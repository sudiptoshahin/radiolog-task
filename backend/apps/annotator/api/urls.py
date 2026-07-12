
from django.urls import path
from apps.annotator.api.views import get_anatomy_cases

app_name = "annotator_api"

urlpatterns = [
    path('', get_anatomy_cases, name='cases'),
]