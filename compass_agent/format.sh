#!/bin/env bash
ruff format . && \
ruff check . && \
pyright .
