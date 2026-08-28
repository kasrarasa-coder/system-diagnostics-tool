from django.db import models


class VisitorLog(models.Model):
    """
    Stores a single client diagnostic / telemetry snapshot captured
    from a visitor's browser session.
    """

    # ------------------------------------------------------------------
    # Server-side captured
    # ------------------------------------------------------------------
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    referrer = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # ------------------------------------------------------------------
    # Hardware & Architecture
    # ------------------------------------------------------------------
    cpu_cores = models.IntegerField(null=True, blank=True)
    device_memory_gb = models.FloatField(null=True, blank=True)
    platform = models.CharField(max_length=100, blank=True, default="")
    architecture = models.CharField(max_length=50, blank=True, default="")

    # ------------------------------------------------------------------
    # GPU & WebGL
    # ------------------------------------------------------------------
    gpu_vendor = models.CharField(max_length=255, blank=True, default="")
    gpu_renderer = models.CharField(max_length=255, blank=True, default="")
    webgl_version = models.CharField(max_length=50, blank=True, default="")

    # ------------------------------------------------------------------
    # Screen & Display
    # ------------------------------------------------------------------
    screen_width = models.IntegerField(null=True, blank=True)
    screen_height = models.IntegerField(null=True, blank=True)
    color_depth = models.IntegerField(null=True, blank=True)
    pixel_ratio = models.FloatField(null=True, blank=True)
    orientation = models.CharField(max_length=20, blank=True, default="")

    # ------------------------------------------------------------------
    # Network & Connection
    # ------------------------------------------------------------------
    downlink_mbps = models.FloatField(null=True, blank=True)
    effective_type = models.CharField(max_length=20, blank=True, default="")
    rtt_ms = models.IntegerField(null=True, blank=True)
    save_data_mode = models.BooleanField(default=False)

    # ------------------------------------------------------------------
    # Battery & Power
    # ------------------------------------------------------------------
    battery_level_percent = models.FloatField(null=True, blank=True)
    is_charging = models.BooleanField(null=True, blank=True)
    charging_time_sec = models.IntegerField(null=True, blank=True)
    discharging_time_sec = models.IntegerField(null=True, blank=True)

    # ------------------------------------------------------------------
    # Browser Environment & Capabilities
    # ------------------------------------------------------------------
    language = models.CharField(max_length=20, blank=True, default="")
    languages_list = models.TextField(blank=True, default="")
    timezone = models.CharField(max_length=100, blank=True, default="")
    cookie_enabled = models.BooleanField(default=False)
    do_not_track = models.BooleanField(null=True, blank=True)
    touch_support = models.BooleanField(default=False)
    webrtc_supported = models.BooleanField(default=False)
    service_worker_supported = models.BooleanField(default=False)
    canvas_fingerprint_hash = models.CharField(max_length=64, blank=True, default="")

    # ------------------------------------------------------------------
    # In-Browser Benchmark
    # ------------------------------------------------------------------
    cpu_benchmark_ms = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Visitor Log"
        verbose_name_plural = "Visitor Logs"

    def __str__(self):
        return f"VisitorLog #{self.pk} ({self.ip_address or 'unknown'}) @ {self.created_at:%Y-%m-%d %H:%M:%S}"
