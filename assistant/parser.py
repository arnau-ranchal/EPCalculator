import re


def get_default_params():
    """Returns a dictionary of default parameters for the exponents function."""
    return {
        "M": 4.0,
        "typeM": "psk",
        "SNR": 10.0,
        "R": 0.5,
        "N": 1000.0,
        "n": 1.0,
        "threshold": 0.001
    }


def preprocess_sentence(sentence):
    """Applies initial transformations to the sentence."""
    # Handle full modulation names (case-insensitive replacement)
    s = re.sub(r"pulse amplitude modulation", "pam", sentence, flags=re.IGNORECASE)
    s = re.sub(r"phase-shifting keying", "psk", s, flags=re.IGNORECASE)
    return s


def parse_sentence(original_sentence):
    """
    Parses a sentence to extract the target result and parameters for the 'exponents' function.

    Args:
        original_sentence (str): The input sentence.

    Returns:
        dict: A dictionary containing 'requested_result_name', 'requested_result_index',
              'parameters' (a dict of all parameters with their values),
              and 'extracted_from_sentence'.
              Returns None if the sentence cannot be meaningfully parsed.
    """
    sentence_processed_for_typeM = preprocess_sentence(original_sentence)
    sentence_lower = sentence_processed_for_typeM.lower()  # For case-insensitive matching
    # For N and n, we need to search in the original casing version (after typeM preprocessing)
    sentence_for_N_n_matching = sentence_processed_for_typeM

    params = get_default_params()
    extracted_params_info = {}

    # 1. Identify Target Result
    result_keywords = {
        "error probability": ("Error Probability", 0),
        "pe": ("Error Probability", 0),
        "error exponent": ("Error Exponent", 1),
        "exponent": ("Error Exponent", 1),
        "e0": ("Error Exponent", 1),
        "optimal rho": ("Optimal rho", 2),
        "rho": ("Optimal rho", 2)
    }
    requested_result_name = "Error Exponent"  # Default
    requested_result_index = 1

    # Use sentence_lower for result keyword matching as they are phrases
    # Sort keywords by length descending to match longer phrases first e.g. "error exponent" before "exponent"
    sorted_result_keywords = sorted(result_keywords.items(), key=lambda item: len(item[0]), reverse=True)

    for keyword, (name, index) in sorted_result_keywords:
        if keyword in sentence_lower:
            requested_result_name = name
            requested_result_index = index
            break  # First (longest) match is taken

    # 2. Define Parameter Keywords and Regex Patterns
    param_patterns = {
        # Case-insensitive parameters (searched in sentence_lower)
        "M": [
            r"modulation order(?: of)?\s*(\d+\.?\d*)",
            r"m-ary\s*(\d+\.?\d*)",
            r"\bm\s+points\s*(\d+\.?\d*)",  # e.g. M points 16
            r"(\d+)\s*(?:-?points?)\b",  # e.g. 16 points, 16-point
            r"\bm\s*of\s*(\d+\.?\d*)",  # e.g. M of 8
            r"\bm\s*=\s*(\d+\.?\d*)",  # e.g. M = 32
            r"\bm\s+(\d+\.?\d*)\b",  # e.g. m 2 (must be standalone number)
        ],
        "typeM": [
            r"modulation type\s*(psk|pam|custom)\b",
            r"constellation\s*(psk|pam|custom)\b",
            r"const\s+(psk|pam|custom)\b",  # e.g. const pam
            r"\b(psk|pam|custom)\b"  # standalone psk, pam, custom
        ],
        "SNR": [
            r"snr\s*=\s*(-?\d+\.?\d*)",
            r"snr(?: of)?\s*(-?\d+\.?\d*)",
            r"signal to noise ratio(?: of)?\s*(-?\d+\.?\d*)"
        ],
        "R": [
            r"rate\s*of\s*(\d+\.?\d*\s*/\s*\d+\.?\d*|\d+\.?\d*)",  # Specific "rate of"
            r"channel\s*rate\s*of\s*(\d+\.?\d*\s*/\s*\d+\.?\d*|\d+\.?\d*)",
            r"\br\s+(\d+\.?\d*\s*/\s*\d+\.?\d*|\d+\.?\d*)\b",  # r 0.6
            r"rate\s+(\d+\.?\d*\s*/\s*\d+\.?\d*|\d+\.?\d*)",  # General "rate 0.5"
            r"channel\s*rate\s+(\d+\.?\d*\s*/\s*\d+\.?\d*|\d+\.?\d*)",
        ],
        "threshold": [
            r"threshold\s*(?:is|of)?\s*(\d+\.?\d*(?:e-?\d+)?)",
            r"convergence threshold\s*(?:is|of)?\s*(\d+\.?\d*(?:e-?\d+)?)"
        ],
        # Case-sensitive parameters (searched in sentence_for_N_n_matching)
        "N": [
            r"\bN value(?: of)?\s*(\d+\.?\d*)",
            r"\bparameter N(?: of)?\s*(\d+\.?\d*)",
            r"\bN\s*=\s*(\d+\.?\d*)",
            r"\bN\s+(\d+\.?\d*)\b",  # N 30
        ],
        "n": [
            r"\bn factor(?: of)?\s*(\d+\.?\d*)",
            r"\bfactor n(?: of)?\s*(\d+\.?\d*)",
            r"\bn\s*=\s*(\d+\.?\d*)",
            r"\bn\s+(\d+\.?\d*)\b",  # n 100
        ]
    }

    # 3. Extract Parameters
    for param_key, patterns in param_patterns.items():
        text_to_search = sentence_lower
        regex_flags = re.IGNORECASE

        if param_key in ["N", "n"]:
            text_to_search = sentence_for_N_n_matching
            regex_flags = 0  # Case-sensitive

        for pattern in patterns:
            match = re.search(pattern, text_to_search, regex_flags)
            if match:
                # Find the first non-None group, as some patterns might have multiple groups
                # (though these are designed for one capture group for the value)
                value_str = next((g for g in match.groups() if g is not None), None)
                if value_str is None:  # Should not happen if pattern is well-formed with one capture
                    continue

                try:
                    if param_key == "typeM":
                        params[param_key] = value_str.lower()  # Ensure psk/pam/custom are lowercase
                    elif param_key == "R" and "/" in value_str:
                        num, den = map(float, value_str.split('/'))
                        if den == 0: continue
                        params[param_key] = num / den
                    else:
                        params[param_key] = float(value_str)

                    extracted_params_info[param_key] = params[param_key]
                    break
                except ValueError:
                    print(f"Warning: Could not convert value '{value_str}' for parameter '{param_key}'.")
                    continue

    return {
        "requested_result_name": requested_result_name,
        "requested_result_index": requested_result_index,
        "parameters": params,
        "extracted_from_sentence": extracted_params_info
    }


def parse(sentence): # main
    print(f"Input: \"{sentence}\"")
    parsed_info = parse_sentence(sentence)
    if parsed_info:
        print(
            f"  Requested: {parsed_info['requested_result_name']} (results[{parsed_info['requested_result_index']}])")
        print(f"  Parameters: {parsed_info['parameters']}")
        if parsed_info['extracted_from_sentence']:
            print(f"  Extracted from sentence: {parsed_info['extracted_from_sentence']}")
        else:
            print("  No parameters explicitly extracted, using all defaults for parameters.")
    else:
        print("  Could not parse the sentence meaningfully.")
    print("-" * 40)
