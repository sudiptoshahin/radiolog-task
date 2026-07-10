
from django.urls import path
from apps.kanaban.api.views import (
    TagListCreateView, TagDetailView, 
    TaskListCreateView, task_detail, task_update, 
    TaskUpdateView, task_delete
)

app_name = "kanaban_api"

urlpatterns = [
    path("tags/", TagListCreateView.as_view(), name="tag-list-create"),
    path("tags/<uuid:pk>/", TagDetailView.as_view(), name="get-tag"),
    path("tasks/", TaskListCreateView.as_view(), name="task-list-create"),

    path("tasks/<uuid:pk>/view/", task_detail, name="task-detail"),
    path("tasks/<uuid:pk>/edit/", TaskUpdateView.as_view(), name="task-edit"),
    path("tasks/<uuid:pk>/delete/", task_delete, name='task-delete')
]