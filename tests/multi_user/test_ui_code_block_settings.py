"""Tests for code block appearance settings in UI settings contract."""

from __future__ import annotations

import json

import pytest

from deeptutor.services.settings.interface_settings import (
    get_ui_settings,
)


def test_code_block_settings_default_merge_when_interface_json_lacks_keys(
    mu_isolated_root, as_user
):
    """Verify that when interface.json lacks the new code block keys, defaults are merged in."""
    user_settings = (
        mu_isolated_root / "data" / "users" / "u_alice" / "user" / "settings" / "interface.json"
    )
    user_settings.parent.mkdir(parents=True, exist_ok=True)

    # Simulate legacy interface.json without the new code block keys
    user_settings.write_text(json.dumps({"theme": "light", "language": "en"}), encoding="utf-8")

    with as_user("u_alice", role="user"):
        settings = get_ui_settings()

        # Verify that legacy settings are preserved
        assert settings["theme"] == "light"
        assert settings["language"] == "en"

        # Verify that new code block settings are merged with defaults
        assert settings["code_block_theme"] == "oneDark"
        assert settings["code_block_show_line_numbers"] is False
        assert settings["code_block_wrap_long_lines"] is False


def test_code_block_settings_no_file_returns_all_defaults(mu_isolated_root, as_user):
    """Verify that when there is no interface.json, all settings including code block settings return defaults."""
    with as_user("u_alice", role="user"):
        # Alice has no interface.json yet
        settings = get_ui_settings()

        # All settings should be defaults
        assert settings["theme"] == "snow"
        assert settings["language"] == "en"
        assert settings["code_block_theme"] == "oneDark"
        assert settings["code_block_show_line_numbers"] is False
        assert settings["code_block_wrap_long_lines"] is False
