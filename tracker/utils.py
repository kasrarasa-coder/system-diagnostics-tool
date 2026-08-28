def get_client_ip(request):
    """
    Extract the real client IP address from the request, accounting
    for reverse proxies / load balancers that set X-Forwarded-For.

    X-Forwarded-For can contain a comma-separated chain of IPs
    (client, proxy1, proxy2, ...). The first entry is the original
    client IP.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip
