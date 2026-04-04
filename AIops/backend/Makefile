.PHONY: run build test lint tidy docker-build docker-up docker-down docker-logs

run:
	go run ./cmd/api/...

build:
	go build -o bin/api ./cmd/api/...

test:
	go test ./... -v -count=1

lint:
	golangci-lint run

tidy:
	go mod tidy

# Docker targets (run from AIops/ root, not backend/)
docker-build:
	cd .. && docker compose build

docker-up:
	cd .. && docker compose up -d

docker-down:
	cd .. && docker compose down

docker-logs:
	cd .. && docker compose logs -f api
