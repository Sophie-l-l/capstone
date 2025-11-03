import json
import os
import logging
from typing import Optional, Tuple

from openai import OpenAI

logger = logging.getLogger(__name__)


def classify_with_llm(normalized_text: str, language: Optional[str] = None) -> Optional[Tuple[str, float]]:
    """
    Ask an LLM to classify the error. Returns (label, confidence) or None on failure.
    Expects environment variables:
      - OPENAI_API_KEY (required)
      - OPENAI_MODEL (default: 'gpt-4o-mini')
      - OPENAI_BASE_URL (optional, e.g., Azure OpenAI compatibility)
    """
    # Allow switching providers via environment: 'openai' (default) or 'google'
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    if provider == "google":
        return classify_with_gemini(normalized_text, language)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    # Use explicit default OpenAI API base if none provided. Some SDK/runtime
    # combinations produce an invalid request when base_url is empty; setting
    # the well-known default avoids 'missing scheme' errors.
    base_url = os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    try:
        # Sanitize base_url: some deployments set OPENAI_BASE_URL without a scheme
        # (e.g., 'api.openai.com'). httpx requires a full URL with scheme.
        if base_url:
            base_url = base_url.strip()
            if base_url and not base_url.startswith(("http://", "https://")):
                base_url = "https://" + base_url
            client = OpenAI(api_key=api_key, base_url=base_url)
        else:
            client = OpenAI(api_key=api_key)

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

        # The openai client library has changed over time; some versions don't accept
        # a `response_format` kwarg. Call the responses API with the common args and
        # parse the returned object flexibly.
        resp = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )

        try:
            # Try the convenient property first
            content = getattr(resp, "output_text", None)

            # If not available, try to extract text from resp.output structure
            if not content:
                pieces = []
                out = getattr(resp, "output", None)
                if out:
                    # out might be a list of message-like objects or dicts
                    for item in out:
                        try:
                            # dict-like
                            if isinstance(item, dict):
                                for c in item.get("content", []):
                                    # content entries can have type/text
                                    if isinstance(c, dict) and c.get("type") in ("output_text", "message"):
                                        pieces.append(c.get("text", ""))
                            else:
                                # object-like (SDK models)
                                cont = getattr(item, "content", None) or []
                                for c in cont:
                                    text = getattr(c, "text", None) or getattr(c, "parts", None)
                                    if isinstance(text, list):
                                        pieces.extend(text)
                                    elif isinstance(text, str):
                                        pieces.append(text)
                        except Exception:
                            # best-effort; continue
                            continue
                content = "\n".join([p for p in pieces if p]) if pieces else None

            if not content:
                # fallback to stringifying the resp for logging/debugging
                content = str(resp)

            # Attempt to parse JSON from the LLM
            data = json.loads(content)
            label = str(data.get("label", "Unknown error"))
            confidence = float(data.get("confidence", 0.5))
            return (label, confidence)
        except Exception:
            # Log the raw response and the exception for debugging (no secrets)
            try:
                logger.exception("Failed to parse LLM response for text=%s; raw_resp=%s", normalized_text, str(resp)[:1000])
            except Exception:
                logger.exception("Failed to parse LLM response and failed to stringify resp")
            return None
    except Exception:
        logger.exception("LLM request failed for text=%s", normalized_text)
        return None


