from app.rate_limit import InMemoryRateLimiter


def test_rate_limiter_enforces_limit_and_can_be_cleared() -> None:
    limiter = InMemoryRateLimiter(limit=2)

    assert limiter.allow("client")
    assert limiter.allow("client")
    assert not limiter.allow("client")
    limiter.clear()
    assert limiter.allow("client")


def test_rate_limiter_evicts_stalest_key_when_full() -> None:
    limiter = InMemoryRateLimiter(limit=1, max_keys=2)

    assert limiter.allow("first")
    assert limiter.allow("second")
    assert not limiter.allow("second")
    # A new client is still served once the table is full.
    assert limiter.allow("third")
    # "first" was the stalest entry, so it was evicted and starts again.
    assert limiter.allow("first")
    assert len(limiter._attempts) == 2
