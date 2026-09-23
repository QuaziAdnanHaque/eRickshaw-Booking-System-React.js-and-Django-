from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomerUserAdmin(UserAdmin):
    model = User
    list_display = [
        "email",
        "name",
        "phone",
        "role",
        "is_staff",
        "is_active"
    ]
    ordering = [
        "email"
    ]
    search_fields = [
        "email",
        "name",
        "phone"
    ]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Information", {"fields": ("name", "phone", "role")}),
        ("Permission", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide"), "fields": ("email", "name", "phone", "role", "password1", "password2")})
    )