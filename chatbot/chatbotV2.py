import torch
import logging
import re
import json
import numpy as np
from typing import Dict, List, Optional, Tuple, Any, Generator
from dataclasses import dataclass
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
import time
import threading
import random
import sys
import requests
from exponents.utils import call_exponents

# ================== AGENT CLASSES ===================
@dataclass
class ExecutionResult:
    success: bool
    result_value: Any
    execution_time: float
    parameters_used: Dict
    error_message: Optional[str] = None

@dataclass
class FunctionCall:
    function_name: str
    parameters: Dict[str, any]
    raw_text: str
    is_valid: bool = True
    error_message: Optional[str] = None

@dataclass
class ConversationEntry:
    user_message: str
    agent_response: str
    function_calls: List[FunctionCall]
    timestamp: float

def dummy_plotFromFunction(**params) -> str:
    time.sleep(0.2)
    y_var = params.get('y', 'error_probability')
    x_var = params.get('x', 'snr')
    modulation = params.get('typeModulation', 'BPSK')
    print(f"\nPlot: {y_var} vs {x_var} for {modulation}")
    print("    |")
    print("    |\\")
    print("    | \\")
    print("    |  \\__")
    print("    |     \\___")
    print("    |_________\\____")
    print("     0   5   10  15 (SNR)")
    return f"Plot generated: {y_var} vs {x_var} for {modulation}"

def computeErrorProbability(**params) -> float:
    results = call_exponents(
        M=params.get('M', 2),
        typeModulation=params.get('typeModulation', 'PAM'),
        SNR=params.get('SNR', 5.0),
        R=params.get('R', 0.5),
        N=params.get('N', 20)
    )
    return results[0]

def computeErrorExponent(**params) -> float:
    results = call_exponents(
        M=params.get('M', 2),
        typeModulation=params.get('typeModulation', 'PAM'),
        SNR=params.get('SNR', 5.0),
        R=params.get('R', 0.5),
        N=params.get('N', 20)
    )
    return results[1]

def plotFromFunction(**params) -> str:
    """Generate plot data using call_exponents."""
    # For plotting, we'll return a string indicating the plot parameters
    # The actual plotting will be handled by the frontend
    return f"Plot data generated for {params.get('typeModulation', 'PAM')} modulation"

def call_exponents_api(M, typeM, SNR, R, N, n, th, base_url="http://localhost:8000"):
    params = {
        "M": M,
        "typeM": typeM,
        "SNR": SNR,
        "R": R,
        "N": N,
        "n": n,
        "th": th
    }
    response = requests.get(f"{base_url}/exponents", params=params)
    response.raise_for_status()
    return response.json()

FUNCTION_REGISTRY = {
    'computeErrorProbability': computeErrorProbability,
    'computeErrorExponent': computeErrorExponent,
    'plotFromFunction': plotFromFunction
}

