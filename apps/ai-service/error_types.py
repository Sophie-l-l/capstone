"""
Shared error classification types for the AI service.
These enums ensure consistency across the entire EduCode platform.
"""

from enum import Enum
from typing import Dict


class SurfaceErrorCategory(str, Enum):
    """
    SURFACE ERROR CATEGORIES (IEEE 1044-2009)
    These are the ONLY valid surface error types allowed in the system.
    """
    LEXICAL = "Lexical"
    SYNTAX = "Syntax"
    SEMANTIC_TYPE = "Semantic/Type"
    SEMANTIC_LINK = "Semantic/Link"
    LINK_BINDING = "Link/Binding"
    RUNTIME_EXCEPTION = "Runtime/Exception"
    FUNCTIONAL_LOGIC = "Functional/Logic"
    QUALITY_NON_FUNCTIONAL = "Quality/Non-Functional"
    CONCURRENCY_TIMING = "Concurrency/Timing"
    ENVIRONMENT_DEPLOYMENT = "Environment/Deployment"
    SECURITY_WEAKNESS = "Security/Weakness"
    BUILD_CONFIGURATION = "Build/Configuration"


class CognitiveCause(str, Enum):
    """
    COGNITIVE CAUSES (Zehetmeier et al. 2015)
    These are the ONLY valid cognitive causes allowed in the system.
    """
    MENTAL_TYPO = "MENTAL_TYPO"
    KNOWLEDGE_GAP = "KNOWLEDGE_GAP"
    MISCONCEPTION = "MISCONCEPTION"
    WRONG_CHOICE = "WRONG_CHOICE"
    STRUCTURAL_BLINDNESS = "STRUCTURAL_BLINDNESS"
    QUALITY_GAP = "QUALITY_GAP"
    LACK_OF_INNOVATION = "LACK_OF_INNOVATION"
    WRONG_CHOICE_MISCONCEPTION = "WRONG_CHOICE/MISCONCEPTION"


class BloomLevel(str, Enum):
    """
    BLOOM TAXONOMY LEVELS
    These are the ONLY valid Bloom taxonomy levels allowed in the system.
    """
    BELOW_REMEMBER = "Below Remember"
    REMEMBER = "Remember"
    UNDERSTAND = "Understand"
    APPLY = "Apply"
    ANALYSE = "Analyse"
    EVALUATE = "Evaluate"
    CREATE = "Create"


# Helper functions to validate and get valid values

def is_valid_surface_error(value: str) -> bool:
    """Check if a string is a valid surface error category."""
    try:
        SurfaceErrorCategory(value)
        return True
    except ValueError:
        return False


def is_valid_cognitive_cause(value: str) -> bool:
    """Check if a string is a valid cognitive cause."""
    try:
        CognitiveCause(value)
        return True
    except ValueError:
        return False


def is_valid_bloom_level(value: str) -> bool:
    """Check if a string is a valid Bloom level."""
    try:
        BloomLevel(value)
        return True
    except ValueError:
        return False


def get_all_surface_errors() -> list[str]:
    """Get all valid surface error categories as strings."""
    return [e.value for e in SurfaceErrorCategory]


def get_all_cognitive_causes() -> list[str]:
    """Get all valid cognitive causes as strings."""
    return [e.value for e in CognitiveCause]


def get_all_bloom_levels() -> list[str]:
    """Get all valid Bloom levels as strings."""
    return [e.value for e in BloomLevel]


# Color mapping for frontend charts (matching TypeScript version)
SURFACE_ERROR_COLORS: Dict[str, str] = {
    SurfaceErrorCategory.LEXICAL.value: "#3B82F6",
    SurfaceErrorCategory.SYNTAX.value: "#8B5CF6",
    SurfaceErrorCategory.SEMANTIC_TYPE.value: "#10B981",
    SurfaceErrorCategory.SEMANTIC_LINK.value: "#14B8A6",
    SurfaceErrorCategory.LINK_BINDING.value: "#06B6D4",
    SurfaceErrorCategory.RUNTIME_EXCEPTION.value: "#EF4444",
    SurfaceErrorCategory.FUNCTIONAL_LOGIC.value: "#F59E0B",
    SurfaceErrorCategory.QUALITY_NON_FUNCTIONAL.value: "#EC4899",
    SurfaceErrorCategory.CONCURRENCY_TIMING.value: "#8B5CF6",
    SurfaceErrorCategory.ENVIRONMENT_DEPLOYMENT.value: "#6B7280",
    SurfaceErrorCategory.SECURITY_WEAKNESS.value: "#DC2626",
    SurfaceErrorCategory.BUILD_CONFIGURATION.value: "#7C3AED",
}
