default:
    @just --list

install:
    npm install

dev:
    npm run dev

build:
    npm run build

preview: build
    npm run preview
