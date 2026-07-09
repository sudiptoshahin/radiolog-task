
from decouple import config
from config.settings.base import *
from datetime import timedelta

DEBUG = False

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": config("DATABASE_NAME", default="ddrf_auth_db"),
#         "USER": config("DATABASE_USER", default="myproject"),
#         "PASSWORD": config("DATABASE_PASSWORD", default=""),
#         "HOST": config("DATABASE_HOST", default="localhost"),
#         "PORT": config("DATABASE_PORT", default="5432"),
#     }
# }


#----------------------------------------------------
# JWT - Settings
#----------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("JWT_ACCESS_TOKEN_LIFETIME_MINUITE", default=5, cast=int)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)),
    "ROTATE_REFRESH_TOKENS": config("JWT_ROTATE_REFRESH_TOKENS"),
    "BLACKLIST_AFTER_ROTATION": config("JWT_BLACKLIST_AFTER_ROTATION"),
    "UPDATE_LAST_LOGIN": config("JWT_UPDATE_LAST_LOGIN"),
    "ALGORITHM": config("JWT_ALGORITHM"),
    "SIGNING_KEY": config("JWT_SIGNING_KEY"),
    "AUTH_HEADER_TYPES": ("Bearer", ),
    "USER_ID_FIELD": config("JWT_USER_ID_FIELD", default="id"),
    "USER_ID_CLAIM": config("JWT_USER_ID_CLAIM", default="user_id")
}