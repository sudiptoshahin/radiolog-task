from apps.user import views
from django.urls import path
from apps.user.api.views import LoginView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

app_name = "user_api"


urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/verify/", TokenVerifyView.as_view(), name="token_verify")
]