

from rest_framework_simplejwt.tokens import RefreshToken

def get_token_for_user(user):
    refresh = RefreshToken()

    refresh["username"] = user.username
    refresh["email"] = user.email

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    }