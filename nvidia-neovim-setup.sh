#!/bin/bash
# NVIDIA AI + Neovim Quick Start Guide

echo "=================================="
echo "  NVIDIA AI + Neovim Setup Guide"
echo "=================================="
echo ""

echo "📋 INSTALLED COMPONENTS:"
echo "  ✓ Neovim v0.10.4"
echo "  ✓ lazy.nvim (plugin manager)"
echo "  ✓ Copilot.vim"
echo "  ✓ CopilotChat.nvim"
echo "  ✓ Tokyonight theme"
echo "  ✓ Lualine status bar"
echo ""

echo "🔑 GET YOUR FREE NVIDIA API KEY:"
echo "  1. Go to: https://ngc.nvidia.com/"
echo "  2. Sign up for free account"
echo "  3. Go to Setup > API Key"
echo "  4. Generate your key"
echo ""

echo "🚀 TO USE NVIDIA AI:"
echo ""
echo "  Option 1: Set environment variable (recommended)"
echo "  --------------------------------------------"
echo '  export NVIDIA_API_KEY="your-key-here"'
echo ""
echo "  Option 2: Set in current shell"
echo "  --------------------------------"
echo '  export NVIDIA_API_KEY="your-nvidia-api-key"'
echo ""
echo "  Option 3: Set permanently"
echo "  --------------------------------"
echo '  echo "export NVIDIA_API_KEY=your-key" >> ~/.bashrc'
echo '  source ~/.bashrc'
echo ""

echo "✨ KEYBINDINGS IN NEOVIM:"
echo "  <leader>ai  - Open CopilotChat interactive"
echo "  <leader>ad  - Show AI diagnostics"
echo "  :NvidiaAI   - Test NVIDIA AI query"
echo "  :ToggleAI   - Enable/disable AI features"
echo ""

echo "🧪 QUICK TEST:"
echo '  export NVIDIA_API_KEY="your-key"'
echo '  curl -s https://integrate.api.nvidia.com/v1/models \'
echo '    -H "Authorization: Bearer $NVIDIA_API_KEY"'
echo ""

echo "📝 NOTES:"
echo "  - NVIDIA free tier includes API access to multiple models"
echo "  - Models include: Llama 3, Mistral, Code Llama, etc."
echo "  - Rate limits apply (check NVIDIA docs for limits)"
echo ""