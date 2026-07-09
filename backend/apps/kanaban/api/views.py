from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import DefaultPagination
from apps.kanaban.models import Tag
from apps.kanaban.api.serializers import TagSerializer



class TagCreateView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_classes = DefaultPagination

    def post(self, request):
        serializer = TagSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        tag = serializer.validated_data["tag"]
        print(tag)


class TagListCreateView_(APIView):
    """
    GET  /tags/   -> list all tags (paginated)
    POST /tags/   -> create a new tag
    """
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_queryset(self):
        return Tag.objects.all().order_by("label")

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = TagSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = TagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            serializer.save()
        except DjangoValidationError as e:
            # Safety net: catches Tag.full_clean() errors raised inside
            # save() that weren't already caught by serializer validation
            return Response(
                {"detail": e.message_dict if hasattr(e, "message_dict") else e.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TagDetailView(APIView):
    """
    GET    /tags/<uuid:pk>/  -> retrieve a single tag
    PUT    /tags/<uuid:pk>/  -> full update
    PATCH  /tags/<uuid:pk>/  -> partial update
    DELETE /tags/<uuid:pk>/  -> delete
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Tag, pk=pk)

    def get(self, request, pk, *args, **kwargs):
        tag = self.get_object(pk)
        serializer = TagSerializer(tag)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk, *args, **kwargs):
        tag = self.get_object(pk)
        serializer = TagSerializer(tag, data=request.data)
        serializer.is_valid(raise_exception=True)
        self._save(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk, *args, **kwargs):
        tag = self.get_object(pk)
        serializer = TagSerializer(tag, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self._save(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        tag = self.get_object(pk)
        tag.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _save(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            raise DjangoValidationError(
                e.message_dict if hasattr(e, "message_dict") else e.messages
            )