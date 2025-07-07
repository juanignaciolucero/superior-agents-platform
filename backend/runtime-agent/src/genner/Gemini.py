import re
from typing import Callable, List, Tuple

from vertexai.generative_models import GenerativeModel
from result import Err, Ok, Result
from src.config import GeminiConfig
from src.helper import extract_content
from src.types import ChatHistory
from src.client.gemini import get_gemini_client

from .Base import Genner


class GeminiGenner(Genner):
    def __init__(
        self,
        config: GeminiConfig,
        stream_fn: Callable[[str], None] | None,
    ):
        """
        Initialize the Gemini-based generator.

        Args:
            client (GenerativeModel): Vertex AI Generative Model client
            config (GeminiConfig): Configuration for the Gemini model
            stream_fn (Callable[[str], None] | None): Function to call with streamed tokens,
                or None to disable streaming
        """
        super().__init__("gemini_direct", True if stream_fn else False)
        self.config = config
        self.stream_fn = stream_fn
        self.client = get_gemini_client(config.api_key)

    def ch_completion(self, messages: ChatHistory) -> Result[str, str]:
        """
        Generate a completion using the Gemini API.

        Args:
            messages (ChatHistory): Chat history containing the conversation context

        Returns:
            Result[str, str]: Ok with the completion text or Err with error message
        """
        try:
            # Convertir mensajes al formato de Gemini
            gemini_messages = [
                {
                    "author": msg["role"],
                    "content": msg["content"]
                }
                for msg in messages
            ]

            # Obtener respuesta
            response = self.client.predict(
                messages=gemini_messages,
                model=self.model_config,
                stream=self.stream_fn is not None,
            )

            # Si hay streaming, procesar tokens
            if self.stream_fn:
                for chunk in response:
                    if chunk.text:
                        self.stream_fn(chunk.text)

            return Ok(response.text)

        except Exception as e:
            return Err(f"Error en la generación con Gemini: {str(e)}")

    def extract_code(self, response: str) -> Result[List[str], str]:
        """
        Extraer código del response de Gemini.

        Args:
            response (str): Respuesta del modelo

        Returns:
            Result[List[str], str]: Lista de bloques de código o error
        """
        try:
            # Usar regex para extraer código
            code_blocks = re.findall(r'```(.*?)```', response, re.DOTALL)
            return Ok(code_blocks)
        except Exception as e:
            return Err(f"Error al extraer código: {str(e)}")
