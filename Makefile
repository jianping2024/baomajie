.PHONY: setup db-up db-down db-migrate db-seed dev-api dev-web test build

setup:
	npm run setup

db-up:
	npm run db:up

db-down:
	npm run db:down

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

dev-api:
	npm run dev:api

dev-web:
	npm run dev:web

test:
	npm run test

build:
	npm run build