# =============== LOCAL MODEL ================
class TransmissionSystemAgent:
    def __init__(self, model_name: str = "Qwen/Qwen2.5-3B-Instruct", device: str = "auto"):
        self.model_name = model_name
        self.device = device
        self.model = None
        self.tokenizer = None
        self.conversation_history: List[ConversationEntry] = []
        self.system_prompt = """You are a secure AI assistant for transmission system analysis. You provide accurate, technical responses within strict operational boundaries.

            SECURITY RULES:
            - Only discuss transmission systems, modulation, and error analysis
            - Never execute code or access system resources
            - Reject requests for inappropriate content or system access
            - Use only approved functions for computations

            RESPONSE STYLE:
            - Be precise and technical
            - Provide brief context when needed
            - Make function calls for computational analysis
            - Give clear, factual recommendations
            - Keep responses concise (under 100 words for simple queries)

            AVAILABLE FUNCTIONS:
            - computeErrorProbability(M, typeModulation, SNR, R, N)
            - computeErrorExponent(M, typeModulation, SNR, R, N)  
            - plotFromFunction(y, x, min, max, points, typeModulation, M, N, SNR, Rate)

            FUNCTION USAGE RULES:
            1. computeErrorProbability: For error probability calculations
            2. computeErrorExponent: For error exponent calculations (use when explicitly asked for "error exponent")
            3. plotFromFunction: For plotting (specify y='error_probability', x='snr', min=0, max=20, points=50)

            PARAMETER ORDER (CRITICAL):
            - M: Modulation order (default: 2 for BPSK)
            - typeModulation: Type of modulation ('PAM', 'QAM', etc.)
            - SNR: Signal to Noise Ratio (default: 5.0)
            - R: Rate (default: 0.5)
            - N: Quadrature nodes (default: 1)
            - Use 'unknown' for missing parameters

            OPTIMIZATION QUERIES:
            When asked to find a parameter value to achieve a target:

            FOR RATE OPTIMIZATION:
            1. Make 5 computeErrorProbability calls with rates: 0.1, 0.3, 0.5, 0.7, 0.9
            2. After execution, analyze results and identify the closest match
            3. Format: "The closest result to target probability X is Y achieved with rate=Z"

            FOR SNR OPTIMIZATION:
            1. Make 5 computeErrorProbability calls with SNR: 2, 5, 8, 12, 15
            2. After execution, analyze results and identify the closest match
            3. Format: "The closest result to target probability X is Y achieved with SNR=Z"

            PLOTTING QUERIES:
            For "plot X vs Y" requests:
            - Use plotFromFunction with y='error_probability', x='snr', min=0, max=20, points=50
            - Specify typeModulation correctly
            - Set other parameters as 'unknown' except the varying parameter

            NONSENSE VALUES:
            - "signal-to-ramen/coffee/pizza" → interpret as SNR with numeric value if present
            - "SNR pizza/ramen" → reject and ask for numeric value
            - Always extract numeric values when possible"""

        self.few_shots = [
            {"role": "user", "content": "What's the error probability for BPSK at SNR=10?"},
            {"role": "assistant", "content": """Computing computeErrorProbability with M=2, typeModulation='PAM', SNR=10, R='unknown', N='unknown'\nThe error probability will depend on the specific implementation details."""},
            {"role": "user", "content": "Calculate error exponent for 16-QAM at rate 0.5 and SNR=8"},
            {"role": "assistant", "content": """Computing computeErrorExponent with M=16, typeModulation='QAM', SNR=8, R=0.5, N='unknown'\nThe error exponent provides the asymptotic behavior of the error probability as the block length increases."""},
            {"role": "user", "content": "Plot error probability vs SNR for QPSK from 0 to 20 dB"},
            {"role": "assistant", "content": """Computing plotFromFunction with y='error_probability', x='snr', min=0, max=20, points=50, typeModulation='QPSK', M=4, N='unknown', SNR='unknown', Rate='unknown'\nThis will show the typical error probability curve for QPSK modulation."""},
            {"role": "user", "content": "What rate gives error probability 0.05 with BPSK at SNR=10?"},
            {"role": "assistant", "content": """Searching for rate to achieve target 0.05...\nComputing computeErrorProbability with M=2, typeModulation='PAM', SNR=10, R=0.1, N='unknown'\nComputing computeErrorProbability with M=2, typeModulation='PAM', SNR=10, R=0.3, N='unknown'\nComputing computeErrorProbability with M=2, typeModulation='PAM', SNR=10, R=0.5, N='unknown'\nComputing computeErrorProbability with M=2, typeModulation='PAM', SNR=10, R=0.7, N='unknown'\nComputing computeErrorProbability with M=2, typeModulation='PAM', SNR=10, R=0.9, N='unknown'"""},
            {"role": "user", "content": "Compare BPSK and QPSK at SNR=8"},
            {"role": "assistant", "content": """Computing computeErrorProbability with M=2, typeModulation='PAM', SNR=8, R='unknown', N='unknown'\nComputing computeErrorProbability with M=4, typeModulation='PAM', SNR=8, R='unknown', N='unknown'\nBPSK typically provides better error performance at the same SNR, while QPSK offers higher spectral efficiency."""}
        ]

    def load_model(self) -> None:
        logging.info(f"Loading model: {self.model_name}")
        start_time = time.time()
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.float16,
            device_map=self.device,
            trust_remote_code=True
        )
        load_time = time.time() - start_time
        logging.info(f"Model loaded in {load_time:.2f}s")

    def _build_conversation_context(self, current_message: str, max_history: int = 2) -> str:
        messages = [{"role": "system", "content": self.system_prompt}]
        messages.extend(self.few_shots)
        recent_history = self.conversation_history[-max_history:] if self.conversation_history else []
        for entry in recent_history:
            messages.append({"role": "user", "content": entry.user_message})
            messages.append({"role": "assistant", "content": entry.agent_response[:200]})
        messages.append({"role": "user", "content": current_message})
        return self.tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )

    def generate_response_stream(self, user_message: str) -> Generator[str, None, None]:
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        prompt = self._build_conversation_context(user_message)
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        streamer = TextIteratorStreamer(
            self.tokenizer, 
            timeout=10.0,
            skip_prompt=True,
            skip_special_tokens=True
        )
        generation_kwargs = {
            **inputs,
            "max_new_tokens": 200,
            "temperature": 0.3,
            "top_p": 0.9,              
            "do_sample": True,
            "repetition_penalty": 1.05,
            "pad_token_id": self.tokenizer.pad_token_id or self.tokenizer.eos_token_id,
            "eos_token_id": self.tokenizer.eos_token_id,
            "streamer": streamer,
        }
        generation_thread = threading.Thread(
            target=self.model.generate,
            kwargs=generation_kwargs
        )
        generation_thread.start()
        for new_text in streamer:
            yield new_text
        generation_thread.join()

    def parse_function_calls(self, response: str) -> List[FunctionCall]:
        function_calls = []
        patterns = {
            'computeErrorProbability': r"Computing computeErrorProbability with (.+)",
            'computeErrorExponent': r"Computing computeErrorExponent with (.+)",
            'plotFromFunction': r"Computing plotFromFunction with (.+)"
        }
        for line in response.split('\n'):
            line = line.strip()
            if not line.startswith('Computing'):
                continue
            for func_name, pattern in patterns.items():
                match = re.search(pattern, line)
                if match:
                    try:
                        parameters = self._parse_parameters(match.group(1))
                        is_valid, error_msg = self._validate_parameters(func_name, parameters)
                        function_call = FunctionCall(
                            function_name=func_name,
                            parameters=parameters,
                            raw_text=line,
                            is_valid=is_valid,
                            error_message=error_msg
                        )
                        function_calls.append(function_call)
                        break
                    except Exception as e:
                        function_call = FunctionCall(
                            function_name=func_name,
                            parameters={},
                            raw_text=line,
                            is_valid=False,
                            error_message=f"Parsing error: {str(e)}"
                        )
                        function_calls.append(function_call)
        return function_calls

    def _parse_parameters(self, params_str: str) -> Dict[str, any]:
        parameters = {}
        param_pairs = re.findall(r"(\w+)=([^,]+)", params_str)
        for param_name, param_value in param_pairs:
            param_value = param_value.strip().strip("'\"")
            if param_value == 'unknown':
                parameters[param_name] = 'unknown'
            elif param_value.replace('.', '').replace('-', '').isdigit():
                parameters[param_name] = float(param_value) if '.' in param_value else int(param_value)
            else:
                parameters[param_name] = param_value
        return parameters

    def _validate_parameters(self, func_name: str, parameters: Dict) -> Tuple[bool, Optional[str]]:
        try:
            if func_name in ['computeErrorProbability', 'computeErrorExponent']:
                if 'SNR' in parameters and parameters['SNR'] != 'unknown':
                    snr_val = parameters['SNR']
                    if isinstance(snr_val, str) and snr_val.lower() in ['infinity', 'inf']:
                        return False, "SNR cannot be infinity"
                    elif isinstance(snr_val, (int, float)) and snr_val < 0:
                        return False, "SNR must be ≥ 0"
                if 'R' in parameters and parameters['R'] != 'unknown':
                    if not (0 < parameters['R'] <= 1):
                        return False, "Rate must be between 0 and 1"
                if 'M' in parameters and parameters['M'] != 'unknown':
                    if not isinstance(parameters['M'], (int, float)) or parameters['M'] < 1:
                        return False, "Modulation order M must be ≥ 1"
                if 'typeModulation' in parameters and parameters['typeModulation'] != 'unknown':
                    valid_types = ['PAM', 'QAM']
                    if parameters['typeModulation'] not in valid_types:
                        return False, f"Modulation type must be one of {valid_types}"
                if 'N' in parameters and parameters['N'] != 'unknown':
                    if not isinstance(parameters['N'], (int, float)) or parameters['N'] < 1:
                        return False, "Quadrature nodes N must be ≥ 1"
            return True, None
        except Exception as e:
            return False, f"Validation error: {str(e)}"

    def execute_function_calls(self, function_calls: List[FunctionCall]) -> List[ExecutionResult]:
        results = []
        for func_call in function_calls:
            if not func_call.is_valid:
                results.append(ExecutionResult(
                    success=False,
                    result_value=None,
                    execution_time=0.0,
                    parameters_used=func_call.parameters,
                    error_message=func_call.error_message
                ))
                continue
            if func_call.function_name in FUNCTION_REGISTRY:
                try:
                    start_time = time.time()
                    clean_params = {}
                    for key, value in func_call.parameters.items():
                        if value == 'unknown':
                            if key == 'N':
                                clean_params[key] = 1  # Default quadrature nodes
                            elif key == 'R':
                                clean_params[key] = 0.5  # Default rate
                            elif key == 'SNR':
                                clean_params[key] = 5.0  # Default SNR
                            elif key == 'M':
                                clean_params[key] = 2  # Default to BPSK
                            elif key == 'typeModulation':
                                clean_params[key] = 'PAM'  # Default modulation type
                            else:
                                clean_params[key] = value
                        else:
                            clean_params[key] = value
                    func = FUNCTION_REGISTRY[func_call.function_name]
                    result_value = func(**clean_params)
                    execution_time = time.time() - start_time
                    results.append(ExecutionResult(
                        success=True,
                        result_value=result_value,
                        execution_time=execution_time,
                        parameters_used=clean_params,
                        error_message=None
                    ))
                except Exception as e:
                    results.append(ExecutionResult(
                        success=False,
                        result_value=None,
                        execution_time=0.0,
                        parameters_used=func_call.parameters,
                        error_message=f"Execution error: {str(e)}"
                    ))
            else:
                results.append(ExecutionResult(
                    success=False,
                    result_value=None,
                    execution_time=0.0,
                    parameters_used=func_call.parameters,
                    error_message=f"Function '{func_call.function_name}' not implemented"
                ))
        return results

