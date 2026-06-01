-- Neovim AI Configuration with NVIDIA Integration
-- Set up lazy.nvim plugin manager if not present

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--depth=1",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- Plugin configuration
require("lazy").setup({
  -- UI & Status
  { "nvim-lualine/lualine.nvim", dependencies = { "nvim-tree/nvim-web-devicons" } },
  { "folke/tokyonight.nvim" },
  
  -- AI Integration - CodeGen / CodeLlama support
  {
    "github/copilot.vim",
    config = function()
      -- Configure Copilot settings
      vim.g.copilot_no_tab_map = true
      vim.g.copilot_assume_mapped = true
      vim.g.copilot_filetypes = {
        python = true,
        javascript = true,
        typescript = true,
        lua = true,
        go = true,
        rust = true,
        cpp = true,
      }
    end
  },
  
  -- Alternative: CodeGPT.nvim for multiple AI providers
  {
    "CopilotC-Nvim/CopilotChat.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
    },
    config = function()
      local CopilotChat = require("CopilotChat")
      local actions = require("CopilotChat.actions")
      
      CopilotChat.setup({
        model = "gpt-4", -- or use nvidia endpoints
        auto_followup = false,
        show_system_prompt = true,
        show_filetype_header = false,
        mappings = {
          complete = {
            insert = "<Tab>",
          },
        },
      })
      
      -- Keybindings
      vim.keymap.set("n", "<leader>ai", ":CopilotChatInteractive<CR>", { noremap = true, silent = true })
      vim.keymap.set("n", "<leader>ad", ":CopilotChatDiagnostic<CR>", { noremap = true, silent = true })
    end
  },
})

-- Color scheme
vim.cmd("colorscheme tokyonight")

-- Status line
require("lualine").setup({
  options = {
    theme = "tokyonight",
    disabled_filetypes = { statusline = {} },
  }
})

-- NVIDIA AI API Configuration
-- To use NVIDIA's free tier API:
-- 1. Get your API key from: https://ngc.nvidia.com/
-- 2. Set environment variable: export NVIDIA_API_KEY="your-key-here"
-- 3. Or set it in this config (not recommended for security)

-- Configuration for NVIDIA NIM endpoints
vim.g.nvidia_api_key = os.getenv("NVIDIA_API_KEY") or ""
vim.g.nvidia_endpoint = "https://integrate.api.nvidia.com/v1"

-- Function to query NVIDIA AI
function QueryNvidiaAI(prompt, model)
  local api_key = os.getenv("NVIDIA_API_KEY")
  if not api_key or api_key == "" then
    vim.notify("NVIDIA_API_KEY not set. Get your free key at https://ngc.nvidia.com/", vim.log.levels.WARN)
    return nil
  end
  
  local endpoint = "https://integrate.api.nvidia.com/v1/chat/completions"
  model = model or "nvidia/llama-3.1-nemotron-70b-instruct"
  
  local curl_cmd = string.format(
    'curl -s -X POST "%s" ' ..
    '-H "Content-Type: application/json" ' ..
    '-H "Authorization: Bearer %s" ' ..
    '-d "{\\\"model\\\": \\\"%s\\\", \\\"messages\\\": [{\\\"role\\\": \\\"user\\\", \\\"content\\\": \\\"%s\\\"}], \\\"max_tokens\\\": 512}"',
    endpoint, api_key, model, vim.fn.shellescape(prompt)
  )
  
  return vim.fn.system(curl_cmd)
end

-- Command to set NVIDIA API key
vim.api.nvim_create_user_command("SetNvidiaKey", function(opts)
  vim.g.nvidia_api_key = opts.args
  vim.notify("NVIDIA API key set successfully", vim.log.levels.INFO)
end, { nargs = 1 })

-- Command to test NVIDIA connection
vim.api.nvim_create_user_command("NvidiaAI", function(opts)
  local response = QueryNvidiaAI(opts.args or "Hello, are you working?")
  if response then
    print(response)
  end
end, { nargs = "?" })

-- Status indicator for AI
vim.g.ai_enabled = false
vim.api.nvim_create_user_command("ToggleAI", function()
  vim.g.ai_enabled = not vim.g.ai_enabled
  local status = vim.g.ai_enabled and "enabled" or "disabled"
  vim.notify("AI features " .. status, vim.log.levels.INFO)
end, {})