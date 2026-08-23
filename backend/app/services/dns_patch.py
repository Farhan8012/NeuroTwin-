"""DNS resolution patch using Google & Cloudflare public DNS.

Fixes intermittent Windows local router DNS lookup timeouts (Errno 11002).
Transparently resolves all domains (Groq, Qdrant, Google TTS, Supabase) via 8.8.8.8 and 1.1.1.1.
"""

import socket
import logging
import dns.resolver

logger = logging.getLogger("neurotwin.dns")

_original_getaddrinfo = socket.getaddrinfo
_dns_cache = {}

resolver = dns.resolver.Resolver(configure=False)
resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4"]
resolver.timeout = 2.0
resolver.lifetime = 4.0


def _patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    # Check if host is already an IP address or localhost
    if not host or host in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
        return _original_getaddrinfo(host, port, family, type, proto, flags)

    # Try fast cache
    if host in _dns_cache:
        ip = _dns_cache[host]
        return _original_getaddrinfo(ip, port, family, type, proto, flags)

    # If already an IPv4 string
    parts = host.split(".")
    if len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
        return _original_getaddrinfo(host, port, family, type, proto, flags)

    # Resolve via public DNS
    try:
        answers = resolver.resolve(host, "A")
        if answers:
            ip = answers[0].to_text()
            _dns_cache[host] = ip
            return _original_getaddrinfo(ip, port, family, type, proto, flags)
    except Exception:
        pass

    # Fallback to system getaddrinfo if custom resolver fails
    return _original_getaddrinfo(host, port, family, type, proto, flags)


def apply_dns_patch():
    """Apply socket monkey-patch so all networking calls resolve instantly."""
    socket.getaddrinfo = _patched_getaddrinfo
    logger.info("Public DNS patch (8.8.8.8, 1.1.1.1) applied.")