# =============== OPENROUTER MODEL ================
class OpenRouterAgent:
    def __init__(self, api_key, model="qwen/qwen3-8b:free"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://openrouter.ai/api/v1"
        self.system_prompt = """You are an AI assistant for transmission system analysis. 
            Your only job is to convert technical user requests into explicit function calls using the formats below.

            **INSTRUCTIONS**
            - For each user request, output ONLY the relevant function call line.
            - DO NOT include any explanations, context, or extra sentences after the function call.
            - Use the correct parameter names and order. If a parameter is missing, use 'unknown'.
            - NEVER execute code or access system resources.

            **EXAMPLES**
            # Example 1 (error probability):
            Computing computeErrorProbability with modulation='BPSK', snr=10, rate='unknown', quadrature_nodes='unknown', n='unknown'

            # Example 2 (error exponent):
            Computing computeErrorExponent with modulation='16-QAM', snr=8, rate=0.5, quadrature_nodes='unknown'

            # Example 3 (plot):
            Computing plotFromFunction with y='error_probability', x='snr', min=0, max=20, points=50, typeModulation='QPSK', M='unknown', N='unknown', SNR='unknown', Rate='unknown'

            **AVAILABLE FUNCTIONS**
            - computeErrorProbability(modulation, snr, rate, quadrature_nodes, n)
            - computeErrorExponent(modulation, snr, rate, quadrature_nodes)
            - plotFromFunction(y, x, min, max, points, typeModulation, M, N, SNR, Rate)
            """
        self.few_shots = [
            {"role": "user", "content": "What's the error probability for BPSK at SNR=10?"},
            {"role": "assistant", "content": "Computing computeErrorProbability with modulation='BPSK', snr=10, rate='unknown', quadrature_nodes='unknown', n='unknown'"},
            {"role": "user", "content": "Calculate error exponent for 16-QAM at rate 0.5 and SNR=8"},
            {"role": "assistant", "content": "Computing computeErrorExponent with modulation='16-QAM', snr=8, rate=0.5, quadrature_nodes='unknown'"},
            {"role": "user", "content": "Plot error probability vs SNR for QPSK from 0 to 20 dB"},
            {"role": "assistant", "content": "Computing plotFromFunction with y='error_probability', x='snr', min=0, max=20, points=50, typeModulation='QPSK', M='unknown', N='unknown', SNR='unknown', Rate='unknown'"},
        ]

    def generate_response_stream(self, user_message: str) -> Generator[str, None, None]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }
        payload = {
            "model": self.model,
            "stream": True,
            "messages": [
                {"role": "system", "content": self.system_prompt},
                *self.few_shots,
                {"role": "user", "content": user_message}
            ]
        }
        with requests.post(url, headers=headers, json=payload, stream=True) as resp:
            buffer = ""
            for line in resp.iter_lines():
                if not line:
                    continue
                s = line.decode('utf-8').strip()
                if not s or not s.startswith('data:'):
                    continue
                s = s[5:].strip()
                if s == '[DONE]':
                    break
                try:
                    data = json.loads(s)
                    content = data.get('choices', [{}])[0].get('delta', {}).get('content', '')
                    buffer += content
                    if content:
                        yield content
                except Exception as e:
                    if s:
                        yield f"[stream error: {str(e)}]"

    def parse_function_calls(self, response: str) -> List[FunctionCall]:
        function_calls = []
        patterns = {
            'computeErrorProbability': r"Computing computeErrorProbability with (.+)",
            'computeErrorExponent': r"Computing computeErrorExponent with (.+)",
            'plotFromFunction': r"Computing plotFromFunction with (.+)"
        }
        for line in response.split('\n'):
            line = line.strip()
            if not line.startswith('Computing'):
                continue
            for func_name, pattern in patterns.items():
                match = re.search(pattern, line)
                if match:
                    try:
                        parameters = self._parse_parameters(match.group(1))
                        is_valid = True
                        function_call = FunctionCall(
                            function_name=func_name,
                            parameters=parameters,
                            raw_text=line,
                            is_valid=is_valid,
                            error_message=None
                        )
                        function_calls.append(function_call)
                        break
                    except Exception as e:
                        function_call = FunctionCall(
                            function_name=func_name,
                            parameters={},
                            raw_text=line,
                            is_valid=False,
                            error_message=f"Parsing error: {str(e)}"
                        )
                        function_calls.append(function_call)
        return function_calls

    def _parse_parameters(self, params_str: str) -> Dict[str, any]:
        parameters = {}
        param_pairs = re.findall(r"(\w+)=([^,]+)", params_str)
        for param_name, param_value in param_pairs:
            param_value = param_value.strip().strip("'\"")
            if param_value == 'unknown':
                parameters[param_name] = 'unknown'
            elif param_value.replace('.', '', 1).replace('-', '', 1).isdigit():
                parameters[param_name] = float(param_value) if '.' in param_value else int(param_value)
            else:
                parameters[param_name] = param_value
        return parameters

    def execute_function_calls(self, function_calls: List[FunctionCall]) -> List[ExecutionResult]:
        results = []
        for func_call in function_calls:
            if not func_call.is_valid:
                results.append(ExecutionResult(
                    success=False,
                    result_value=None,
                    execution_time=0.0,
                    parameters_used=func_call.parameters,
                    error_message=func_call.error_message
                ))
                continue
            if func_call.function_name in FUNCTION_REGISTRY:
                try:
                    start_time = time.time()
                    clean_params = {}
                    for key, value in func_call.parameters.items():
                        if value == 'unknown':
                            if key == 'quadrature_nodes':
                                clean_params[key] = 'default'
                            elif key == 'n':
                                clean_params[key] = 1000
                            elif key == 'rate':
                                clean_params[key] = 0.5
                            elif key == 'snr':
                                clean_params[key] = 5.0
                            else:
                                clean_params[key] = value
                        else:
                            clean_params[key] = value
                    func = FUNCTION_REGISTRY[func_call.function_name]
                    result_value = func(**clean_params)
                    execution_time = time.time() - start_time
                    results.append(ExecutionResult(
                        success=True,
                        result_value=result_value,
                        execution_time=execution_time,
                        parameters_used=clean_params,
                        error_message=None
                    ))
                except Exception as e:
                    results.append(ExecutionResult(
                        success=False,
                        result_value=None,
                        execution_time=0.0,
                        parameters_used=func_call.parameters,
                        error_message=f"Execution error: {str(e)}"
                    ))
            else:
                results.append(ExecutionResult(
                    success=False,
                    result_value=None,
                    execution_time=0.0,
                    parameters_used=func_call.parameters,
                    error_message=f"Function '{func_call.function_name}' not implemented"
                ))
        return results

