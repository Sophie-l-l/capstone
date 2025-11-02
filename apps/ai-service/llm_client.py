import json
import os
from typing import Optional, Tuple

from openai import OpenAI


def classify_with_llm(normalized_text: str, language: Optional[str] = None) -> Optional[Tuple[str, float]]:
    """
    Ask an LLM to classify the error. Returns (label, confidence) or None on failure.
    Expects environment variables:
      - OPENAI_API_KEY (required)
      - OPENAI_MODEL (default: 'gpt-4o-mini')
      - OPENAI_BASE_URL (optional, e.g., Azure OpenAI compatibility)
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    base_url = os.getenv("OPENAI_BASE_URL")

    try:
        client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)

        system = (
            "You are a precise error-classification assistant for programming education. "
            "Given an error message, output JSON with keys: label (string), confidence (0-1 float), "
            "and normalized_text (string). Label must be short and consistent across occurrences, e.g., "
            "'Missing semicolon', 'Type mismatch', 'Undefined variable/function', 'Null pointer dereference', "
            "'Array index out of bounds', 'Division by zero', 'Segmentation fault', 'Syntax error', 'Compilation error', "
            "'Runtime error', 'Time limit exceeded', 'Memory limit exceeded'. If unsure, return label 'Unknown error' with low confidence."
        )
        user = json.dumps({
            "error": normalized_text,
            "language": language or "unknown",
        })

        resp = client.responses.create(
            model=model,
            response_format={"type": "json_object"},
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )

        content = resp.output_text
        data = json.loads(content)
        label = str(data.get("label", "Unknown error"))
        confidence = float(data.get("confidence", 0.5))
        # normalized_text from LLM is ignored for hashing; caller already normalized
        return (label, confidence)
    except Exception:
        return None
