
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import permission_classes, api_view
from apps.annotator.models import AnatomyCase, AnatomyCaseType, Annotation
from apps.annotator.api.serializers import AnatomyCaseSerializer, AnatomyCaseListSerializer, AnatomyCaseTypesListSerializer, AnnotationSerializer
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch, Count
from django.shortcuts import get_object_or_404


@api_view(['GET'])
@permission_classes([AllowAny])
def get_anatomy_cases(request):
    # qs = AnatomyCase.objects.prefetch_related("images", "annotated_images")
    qs = AnatomyCase.objects.prefetch_related("images")
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
                # annotated_image_count=Count("annotated_images", distinct=True)
            )
        )
    )
    serializer = AnatomyCaseTypesListSerializer(qs, many=True, context={"request": request})

    return Response(
        {"data": serializer.data},
        status=status.HTTP_200_OK
    )


# @api_view(["GET"])
# @permission_classes([AllowAny])
# def get_a_case(request, slug: str):

#     case_qs = AnatomyCase.objects.filter(slug=slug)
#     is_exists = case_qs.exists()
#     if not is_exists:
#         return Response(
#             {"error": "Not found!"},
#             status=status.HTTP_400_BAD_REQUEST
#         )
    
#     # case_qs = case_qs.prefetch_related("images", "annotated_images")
#     case_qs = case_qs.prefetch_related("images")
#     serializer = AnatomyCaseSerializer(case_qs, many=True, context={"request": request})

#     return Response(
#         {"data": serializer.data},
#         status=status.HTTP_200_OK
#     )

@api_view(["GET"])
@permission_classes([AllowAny])
def get_a_case(request, slug: str):
    case = get_object_or_404(
        AnatomyCase.objects.prefetch_related("images__annotations"),
        slug=slug,
    )
    serializer = AnatomyCaseListSerializer(case, context={"request": request})

    return Response(
        {"data": serializer.data},
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_annotations(request):
    qs = Annotation.objects.select_related("image").all().order_by("-created_at")
    image_id = request.query_params.get("image")
    if image_id:
        qs = qs.filter(image_id=image_id)

    serializer = AnnotationSerializer(qs, many=True, context={"request": request})

    return Response(
        {"data": serializer.data},
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def create_annotation(request):
    serializer = AnnotationSerializer(data=request.data, context={"request": request})

    if not serializer.is_valid():
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()

    return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@api_view(["PUT", "PATCH"])
@permission_classes([AllowAny])
def update_annotation(request, pk):
    annotation = Annotation.objects.get(pk=pk)

    is_partial = request.method == "PATCH"
    serializer = AnnotationSerializer(
        annotation,
        data=request.data,
        partial=is_partial,
        context={"request": request}
    )

    if not serializer.is_valid():
        return Response(
            {"errors": serializer.error},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer.save()

    return Response(
        {"data": serializer.data},
        status=status.HTTP_400_BAD_REQUEST
    )