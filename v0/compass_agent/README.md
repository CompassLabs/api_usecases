# Compass AI

This is a very minimal example showing how an agent can be built on-top of the [langchain-compass](https://python.langchain.com/docs/integrations/tools/compass/) module, which is itself a wrapper around the [Compass API](TODO).

We also use this package to run evals on top of our agents, to give a better idea on the performace of our toolkit.

---
## Overview

The agent is defined in `agent.py`.

We can use arbitrary LLMs, but default to gpt-4o.

### CLI
Use it in the CLI via  
`python cli.py`

### Chat server
The chat server is a fastapi serving the agent.
It is reachable via  
`python server.py`

---
# Setup: 

A few `env` variables are required. See [`.env.example`](./.env.example).