# ================ TERMINAL INTERFACE ===================
class TerminalChatInterface:
    def __init__(self):
        self.agent = None
        self.running = False
        self.use_openrouter = False

    def print_welcome(self):
        print("=" * 60)
        print("TRANSMISSION SYSTEM AI ASSISTANT")
        print("=" * 60)
        print("Welcome! I can help you analyze transmission systems.")
        print("\nAvailable commands:")
        print("  - Type your question normally")
        print("  - 'quit' or 'exit' - Exit the chat")
        print("  - 'help' - Show this help message")
        print("  - 'clear' - Clear conversation history")
        print("  - 'history' - Show conversation history")
        print("\nI can compute error probabilities, error exponents, and generate plots.")
        print("=" * 60)

    def print_help(self):
        print("\nHELP - Available Functions:")
        print("- computeErrorProbability - Calculate bit/symbol error rates")
        print("- computeErrorExponent - Calculate error exponent values")
        print("- plotFromFunction - Generate performance plots")
        print("\nExample queries:")
        print("- 'Compare BPSK and QPSK at SNR=10'")
        print("- 'What is the error probability for 16-QAM at SNR=8?'")
        print("- 'Plot error rate vs SNR for BPSK from 0 to 15 dB'")
        print("- 'Calculate error exponent for 64-PAM at rate 0.5'")

    def initialize_agent(self):
        print("\nChoose model backend:")
        print("1. Local HuggingFace model")
        print("2. Remote OpenRouter (qwen/qwen3-8b:free)")
        choice = input("Select (1/2): ").strip()
        if choice == "1":
            print("\nInitializing local HuggingFace agent...")
            self.agent = TransmissionSystemAgent()
            print("Loading model (this may take a moment)...")
            self.agent.load_model()
            print("Local agent ready.\n")
            self.use_openrouter = False
        elif choice == "2":
            print("\nInitializing OpenRouter agent...")
            api_key = "sk-or-v1-1234567890"     # TODO: switch API key to the one from OpenRouter
            self.agent = OpenRouterAgent(api_key)
            print("OpenRouter agent ready.\n")
            self.use_openrouter = True
        else:
            print("Invalid selection.")
            return False
        return True

    def process_user_input(self, user_input: str) -> bool:
        user_input = user_input.strip()
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("\nGoodbye!")
            return False
        elif user_input.lower() == 'help':
            self.print_help()
            return True
        elif user_input.lower() == 'clear':
            if not self.use_openrouter:
                self.agent.conversation_history.clear()
            print("\nConversation history cleared.")
            return True
        elif user_input.lower() == 'history':
            self.show_history()
            return True
        elif not user_input:
            print("Please enter a question or command.")
            return True
        self.handle_chat_query(user_input)
        return True

    def show_history(self):
        if not self.use_openrouter and getattr(self.agent, "conversation_history", None):
            print(f"\nConversation History ({len(self.agent.conversation_history)} messages):")
            print("-" * 50)
            for i, entry in enumerate(self.agent.conversation_history[-5:], 1):
                print(f"\n{i}. User: {entry.user_message[:60]}{'...' if len(entry.user_message) > 60 else ''}")
                print(f"   Assistant: {entry.agent_response[:60]}{'...' if len(entry.agent_response) > 60 else ''}")
                if entry.function_calls:
                    print(f"   Functions: {len(entry.function_calls)} called")
        else:
            print("\nHistory unavailable for OpenRouter mode.")

    def handle_chat_query(self, user_input: str):
        try:
            print(f"\nAssistant: ", end="", flush=True)
            full_response = ""
            for token in self.agent.generate_response_stream(user_input):
                full_response += token
                print(token, end="", flush=True)
            print()
            # Only local agent has function execution
            if not self.use_openrouter:
                function_calls = self.agent.parse_function_calls(full_response)
                if function_calls:
                    print(f"\nExecuting {len(function_calls)} function(s)...")
                    execution_results = self.agent.execute_function_calls(function_calls)
                    results_summary = []
                    for i, result in enumerate(execution_results):
                        if result.success:
                            if isinstance(result.result_value, float):
                                if result.result_value < 0.001:
                                    value_str = f"{result.result_value:.2e}"
                                else:
                                    value_str = f"{result.result_value:.4f}"
                            else:
                                value_str = str(result.result_value)
                            results_summary.append(f"Function {i+1} ({function_calls[i].function_name}): {value_str}")
                        else:
                            results_summary.append(f"Function {i+1} ({function_calls[i].function_name}): Failed - {result.error_message}")
                    if any(r.success for r in execution_results):
                        follow_up_response = self.generate_clean_followup_response(user_input, function_calls, execution_results)
                        print(f"\nAssistant: {follow_up_response}")
                    else:
                        for summary in results_summary:
                            print(summary)
                conversation_entry = ConversationEntry(
                    user_message=user_input,
                    agent_response=full_response,
                    function_calls=function_calls if 'function_calls' in locals() else [],
                    timestamp=time.time()
                )
                self.agent.conversation_history.append(conversation_entry)
        except KeyboardInterrupt:
            print("\n\nResponse interrupted by user.")
        except Exception as e:
            print(f"\nError processing query: {str(e)}")

    def generate_clean_followup_response(self, user_query: str, function_calls: List[FunctionCall], execution_results: List[ExecutionResult]) -> str:
        try:
            successful_results = [r for r in execution_results if r.success]
            if not successful_results:
                return "The computation encountered errors. Please check your parameters and try again."
            if len(successful_results) > 2 and self._is_optimization_query(user_query, function_calls):
                return self._generate_optimization_response(user_query, function_calls, successful_results)
            elif len(successful_results) == 1:
                result = successful_results[0]
                func_call = function_calls[0]
                if isinstance(result.result_value, float):
                    if result.result_value < 0.001:
                        value_str = f"{result.result_value:.2e}"
                    else:
                        value_str = f"{result.result_value:.4f}"
                else:
                    value_str = str(result.result_value)
                if func_call.function_name == "computeErrorProbability":
                    return f"The error probability is {value_str}."
                elif func_call.function_name == "computeErrorExponent":
                    return f"The error exponent is {value_str}."
                elif func_call.function_name == "plotFromFunction":
                    return f"Plot generated successfully."
                else:
                    return f"The computed result is {value_str}."
            elif len(successful_results) == 2:
                result1, result2 = successful_results[0], successful_results[1]
                if isinstance(result1.result_value, float) and isinstance(result2.result_value, float):
                    val1_str = f"{result1.result_value:.4f}" if result1.result_value >= 0.001 else f"{result1.result_value:.2e}"
                    val2_str = f"{result2.result_value:.4f}" if result2.result_value >= 0.001 else f"{result2.result_value:.2e}"
                    if function_calls[0].function_name == "computeErrorProbability":
                        return f"The error probabilities are {val1_str} and {val2_str} respectively."
                    elif function_calls[0].function_name == "computeErrorExponent":
                        return f"The error exponents are {val1_str} and {val2_str} respectively."
                    else:
                        return f"The computed values are {val1_str} and {val2_str} respectively."
                else:
                    return "Multiple computations completed successfully."
            else:
                return f"All {len(successful_results)} computations completed successfully."
        except Exception as e:
            return "The computation completed successfully."

    def _is_optimization_query(self, user_query: str, function_calls: List[FunctionCall]) -> bool:
        optimization_keywords = [
            'what rate', 'what snr', 'find rate', 'find snr', 'need to get',
            'achieve', 'target', 'optimal', 'minimum', 'maximum'
        ]
        query_lower = user_query.lower()
        has_optimization_keywords = any(keyword in query_lower for keyword in optimization_keywords)
        if len(function_calls) > 2:
            first_func = function_calls[0].function_name
            same_function = all(fc.function_name == first_func for fc in function_calls)
            if same_function and first_func == "computeErrorProbability":
                rate_values = [fc.parameters.get('rate') for fc in function_calls if 'rate' in fc.parameters]
                snr_values = [fc.parameters.get('snr') for fc in function_calls if 'snr' in fc.parameters]
                varying_rates = len(set(rate_values)) > 1 if rate_values else False
                varying_snrs = len(set(snr_values)) > 1 if snr_values else False
                return has_optimization_keywords and (varying_rates or varying_snrs)
        return False

    def _generate_optimization_response(self, user_query: str, function_calls: List[FunctionCall], successful_results: List[ExecutionResult]) -> str:
        try:
            target_prob = self._extract_target_probability(user_query)
            best_result = None
            best_params = None
            best_difference = float('inf')
            for i, result in enumerate(successful_results):
                if isinstance(result.result_value, float):
                    difference = abs(result.result_value - target_prob) if target_prob else 0
                    if target_prob and difference < best_difference:
                        best_difference = difference
                        best_result = result.result_value
                        best_params = function_calls[i].parameters
            if best_result is not None and best_params:
                result_str = f"{best_result:.4f}" if best_result >= 0.001 else f"{best_result:.2e}"
                if 'rate' in best_params and any('rate' in fc.parameters and fc.parameters['rate'] != best_params['rate'] for fc in function_calls):
                    param_name = "rate"
                    param_value = best_params['rate']
                elif 'snr' in best_params and any('snr' in fc.parameters and fc.parameters['snr'] != best_params['snr'] for fc in function_calls):
                    param_name = "SNR"
                    param_value = best_params['snr']
                else:
                    param_name = "parameter"
                    param_value = "optimized"
                if target_prob:
                    return f"The closest result to target probability {target_prob:.3f} is {result_str} achieved with {param_name}={param_value}."
                else:
                    return f"Based on the search, the recommended {param_name} is {param_value} giving error probability {result_str}."
            else:
                return "Optimization search completed. Review the computed values to select the best parameter."
        except Exception as e:
            return "Parameter optimization completed successfully."

    def _extract_target_probability(self, user_query: str) -> Optional[float]:
        try:
            prob_matches = re.findall(r'0\.\d+', user_query)
            if prob_matches:
                return float(prob_matches[0])
            percent_matches = re.findall(r'(\d+(?:\.\d+)?)%', user_query)
            if percent_matches:
                return float(percent_matches[0]) / 100.0
        except:
            pass
        return None

    def run(self):
        self.print_welcome()
        if not self.initialize_agent():
            return
        self.running = True
        try:
            while self.running:
                try:
                    user_input = input("\nUser: ")
                    if not self.process_user_input(user_input):
                        break
                except KeyboardInterrupt:
                    print("\n\nInterrupted. Type 'quit' to exit gracefully.")
                    continue
                except EOFError:
                    print("\n\nGoodbye!")
                    break
        except Exception as e:
            print(f"\nUnexpected error: {str(e)}")
        finally:
            self.running = False

# ================= MAIN ====================
def main():
    chat_interface = TerminalChatInterface()
    chat_interface.run()

if __name__ == "__main__":
    main()