# config/settings/base.py

from pathlib import Path
from decouple import config
from django.contrib.messages import constants as messages


BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-secure-change-in-production')

ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='localhost').split(',')
CORS_ALLOWED_ORIGINS = config('DAJNGO_CORS_ALLOWED_ORIGINS', default='http://localhost:3000').split(',')
CORS_ALLOW_METHODS = config('DJANGO_CORS_ALLOW_METHODS', default='DELETE,GET,OPTIONS,PATCH,POST,PUT').split(',')
CORS_ALLOW_HEADERS = config('DAJNGO_CORS_ALLOW_HEADERS', default='accept,accept-encoding,authorization,content-type,dnt,origin,user-agent,x-csrftoken,x-requested-with,x-client-key,x-api-token,x-app-client,x-request-id').split(',')
CSRF_TRUSTED_ORIGINS = config('DJANGO_CSRF_TRUSTED_ORIGINS', default='http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = False

APPEND_SLASH = True

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    'corsheaders',
]

LOCAL_APPS = [
    'apps.user.apps.UserConfig',
    "apps.kanaban.apps.KanabanConfig"
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages"
            ]
        }
    }
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

#------------------------------------------
# Database
#------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3"
    }
}


#----------------------------------------
# Auth
# format must be like -> 'app_label.ModelName'
#----------------------------------------
AUTH_USER_MODEL = "user.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"}
]


AUTHENTICATION_BACKENDS = [
    "apps.user.backends.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]


LOGIN_URL = "user:login"
LOGIN_REDIRECT_URL = "user:user-list"
LOGOUT_REDIRECT_URL = "user:login"

#-----------------------------------------
# Internationalization
#-----------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

#-----------------------------------------
# Static / Media
#-----------------------------------------
STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

#---------------------------------------------
# Django Rest framework
#---------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.DefaultPagination",
    "PAGE_SIZE": 10,
}

