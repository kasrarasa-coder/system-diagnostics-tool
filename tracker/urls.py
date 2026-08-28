from django.urls import path

from . import views

app_name = "tracker"

urlpatterns = [
    path("", views.index_view, name="home"),
    path("api/log/", views.log_telemetry_view, name="log_telemetry"),
]
