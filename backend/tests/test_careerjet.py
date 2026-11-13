import io
import os
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from fastapi import HTTPException
from starlette.requests import Request

from app import main


class CareerjetErrorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.request = Request(
            {
                "type": "http",
                "method": "POST",
                "headers": [(b"user-agent", b"test-agent")],
                "client": ("127.0.0.1", 12345),
                "scheme": "http",
                "path": "/api/v1/admin/careerjet/discover",
                "query_string": b"",
                "server": ("localhost", 8000),
            }
        )
        self.environment = patch.dict(
            os.environ,
            {
                "CAREERJET_API_KEY": "test-key",
                "CAREERJET_USER_IP": "203.0.113.10",
                "CAREERJET_PUBLISHER_URL": "https://publisher.example/search/",
            },
        )
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def test_ip_authorization_error_identifies_requester_ip(self) -> None:
        response = io.BytesIO(
            b'{"error":"Unauthorized access from IP 203.0.113.25","type":"ERROR"}'
        )
        error = HTTPError(
            main.CAREERJET_API_URL,
            403,
            "Forbidden",
            hdrs=None,
            fp=response,
        )

        with patch.object(main.urllib_request, "urlopen", side_effect=error):
            with self.assertRaises(HTTPException) as raised:
                main.careerjet_search(self.request, "internship", "Kuala Lumpur", 1)

        self.assertIn("203.0.113.25", raised.exception.detail)
        self.assertIn("requester IP sent in user_ip", raised.exception.detail)
        self.assertIn("CAREERJET_USER_IP is the searcher's current public IP", raised.exception.detail)
        self.assertIn("ask Careerjet whether this IP is authorized", raised.exception.detail)

    def test_other_forbidden_response_checks_publisher_registration(self) -> None:
        response = io.BytesIO(b'{"error":"Invalid publisher credentials","type":"ERROR"}')
        error = HTTPError(
            main.CAREERJET_API_URL,
            403,
            "Forbidden",
            hdrs=None,
            fp=response,
        )

        with patch.object(main.urllib_request, "urlopen", side_effect=error):
            with self.assertRaises(HTTPException) as raised:
                main.careerjet_search(self.request, "internship", "Kuala Lumpur", 1)

        self.assertIn("API key is active", raised.exception.detail)
        self.assertIn("CAREERJET_PUBLISHER_URL", raised.exception.detail)


if __name__ == "__main__":
    unittest.main()
