from functools import wraps
from cachetools import TTLCache
from typing import Callable, Any

# Global cache store
_caches: dict[str, TTLCache] = {}


def timed_cache(seconds: int = 300, maxsize: int = 128) -> Callable:
    """Decorator that caches function results for a given TTL."""
    def decorator(func: Callable) -> Callable:
        cache_key = f"{func.__module__}.{func.__qualname__}"
        _caches[cache_key] = TTLCache(maxsize=maxsize, ttl=seconds)

        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            cache = _caches[cache_key]
            key = str(args) + str(sorted(kwargs.items()))
            if key in cache:
                return cache[key]
            result = func(*args, **kwargs)
            cache[key] = result
            return result

        return wrapper
    return decorator


def clear_cache(func_name: str | None = None) -> None:
    """Clear cache for a specific function or all caches."""
    if func_name and func_name in _caches:
        _caches[func_name].clear()
    elif func_name is None:
        for cache in _caches.values():
            cache.clear()
