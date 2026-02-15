.PHONY: dev dev-backend dev-frontend setup-backend setup-frontend migrate

dev:
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && pnpm dev

setup-backend:
	cd backend && uv sync
	cd backend && uv run alembic upgrade head

setup-frontend:
	cd frontend && pnpm install

migrate:
	cd backend && uv run alembic upgrade head

new-migration:
	cd backend && uv run alembic revision --autogenerate -m "$(msg)"
