"""Development settings for NexusRoute."""
from .base import *  # noqa: F401,F403
from .base import env

DEBUG = True

# Reads ALLOWED_HOSTS from the environment (set in docker-compose) so the
# Vite proxy can reach Django via the "backend" service hostname.
ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=["localhost", "127.0.0.1", "0.0.0.0", "backend"],
)

# Allow the React dev server (Vite) to talk to the API.
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"],
)

# Browsable API is handy during development.
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)
