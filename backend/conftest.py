"""Shared pytest fixtures for the whole backend test suite."""

import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _clear_cache():
    """
    Ensure every test starts with an empty cache.

    CACHES points at Redis (see config/settings/base.py) so cached
    route-optimization results survive across real requests. That same
    Redis instance is also what a local `pytest` run talks to whenever
    the Docker stack is up (it's exposed on localhost:6379) — without
    this fixture, a result cached by one test run could silently leak
    into a later one and skip the code path actually being tested.
    """
    cache.clear()
    yield
    cache.clear()
