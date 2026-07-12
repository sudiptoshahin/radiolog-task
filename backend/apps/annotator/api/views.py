
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import permission_classes, api_view
from apps.annotator.models import AnatomyCase
from apps.annotator.api.serializers import AnatomyCaseListSerializer
from rest_framework.response import Response
from rest_framework import status

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