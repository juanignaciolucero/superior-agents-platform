#!/usr/bin/env python3
"""
Test script to verify the minimal agent runtime is working.
This script attempts to import and initialize the core agent components.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all essential imports work."""
    try:
        # Test core types
        from src.types import ChatHistory, Message
        print("✓ Core types imported successfully")
        
        # Test config
        from src.config import ClaudeConfig, DeepseekConfig, OAIConfig
        print("✓ Config classes imported successfully")
        
        # Test genner base
        from src.genner.Base import Genner
        print("✓ Genner base class imported successfully")
        
        # Test specific genner implementations
        from src.genner.Claude import ClaudeGenner
        from src.genner.OAI import OAIGenner
        print("✓ Genner implementations imported successfully")
        
        # Test agent classes
        from src.agent.trading import TradingAgent, TradingPromptGenerator
        from src.agent.marketing import MarketingAgent, MarketingPromptGenerator
        print("✓ Agent classes imported successfully")
        
        # Test flows
        from src.flows.trading import assisted_flow
        print("✓ Flow functions imported successfully")
        
        # Test database
        from src.db.interface import DBInterface
        print("✓ Database interface imported successfully")
        
        # Test helper functions
        from src.helper import nanoid, extract_content
        print("✓ Helper functions imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def test_basic_initialization():
    """Test basic initialization of core components."""
    try:
        # Test chat history
        from src.types import ChatHistory, Message
        chat_history = ChatHistory()
        chat_history.append(Message(role="user", content="Hello"))
        print("✓ ChatHistory initialization works")
        
        # Test prompt generator
        from src.agent.trading import TradingPromptGenerator
        prompt_gen = TradingPromptGenerator(None)
        print("✓ TradingPromptGenerator initialization works")
        
        # Test config
        from src.config import ClaudeConfig
        config = ClaudeConfig()
        print("✓ Config initialization works")
        
        return True
        
    except Exception as e:
        print(f"✗ Initialization error: {e}")
        return False

def main():
    """Main test function."""
    print("Testing minimal agent runtime...")
    print("=" * 50)
    
    success = True
    
    # Test imports
    print("\n1. Testing imports...")
    if not test_imports():
        success = False
    
    # Test basic initialization
    print("\n2. Testing basic initialization...")
    if not test_basic_initialization():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✓ All tests passed! Minimal agent runtime is working.")
        return 0
    else:
        print("✗ Some tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())