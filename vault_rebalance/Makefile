# Run formatter
format:
	@$(call print_bold,Formatting)
	@.venv/bin/ruff check --fix
	@.venv/bin/ruff format
	@.venv/bin/docformatter -ir --wrap-summaries=88 --wrap-descriptions=88 compass

# Run pyright type checker
type-check:
	@$(call print_bold, Formatting)
	@deactivate || true
	@. .venv/bin/activate && pyright .
