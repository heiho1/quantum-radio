# Quantum Radio Makefile
# Provides convenient targets for development, production, and testing

.PHONY: help install dev dev-docker prod prod-docker test test-watch test-coverage clean build logs logs-prod stop stop-prod status

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show available make targets
	@echo "$(BLUE)Quantum Radio - Available Make Targets$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*Development' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Production:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*Production' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Testing:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*Test' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*Utility' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

# Installation and Setup
install: ## Install dependencies for development
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm install

# Development Targets
dev: ## Development: Start local development server with hot reload
	@echo "$(GREEN)Starting development server...$(NC)"
	npm run dev

dev-docker: ## Development: Start development server in Docker container
	@echo "$(GREEN)Starting development Docker container...$(NC)"
	npm run docker:up:dev

# Production Targets
prod: ## Production: Start production server locally
	@echo "$(GREEN)Starting production server...$(NC)"
	NODE_ENV=production npm start

prod-docker: ## Production: Start full production stack (Nginx + PostgreSQL + API)
	@echo "$(GREEN)Starting production Docker stack...$(NC)"
	npm run docker:up:prod

# Testing Targets
test: ## Test: Run all tests (backend and frontend)
	@echo "$(GREEN)Running all tests...$(NC)"
	npm test

test-watch: ## Test: Run tests in watch mode
	@echo "$(GREEN)Running tests in watch mode...$(NC)"
	npm run test:watch

test-coverage: ## Test: Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	npm run test:coverage

test-security: ## Test: Run security vulnerability audit
	@echo "$(GREEN)Running security audit...$(NC)"
	npm run test:security

test-security-fix: ## Test: Run security audit and attempt to fix vulnerabilities
	@echo "$(GREEN)Running security audit with auto-fix...$(NC)"
	npm run test:security:fix

test-all: ## Test: Run all tests including security audit
	@echo "$(GREEN)Running comprehensive test suite...$(NC)"
	@echo "$(BLUE)1. Running unit tests...$(NC)"
	npm test
	@echo "$(BLUE)2. Running security audit...$(NC)"
	npm run test:security
	@echo "$(GREEN)All tests completed!$(NC)"

# Build and Docker Targets
build: ## Utility: Build Docker images for production
	@echo "$(GREEN)Building Docker images...$(NC)"
	npm run docker:build

build-dev: ## Utility: Build Docker image for development
	@echo "$(GREEN)Building development Docker image...$(NC)"
	npm run docker:build:dev

# Logging and Monitoring
logs: ## Utility: Show logs from development Docker containers
	@echo "$(GREEN)Showing development container logs...$(NC)"
	npm run docker:logs

logs-prod: ## Utility: Show logs from production Docker stack
	@echo "$(GREEN)Showing production container logs...$(NC)"
	npm run docker:logs:prod

# Control Targets
stop: ## Utility: Stop development Docker containers
	@echo "$(GREEN)Stopping development containers...$(NC)"
	npm run docker:down

stop-prod: ## Utility: Stop production Docker stack
	@echo "$(GREEN)Stopping production stack...$(NC)"
	npm run docker:down:prod

status: ## Utility: Show Docker container status
	@echo "$(GREEN)Docker container status:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(quantum|postgres|nginx)" || echo "No Quantum Radio containers running"

# Cleanup Targets
clean: ## Utility: Clean up Docker resources and node modules
	@echo "$(GREEN)Cleaning up Docker resources...$(NC)"
	npm run docker:clean
	@echo "$(GREEN)Removing node_modules...$(NC)"
	rm -rf node_modules
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-docker: ## Utility: Clean up Docker resources only
	@echo "$(GREEN)Cleaning up Docker resources...$(NC)"
	npm run docker:clean

# Health Check
health: ## Utility: Check if services are running and healthy
	@echo "$(GREEN)Checking service health...$(NC)"
	@echo "Development (port 3001):"
	@curl -s http://localhost:3001/api/users > /dev/null && echo "  ✅ Development API is healthy" || echo "  ❌ Development API is not responding"
	@echo "Simple Production (port 3000):"
	@curl -s http://localhost:3000/api/users > /dev/null && echo "  ✅ Simple production API is healthy" || echo "  ❌ Simple production API is not responding"
	@echo "Full Production (port 80):"
	@curl -s http://localhost/api/users > /dev/null && echo "  ✅ Full production stack is healthy" || echo "  ❌ Full production stack is not responding"

# Quick Start Targets
quick-dev: install dev-docker ## Quick start: Install dependencies and start development environment
	@echo "$(GREEN)Development environment ready at http://localhost:3001$(NC)"

quick-prod: build prod-docker ## Quick start: Build images and start production environment
	@echo "$(GREEN)Production environment ready at http://localhost$(NC)"