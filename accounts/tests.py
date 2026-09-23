from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from .models import User

class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="driver@example.com",
            password="Password123",
            name="Test Driver",
            phone="1234567890",
            role="driver",
        )

    def test_login_accepts_email_and_returns_tokens(self):
        response = self.client.post(
            reverse("login"),
            {"email": "driver@example.com", "password": "Password123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_current_user_endpoint_returns_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("current_user"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "driver@example.com")
        self.assertEqual(response.data["role"], "driver")
