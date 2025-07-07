import re
from typing import Callable, List, Tuple

import yaml
from anthropic import Anthropic, TextEvent
from result import Err, Ok, Result
from src.config import ClaudeConfig
from src.helper import extract_content
from src.types import ChatHistory

from .Base import Genner


class ClaudeGenner(Genner):
	def __init__(
		self,
		client: Anthropic,
		config: ClaudeConfig,
		stream_fn: Callable[[str], None] | None,
	):
		"""
		Initialize the Claude-based generator.

		This constructor sets up the generator with Anthropic's Claude configuration
		and streaming function.

		Args:
			client (Anthropic): Anthropic API client
			config (ClaudeConfig): Configuration for the Claude model
			stream_fn (Callable[[str], None] | None): Function to call with streamed tokens,
				or None to disable streaming
		"""
		super().__init__("claude", True if stream_fn else False)
		self.client = client
		self.config = config
		self.stream_fn = stream_fn

	def ch_completion(self, messages: ChatHistory) -> Result[str, str]:
		"""
		Generate a completion using the Claude API.

		This method sends the chat history to the Claude API and retrieves
		a completion response, with optional streaming support. It separates
		the system message from the rest of the chat history.

		Args:
			messages (ChatHistory): Chat history containing the conversation context

		Returns:
			Result[str, str]:
				Ok(str): The generated text if successful
				Err(str): Error message if the API call fails
		"""
		system_message = messages.messages[0]
		assert system_message.role == "system"
		system = system_message.content
		ch = ChatHistory(messages.messages[1:])

		final_response = ""

		try:
			if self.do_stream:
				assert self.stream_fn is not None

				with self.client.messages.stream(
					model="claude-3-opus-20240229",
					max_tokens=1024,
					messages=ch.as_native(),  # type: ignore
					system=system,
				) as stream:
					token_counts = 0
					for chunk in stream:
						if isinstance(chunk, TextEvent):
							token = chunk.text
							final_response += token
							self.stream_fn(token)

							token_counts += 1
							if token_counts >= self.config.max_tokens:
								break
			else:
				response = self.client.messages.create(
					model=self.config.model,  # e.g. "claude-3-opus-20240229"
					messages=ch.as_native(),  # type: ignore
					max_tokens=self.config.max_tokens,
					system=system,
				)

				final_response = response.content[0].text  # type: ignore

			assert isinstance(final_response, str)
		except AssertionError as e:
			return Err(f"ClaudeGenner.ch_completion: {e}")
		except Exception as e:
			return Err(
				f"An unexpected Claude API error while generating code with {self.config.name}, occurred: \n{e}"
			)

		return Ok(final_response)

	def generate_code(
		self, messages: ChatHistory, blocks: List[str] = [""]
	) -> Result[Tuple[List[str], str], str]:
		"""
		Generate code using the Claude API.

		This method handles the complete process of generating code:
		1. Getting a completion from the model
		2. Extracting code blocks from the response

		Args:
			messages (ChatHistory): Chat history containing the conversation context
			blocks (List[str]): XML tag names to extract content from before processing into code

		Returns:
			Result[Tuple[List[str], str], str]:
				Ok(Tuple[List[str], str]): Tuple containing:
					- List[str]: Processed code blocks
					- str: Raw response from the model
				Err(str): Error message if generation failed
		"""
		raw_response = ""

		try:
			completion_result = self.ch_completion(messages)

			if err := completion_result.err():
				return (
					Ok((None, raw_response))
					if raw_response
					else Err(
						f"ClaudeGenner.{self.config.name}.generate_code: completion_result.is_err(): \n{err}"
					)
				)

			raw_response = completion_result.unwrap()
			# logger.error(f"Response: {raw_response}")

			extract_code_result = self.extract_code(raw_response, blocks)

			if err := extract_code_result.err():
				return Ok((None, raw_response))

			processed_code = extract_code_result.unwrap()
			return Ok((processed_code, raw_response))

		except Exception as e:
			return (
				Ok((None, raw_response))
				if raw_response
				else Err(
					f"ClaudeGenner.{self.config.name}.generate_code: An unexpected error occurred: \n{e}"
				)
			)

	def generate_list(
		self, messages: ChatHistory, blocks: List[str] = [""]
	) -> Result[Tuple[List[List[str]], str], str]:
		"""
		Generate lists using the Claude API.

		This method handles the complete process of generating structured lists:
		1. Getting a completion from the model
		2. Extracting lists from the response

		Args:
			messages (ChatHistory): Chat history containing the conversation context
			blocks (List[str]): XML tag names to extract content from before processing into lists

		Returns:
			Result[Tuple[List[List[str]], str], str]:
				Ok(Tuple[List[List[str]], str]): Tuple containing:
					- List[List[str]]: Processed lists of items
					- str: Raw response from the model
				Err(str): Error message if generation failed
		"""
		try:
			completion_result = self.ch_completion(messages)

			if err := completion_result.err():
				return Err(
					f"ClaudeGenner.generate_list: completion_result.is_err(): \n{err}"
				)

			raw_response = completion_result.unwrap()

			extract_list_result = self.extract_list(raw_response, blocks)

			if err := extract_list_result.err():
				return Err(
					f"ClaudeGenner.generate_list: extract_list_result.is_err(): \n{err}"
				)

			extracted_list = extract_list_result.unwrap()
		except Exception as e:
			return Err(
				f"An unexpected error while generating list with {self.config.name}, raw response: {raw_response} occurred: \n{e}"
			)

		return Ok((extracted_list, raw_response))

	@staticmethod
	def extract_code(response: str, blocks: List[str] = [""]) -> Result[List[str], str]:
		"""
		Extract code blocks from a Claude model response.

		This static method extracts Python code blocks from the raw model response
		using regex patterns to find code within markdown code blocks.

		Args:
			response (str): The raw response from the model
			blocks (List[str]): XML tag names to extract content from before processing into code

		Returns:
			Result[List[str], str]:
				Ok(List[str]): List of extracted code blocks
				Err(str): Error message if extraction failed
		"""
		extracts: List[str] = []

		for block in blocks:
			try:
				response = extract_content(response, block)
				regex_pattern = r"```python\n([\s\S]*?)```"
				code_match = re.search(regex_pattern, response, re.DOTALL)

				assert code_match is not None, "No code match found in the response"
				assert code_match.group(1) is not None, (
					"No code group number 1 found in the response"
				)

				code = code_match.group(1)
				assert isinstance(code, str), "Code is not a string"

				extracts.append(code)
			except AssertionError as e:
				return Err(f"ClaudeGenner.extract_code: Regex failed: {e}")
			except Exception as e:
				return Err(
					f"An unexpected error while extracting code occurred, raw response: {response}, error: \n{e}"
				)

		return Ok(extracts)

	@staticmethod
	def extract_list(
		response: str, blocks: List[str] = [""]
	) -> Result[List[List[str]], str]:
		"""
		Extract lists from a Claude model response.

		This static method extracts YAML-formatted lists from the raw model response
		using regex patterns to find YAML content within markdown code blocks.

		Args:
			response (str): The raw response from the model
			blocks (List[str]): XML tag names to extract content from before processing into lists

		Returns:
			Result[List[List[str]], str]:
				Ok(List[List[str]]): List of extracted lists
				Err(str): Error message if extraction failed
		"""
		extracts: List[List[str]] = []

		for block in blocks:
			try:
				response = extract_content(response, block)
				regex_pattern = r"```yaml\n(.*?)```"
				yaml_match = re.search(regex_pattern, response, re.DOTALL)

				assert yaml_match is not None, "No match found"
				yaml_content = yaml.safe_load(yaml_match.group(1).strip())
				assert isinstance(yaml_content, list), "Yaml content is not a list"
				assert all(isinstance(item, str) for item in yaml_content), (
					"All yaml content items must be strings"
				)

				extracts.append(yaml_content)
			except AssertionError as e:
				return Err(f"ClaudeGenner.extract_list: Assertion error: {e}")
			except Exception as e:
				return Err(
					f"An unexpected error while extracting code occurred, raw response: {response}, error: \n{e}"
				)

		return Ok(extracts)