def classify_with_gemini(normalized_text: str, language: Optional[str] = None) -> Optional[Tuple[str, float]]:
    """Call Google Vertex/Generative AI (Gemini) to classify an error.

    This function imports `google.generativeai` lazily. It returns (label, confidence)
    on success or None on failure. It tries a couple of client methods to be
    compatible with different versions of the library.
    """
    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        logger.warning("google.generativeai not installed; cannot use Gemini provider")
        return None

    # Configure API key if provided (useful for local dev). Production should
    # use GOOGLE_APPLICATION_CREDENTIALS or ADC.
    google_key = os.getenv("GOOGLE_API_KEY")
    if google_key:
        try:
            genai.configure(api_key=google_key)
        except Exception:
            # ignore configure errors; the library may use ADC instead
            pass

    model = os.getenv("GOOGLE_MODEL", "gemini-1.5")

    system = (
        "You are a precise error-classification assistant for programming education. "
        "Given an error message, output JSON with keys: label (string), confidence (0-1 float). "
        "If unsure, return label 'Unknown error' with low confidence."
    )

    prompt = system + "\n\nError: " + normalized_text + "\nLanguage: " + (language or "unknown") + "\n\nRespond with JSON only."

    # Try several possible call patterns for different versions of google-generativeai
    content = None
    tried = []

    # Helper to safely call a function and extract text-like content
    def _call_and_get(resp):
        # Try common attributes first
        try:
            for attr in ("text", "output_text", "output", "content", "result", "data"):
                try:
                    val = getattr(resp, attr)
                    if val:
                        return val
                except Exception:
                    continue
        except Exception:
            pass

        # If dict-like or list-like, walk and collect strings
        def _collect_strings(obj, depth=0):
            if depth > 4 or obj is None:
                return []
            results = []
            if isinstance(obj, str):
                return [obj]
            if isinstance(obj, dict):
                for k, v in obj.items():
                    results.extend(_collect_strings(v, depth + 1))
                return results
            if isinstance(obj, list):
                for v in obj:
                    results.extend(_collect_strings(v, depth + 1))
                return results
            # try object attributes
            try:
                for name in ("text", "content", "output_text", "result", "candidates", "generations"):
                    if hasattr(obj, name):
                        try:
                            val = getattr(obj, name)
                            results.extend(_collect_strings(val, depth + 1))
                        except Exception:
                            continue
            except Exception:
                pass
            # fallback to string representation
            try:
                s = str(obj)
                return [s]
            except Exception:
                return []

        try:
            if isinstance(resp, dict) or isinstance(resp, list):
                strs = _collect_strings(resp)
            else:
                strs = _collect_strings(resp)
            # pick the longest candidate string
            if strs:
                strs = [s for s in strs if isinstance(s, str) and len(s) > 0]
                if strs:
                    strs.sort(key=lambda s: len(s), reverse=True)
                    return strs[0]
        except Exception:
            pass

        # fallback to string
        try:
            s = str(resp)
            return s
        except Exception:
            return None

    # Candidate call patterns (name, callable-wrapper)
    candidates = []

    # Prefer model object patterns available in newer google-generativeai versions
    if hasattr(genai, "get_model"):
        # try generate_content with explicit input
        candidates.append(("get_model.generate_content_input", lambda: genai.get_model(model).generate_content(input=prompt)))
        # try start_chat with input keyword
        candidates.append(("get_model.start_chat_input", lambda: genai.get_model(model).start_chat(input=prompt)))
        # try start_chat with positional messages
        candidates.append(("get_model.start_chat_messages", lambda: genai.get_model(model).start_chat([{"role": "system", "content": system}, {"role": "user", "content": normalized_text}])))
    if hasattr(genai, "GenerativeModel"):
        # several variants: generate_content with input, positional prompt, and start_chat with different arg shapes
        candidates.append(("GenerativeModel.generate_content_input", lambda: genai.GenerativeModel(model_name=model).generate_content(input=prompt)))
        candidates.append(("GenerativeModel.generate_content_prompt", lambda: genai.GenerativeModel(model_name=model).generate_content(prompt)))
        candidates.append(("GenerativeModel.start_chat_input", lambda: genai.GenerativeModel(model_name=model).start_chat(input=prompt)))
        candidates.append(("GenerativeModel.start_chat_messages", lambda: genai.GenerativeModel(model_name=model).start_chat([{"role": "system", "content": system}, {"role": "user", "content": normalized_text}])))
        candidates.append(("GenerativeModel.start_chat_content", lambda: genai.GenerativeModel(model_name=model).start_chat(content=prompt)))

    # 1) genai.generate_text(model=..., input=...)
    if hasattr(genai, "generate_text"):
        candidates.append(("generate_text", lambda: genai.generate_text(model=model, input=prompt)))

    # 2) genai.text.generate(model=..., prompt=...)
    if hasattr(genai, "text") and hasattr(genai.text, "generate"):
        candidates.append(("text.generate", lambda: genai.text.generate(model=model, prompt=prompt)))

    # 3) genai.chat.create(model=..., messages=[...])
    if hasattr(genai, "chat") and hasattr(genai.chat, "create"):
        messages = [{"role": "system", "content": system}, {"role": "user", "content": normalized_text}]
        candidates.append(("chat.create", lambda: genai.chat.create(model=model, messages=messages)))

    # 4) genai.responses.create(model=..., input=[...])
    if hasattr(genai, "responses") and hasattr(genai.responses, "create"):
        candidates.append(("responses.create", lambda: genai.responses.create(model=model, input=[{"role": "system", "content": system}, {"role": "user", "content": normalized_text}])))

    # 5) genai.respond(...) (older)
    if hasattr(genai, "respond"):
        candidates.append(("respond", lambda: genai.respond(model=model, input=prompt)))

    # 6) client-level generate (genai.client.generate_text)
    if hasattr(genai, "client") and hasattr(genai.client, "generate_text"):
        candidates.append(("client.generate_text", lambda: genai.client.generate_text(model=model, input=prompt)))

    # 7) fallback to a plain function 'generate' if present
    if hasattr(genai, "generate"):
        candidates.append(("generate", lambda: genai.generate(model=model, input=prompt)))

    # try responder module functions if present
    try:
        responder = getattr(genai, "responder", None)
        if responder is not None:
            for name in ("respond", "create", "get_response", "respond_async", "create_response"):
                if hasattr(responder, name):
                    candidates.append((f"responder.{name}", lambda n=name: getattr(responder, n)(model=model, input=prompt)))
    except Exception:
        pass

    # try positional start_chat / generate_content calls (no kwargs)
    if hasattr(genai, "GenerativeModel"):
        candidates.append(("GenerativeModel.start_chat_positional", lambda: genai.GenerativeModel(model_name=model).start_chat(prompt)))
        candidates.append(("GenerativeModel.generate_content_positional", lambda: genai.GenerativeModel(model_name=model).generate_content(prompt)))

    last_exc = None
    for name, call in candidates:
        tried.append(name)
        try:
            resp = call()
            content = _call_and_get(resp)
            if content:
                break
        except Exception as e:
            last_exc = e
            logger.debug("Gemini candidate %s failed: %s", name, e)
    if not content:
        logger.exception("Gemini request failed; tried: %s; last_exc=%s", tried, repr(last_exc))
        return None

    # Try to load JSON directly, else extract a JSON substring
    try:
        data = json.loads(content)
        label = str(data.get("label", "Unknown error"))
        confidence = float(data.get("confidence", 0.5))
        return (label, confidence)
    except Exception:
        import re

        m = re.search(r"(\{.*\})", content, re.DOTALL)
        if m:
            try:
                data = json.loads(m.group(1))
                label = str(data.get("label", "Unknown error"))
                confidence = float(data.get("confidence", 0.5))
                return (label, confidence)
            except Exception:
                logger.exception("Failed to parse JSON substring from Gemini response: %s", content[:1000])
                return None

        logger.exception("Could not parse Gemini response as JSON: %s", content[:1000])
        return None
