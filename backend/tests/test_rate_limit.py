from app.rate_limit import InMemoryRateLimiter


def test_rate_limiter_enforces_limit_and_can_be_cleared() -> None:
    limiter = InMemoryRateLimiter(limit=2)

    assert limiter.allow("client")
    assert limiter.allow("client")
    assert not limiter.allow("client")
    limiter.clear()
    assert limiter.allow("client")


def test_rate_limiter_caps_distinct_keys() -> None:
    limiter = InMemoryRateLimiter(limit=2, max_keys=1)

    assert limiter.allow("first")
    assert not limiter.allow("second")
