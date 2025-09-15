import logging
import requests
from requests.exceptions import RequestException

logger = logging.getLogger("api.ollama_client")

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_TIMEOUT = 300  # seconds (increased to accommodate long model warm-up / generation times)


def _handle_response(resp):
    resp.raise_for_status()
    return resp.json()


def list_ollama_models(timeout: int = DEFAULT_TIMEOUT):
    """Fetch all available Ollama models (tags) from the local Ollama server."""
    logger.debug("Listing Ollama models, base_url=%s timeout=%s", OLLAMA_BASE_URL, timeout)
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=timeout)
        data = _handle_response(resp)
        models = data.get("models", [])
        logger.debug("List Ollama models response: models_count=%d", len(models))
        return models
    except RequestException as e:
        logger.exception("Failed to list Ollama models: %s", e)
        raise RuntimeError(f"Ollama request failed: {e}")


def pull_ollama_model(model_name: str, timeout: int = DEFAULT_TIMEOUT):
    """Pull a model from the Ollama registry."""
    logger.info("Requesting pull for Ollama model=%s timeout=%s", model_name, timeout)
    try:
        resp = requests.post(f"{OLLAMA_BASE_URL}/api/pull", json={"name": model_name}, timeout=timeout)
        result = _handle_response(resp)
        logger.info("Pull request accepted for model=%s", model_name)
        return result
    except RequestException as e:
        logger.exception("Failed to pull Ollama model %s: %s", model_name, e)
        raise RuntimeError(f"Ollama request failed: {e}")


def generate_with_ollama(model: str, prompt: str, options: dict = None, timeout: int = DEFAULT_TIMEOUT):
    """Generate a response using a specific Ollama model.

    Behavior improvements:
    - If the requested model is not currently running, attempt to pull it and poll for it to appear (warm-up).
    - Retry requests with exponential backoff on transient network errors.
    """
    import time

    payload = {
        "model": model,
        "prompt": prompt,
    }
    if options:
        payload.update(options)

    logger.info("Starting Ollama generate: model=%s timeout=%s", model, timeout)
    logger.debug("Payload keys: %s", list(payload.keys()))

    # Ensure model is running (attempt warm-up if not)
    try:
        running = list_running_ollama_models(timeout=timeout)
    except Exception as e:
        logger.warning("Could not list running models: %s", e)
        running = []
    running_names = set([m.get("name") or m.get("model") for m in (running or [])])
    logger.debug("Currently running models: %s", sorted(running_names))

    if model and model not in running_names:
        logger.info("Model %s not running; attempting warm-up/pull", model)
        # Attempt to pull the model to trigger a warm-up (best-effort)
        try:
            pull_ollama_model(model, timeout=timeout)
        except Exception as e:
            logger.warning("Pull model attempt failed (continuing to poll): %s", e)

        # Poll for the model to appear in running list (non-blocking warm-up)
        # Use short per-request timeouts and a bounded total wait to avoid blocking the API thread.
        poll_timeout = 5
        max_total_wait = min(30, timeout)  # don't wait longer than 30s by default
        poll_attempts = max(1, int(max_total_wait / poll_timeout))
        for i in range(poll_attempts):
            try:
                running = list_running_ollama_models(timeout=poll_timeout)
            except Exception:
                running = []
            running_names = set([m.get("name") or m.get("model") for m in (running or [])])
            logger.debug("Poll attempt %d/%d, running models: %s", i + 1, poll_attempts, sorted(running_names))
            if model in running_names:
                logger.info("Model %s appeared as running", model)
                break
            time.sleep(poll_timeout)

        if model not in running_names:
            logger.error("Model %s not running after warm-up/poll; running=%s", model, sorted(running_names))
            raise RuntimeError(f"Model '{model}' is not running after pull/warmup; running: {sorted(running_names)}")

    # Perform request with retry/backoff
    attempts = 3
    backoffs = [1, 2, 4]
    last_exc = None
    for attempt in range(attempts):
        try:
            logger.debug("Ollama generate attempt %d/%d", attempt + 1, attempts)
            resp = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload, timeout=timeout)
            data = _handle_response(resp)
            logger.info("Ollama generate successful for model=%s", model)
            return data
        except RequestException as e:
            last_exc = e
            logger.warning("Ollama generate attempt %d failed: %s", attempt + 1, e)
            if attempt < attempts - 1:
                sleep_for = backoffs[min(attempt, len(backoffs) - 1)]
                logger.debug("Sleeping %s seconds before next attempt", sleep_for)
                time.sleep(sleep_for)
            else:
                logger.exception("Ollama generate failed after %d attempts: %s", attempts, e)
                raise RuntimeError(f"Ollama request failed after {attempts} attempts: {e}")


