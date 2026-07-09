from config.settings.base import *
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DEBUG = True
ALLOWED_HOSTS = ["*"]

# For dev-only apps
INSTALLED_APPS += []

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"}
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG"
    }
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


#----------------------------------------------------
# JWT - Settings
#----------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(config("JWT_ACCESS_TOKEN_LIFETIME_MINUITE", default=5))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7))),
    "ROTATE_REFRESH_TOKENS": config("JWT_ROTATE_REFRESH_TOKENS"),
    "BLACKLIST_AFTER_ROTATION": config("JWT_BLACKLIST_AFTER_ROTATION"),
    "UPDATE_LAST_LOGIN": config("JWT_UPDATE_LAST_LOGIN"),
    "ALGORITHM": config("JWT_ALGORITHM"),
    "SIGNING_KEY": config("JWT_SIGNING_KEY"),
    "AUTH_HEADER_TYPES": ("Bearer", ),
    "USER_ID_FIELD": config("JWT_USER_ID_FIELD", default="id"),
    "USER_ID_CLAIM": config("JWT_USER_ID_CLAIM", default="user_id")
}