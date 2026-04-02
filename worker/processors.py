"""
Task processor functions for each supported operation.
"""
import re
from collections import Counter
from datetime import datetime, timezone


SUPPORTED_OPERATIONS = {
    "uppercase",
    "lowercase",
    "reverse",
    "word_count",
    "char_count",
    "palindrome",
}


def process_task(operation: str, input_text: str) -> dict:
    """
    Main dispatcher for task operations.
    Returns a structured result dict.
    """
    if operation not in SUPPORTED_OPERATIONS:
        raise ValueError(f"Unsupported operation: '{operation}'. Supported: {', '.join(sorted(SUPPORTED_OPERATIONS))}")

    if not isinstance(input_text, str):
        raise TypeError(f"inputText must be a string, got {type(input_text).__name__}")

    processors = {
        "uppercase": process_uppercase,
        "lowercase": process_lowercase,
        "reverse": process_reverse,
        "word_count": process_word_count,
        "char_count": process_char_count,
        "palindrome": process_palindrome,
    }

    processor = processors[operation]
    result = processor(input_text)

    return {
        "operation": operation,
        "output": result["output"],
        "metadata": result.get("metadata", {}),
        "processedAt": datetime.now(timezone.utc).isoformat(),
        "inputLength": len(input_text),
    }


def process_uppercase(text: str) -> dict:
    return {
        "output": text.upper(),
        "metadata": {"changed_chars": sum(1 for a, b in zip(text, text.upper()) if a != b)},
    }


def process_lowercase(text: str) -> dict:
    return {
        "output": text.lower(),
        "metadata": {"changed_chars": sum(1 for a, b in zip(text, text.lower()) if a != b)},
    }


def process_reverse(text: str) -> dict:
    reversed_text = text[::-1]
    return {
        "output": reversed_text,
        "metadata": {"is_palindrome": text.lower() == reversed_text.lower()},
    }


def process_word_count(text: str) -> dict:
    words = re.findall(r"\b\w+\b", text)
    word_freq = Counter(word.lower() for word in words)
    top_words = word_freq.most_common(10)
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]

    return {
        "output": len(words),
        "metadata": {
            "word_count": len(words),
            "unique_words": len(word_freq),
            "sentence_count": len(sentences),
            "avg_word_length": round(sum(len(w) for w in words) / len(words), 2) if words else 0,
            "top_10_words": [{"word": w, "count": c} for w, c in top_words],
            "paragraph_count": len([p for p in text.split("\n\n") if p.strip()]),
        },
    }


def process_char_count(text: str) -> dict:
    alpha = sum(1 for c in text if c.isalpha())
    digits = sum(1 for c in text if c.isdigit())
    spaces = sum(1 for c in text if c.isspace())
    special = len(text) - alpha - digits - spaces

    return {
        "output": len(text),
        "metadata": {
            "total": len(text),
            "alphabetic": alpha,
            "digits": digits,
            "spaces": spaces,
            "special": special,
            "without_spaces": len(text) - spaces,
            "unique_chars": len(set(text)),
        },
    }


def process_palindrome(text: str) -> dict:
    # Clean text for palindrome check
    cleaned = re.sub(r"[^a-zA-Z0-9]", "", text).lower()
    is_palindrome = cleaned == cleaned[::-1]

    # Find all palindromic words
    words = re.findall(r"\b\w+\b", text)
    palindrome_words = [w for w in words if len(w) > 1 and w.lower() == w.lower()[::-1]]

    return {
        "output": is_palindrome,
        "metadata": {
            "is_palindrome": is_palindrome,
            "cleaned_text": cleaned,
            "palindrome_words": list(set(palindrome_words)),
            "palindrome_word_count": len(palindrome_words),
        },
    }