def list_running_ollama_models(timeout: int = DEFAULT_TIMEOUT):
    """List currently loaded/running Ollama models."""
    logger.debug("Listing running Ollama models, timeout=%s", timeout)
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/ps", timeout=timeout)
        data = _handle_response(resp)
        models = data.get("models", [])
        logger.debug("Running models found: %s", [m.get("name") or m.get("model") for m in models])
        return models
    except RequestException as e:
        logger.exception("Failed to list running Ollama models: %s", e)
        raise RuntimeError(f"Ollama request failed: {e}")


def chat_with_ollama(model: str, messages: list, options: dict = None, timeout: int = DEFAULT_TIMEOUT):
    """Chat completion with Ollama model.

    If the model is not running, attempt warm-up then retry with backoff.
    """
    import time

    payload = {
        "model": model,
        "messages": messages,
    }
    if options:
        payload.update(options)

    logger.info("Starting Ollama chat: model=%s timeout=%s", model, timeout)

    # Ensure model is running (attempt warm-up if not)
    try:
        running = list_running_ollama_models(timeout=timeout)
    except Exception as e:
        logger.warning("Could not list running models before chat: %s", e)
        running = []
    running_names = set([m.get("name") or m.get("model") for m in (running or [])])
    logger.debug("Currently running models for chat: %s", sorted(running_names))

    if model and model not in running_names:
        logger.info("Model %s not running; attempting warm-up/pull for chat", model)
        try:
            pull_ollama_model(model, timeout=timeout)
        except Exception as e:
            logger.warning("Pull model attempt for chat failed (continuing to poll): %s", e)

        # Poll for model for chat with short per-request timeouts and bounded wait
        poll_timeout = 5
        max_total_wait = min(30, timeout)
        poll_attempts = max(1, int(max_total_wait / poll_timeout))
        for i in range(poll_attempts):
            try:
                running = list_running_ollama_models(timeout=poll_timeout)
            except Exception:
                running = []
            running_names = set([m.get("name") or m.get("model") for m in (running or [])])
            logger.debug("Chat poll attempt %d/%d, running models: %s", i + 1, poll_attempts, sorted(running_names))
            if model in running_names:
                logger.info("Model %s appeared as running for chat", model)
                break
            time.sleep(poll_timeout)

        if model not in running_names:
            logger.error("Model %s not running after warm-up/poll for chat; running=%s", model, sorted(running_names))
            raise RuntimeError(f"Model '{model}' is not running after pull/warmup; running: {sorted(running_names)}")

    # Retry logic
    attempts = 3
    backoffs = [1, 2, 4]
    for attempt in range(attempts):
        try:
            logger.debug("Ollama chat attempt %d/%d", attempt + 1, attempts)
            resp = requests.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload, timeout=timeout)
            data = _handle_response(resp)
            logger.info("Ollama chat successful for model=%s", model)
            return data
        except RequestException as e:
            logger.warning("Ollama chat attempt %d failed: %s", attempt + 1, e)
            if attempt < attempts - 1:
                sleep_for = backoffs[min(attempt, len(backoffs) - 1)]
                logger.debug("Sleeping %s seconds before next chat attempt", sleep_for)
                time.sleep(sleep_for)
            else:
                logger.exception("Ollama chat failed after %d attempts: %s", attempts, e)
                raise RuntimeError(f"Ollama request failed after {attempts} attempts: {e}")
