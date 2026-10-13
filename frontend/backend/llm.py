"""LLM provider switch: uses Gemini if GEMINI_API_KEY is set, otherwise Claude (ANTHROPIC_API_KEY)."""
import json
import os


def provider() -> str:
    return "gemini" if os.getenv("GEMINI_API_KEY") else "claude"


def complete_json(prompt: str) -> dict:
    """Send a prompt, return the model's reply parsed as JSON."""
    if provider() == "gemini":
        from google import genai

        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=prompt,
            config={"response_mime_type": "application/json", "temperature": 0.2},
        )
        text = resp.text
    else:
        import anthropic

        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
        resp = client.messages.create(
            model=os.getenv("CLAUDE_MODEL", "claude-sonnet-5-5"),
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in resp.content if b.type == "text")
    return parse_json(text)


def parse_json(text: str) -> dict:
    """Tolerate ```json fences or stray prose around the object."""
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"Model did not return JSON: {text[:200]}")
    return json.loads(text[start : end + 1])


if __name__ == "__main__":
    assert parse_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert parse_json('Here you go: {"a": {"b": [1]}} done') == {"a": {"b": [1]}}
    print("ok")
