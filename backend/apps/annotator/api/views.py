
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import permission_classes, api_view
from apps.annotator.models import AnatomyCase, AnatomyCaseType
from apps.annotator.api.serializers import AnatomyCaseSerializer, AnatomyCaseListSerializer, AnatomyCaseTypesListSerializer
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch, Count

@api_view(['GET'])
@permission_classes([AllowAny])
def get_anatomy_cases(request):
    qs = AnatomyCase.objects.prefetch_related("images", "annotated_images")
    serializer = AnatomyCaseListSerializer(qs, many=True, context={"request": request})

    return Response(
        {
            "data": serializer.data,
        },
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_types_with_cases(request):
    
    # AnatomyCaseType has cases (AnatomyCase) and cases has the images and annotated_images
    qs = AnatomyCaseType.objects.prefetch_related(
        Prefetch(
            "cases",
            queryset=AnatomyCase.objects.annotate(
                image_count=Count("images", distinct=True),
                annotated_image_count=Count("annotated_images", distinct=True)
            )
        )
    )
    serializer = AnatomyCaseTypesListSerializer(qs, many=True, context={"request": request})

    return Response(
        {"data": serializer.data},
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_a_case(request, slug: str):

    case_qs = AnatomyCase.objects.filter(slug=slug)
    is_exists = case_qs.exists()
    if not is_exists:
        return Response(
            {"error": "Not found!"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    case_qs = case_qs.prefetch_related("images", "annotated_images")
    serializer = AnatomyCaseSerializer(case_qs, many=True, context={"request": request})

    return Response(
        {"data": serializer.data},
        status=status.HTTP_200_OK
    )