from typing import Optional, List, Dict, Any
from google.generativeai import ChatMessage, Model
from src.genner.Base import Genner
from src.types import ChatHistory, Message


class GeminiDirectGenner(Genner):
    """
    Genner implementation for direct connection to Gemini API.
    
    This class provides a direct interface to the Gemini API,
    allowing for generating responses using the Gemini model.
    """

    def __init__(self, model: Model, config: Dict[str, Any], stream_fn: Optional[callable] = None):
        """
        Initialize the GeminiDirectGenner.
        
        Args:
            model: The Gemini model instance
            config: Configuration dictionary containing model settings
            stream_fn: Optional streaming function for handling streamed responses
        """
        self.model = model
        self.config = config
        self.stream_fn = stream_fn

    def ch_completion(self, chat_history: ChatHistory) -> Result[str, str]:
        """
        Generate a response using Gemini based on the chat history.
        
        Args:
            chat_history: The chat history containing messages
            
        Returns:
            Result containing the generated response or an error message
        """
        try:
            # Convert chat history to Gemini format
            messages = []
            for msg in chat_history.messages:
                role = "user" if msg.role == "user" else "model"
                messages.append(ChatMessage(content=msg.content, role=role))

            # Generate response using Gemini
            response = self.model.chat(
                messages=messages,
                temperature=self.config.get("temperature", 0.7),
                max_output_tokens=self.config.get("max_tokens", 8192)
            )

            return Ok(response.text)

        except Exception as e:
            return Err(f"Error generating response with Gemini: {str(e)}")
