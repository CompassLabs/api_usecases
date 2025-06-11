define print_bold
	@echo "\033[1m$(1) [api] ...\033[0m"
endef

# Wipe python environment
clean:
	@$(call print_bold,Cleaning)
	@rm -f uv.lock || true
	@rm -rf .venv || true

# Install python environment from scratch
install:
	@$(call print_bold,Installing)
	@deactivate || true
	uv sync

# Run formatter
format:
	@$(call print_bold,Formatting)
	@.venv/bin/ruff check --fix
	@.venv/bin/ruff format
	@.venv/bin/docformatter -ir --wrap-summaries=88 --wrap-descriptions=88 compass

# Start up developer version of API
run:
	@$(call print_bold,Running)
	@.venv/bin/fastapi run --port 8000 compass/api_backend/app.py --reload

test-snippet:
	@$(call print_bold,Unit testing)
	@sed 's|<YOUR_API_KEY_HERE>|$(API_KEY)|g' aave/rate.py > /tmp/rate_temp.py
	@.venv/bin/python /tmp/rate_temp.py