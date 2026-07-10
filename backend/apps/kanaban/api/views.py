from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Prefetch
from common.pagination import DefaultPagination
from apps.kanaban.models import Tag, Task
from apps.kanaban.api.serializers import TagSerializer, TaskSerializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from uuid import UUID, uuid4


class TagListCreateView(APIView):
    permission_classes = [AllowAny]
    pagination_classes = DefaultPagination

    def post(self, request):
        serializer = TagSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            serializer.save()
        except DjangoValidationError as e:
            return Response(
                {"detail": e.message_dict if hasattr(e, "message_dict") else e.message},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, *args, **kwargs):
        qs = Tag.objects.all().order_by("label")

        paginator = self.pagination_classes()
        page = paginator.paginate_queryset(queryset=qs, request=request, view=self)
        serializer = TagSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class TagDetailView(APIView):
    permission_classes = [AllowAny]

    def __get_object(self, pk):
       queryset = Tag.objects.filter(pk=pk)
       if not queryset.exists():
           return Response(
               {"detail": "Tag not found!"},
               status=status.HTTP_404_NOT_FOUND
           )

       return queryset.get()


    def get(self, request, pk, *args, **kwargs):
        tag = self.__get_object(pk)
        if isinstance(tag, Response):
            return tag
        serializer = TagSerializer(tag)
        return Response(serializer.data, status=status.HTTP_200_OK)
    


class TaskListCreateView(APIView):
    permission_classes = [AllowAny]
    pagination_classes = DefaultPagination

    def post(self, request, *args, **kwargs):
        serializer = TaskSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            serializer.save()
        except DjangoValidationError as e:
            return Response(
                {"detail": e.message_dict if hasattr(e, "message_dict") else e.message},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, *args, **kwargs):
        # qs = Task.objects.prefetch_related("tags").all()
        qs = Task.objects.prefetch_related(
            Prefetch("tags", queryset=Tag.objects.only("id", "label", "value"))
        )

        paginator = self.pagination_classes()
        page = paginator.paginate_queryset(queryset=qs, request=request, view=self)
        serializer = TaskSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def task_detail(request, pk):
    qs = Task.objects.prefetch_related('tags').filter(pk=pk)
    if not qs.exists():
        return Response(
            {"detail": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = TaskSerializer(qs.get())
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PUT", "PATCH"])
@permission_classes([AllowAny])
def task_update(request, pk: UUID):
    if request.method == "PUT":
        return Response(
            {"data": request.data},
            status=status.HTTP_200_OK
        )
    if request.method == "PATCH":
        return Response(
            {"data": request.data},
            status=status.HTTP_200_OK
        )
class TaskUpdateView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        return get_object_or_404(Task, pk=pk)

    def put(self, request, pk, *args, **kwargs):
        task = self.get_object(pk)
        serializer = TaskSerializer(task, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk, *args, **kwargs):
        task = self.get_object(pk)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([AllowAny])
def task_delete(request, pk: UUID):
    qs = Task.objects.filter(pk=pk)
    if not qs.exists():
        return Response(
            {"detail": "Task not found!"},
            status=status.HTTP_404_NOT_FOUND
        )
    task = qs.get()
    task.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)